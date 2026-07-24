import { NextResponse } from "next/server";
import {
  completeOneTimeQuest,
  QUEST_DEFINITIONS,
  type QuestProgress,
} from "@/lib/quest-engine";
import {
  fetchOrCreateUser,
  saveUserProgress,
  userRowToProgress,
} from "@/lib/supabase/users";
import {
  isValidWalletAddress,
  normalizeWalletAddress,
} from "@/lib/x/config";
import {
  doesUserFollowTarget,
  fetchTargetXUserId,
} from "@/lib/x/api";
import { readXSessionCookie } from "@/lib/x/session";

type VerifyBody = {
  wallet?: string;
};

/**
 * POST /api/auth/x/verify-follow
 * Body: { wallet: "0x..." }
 *
 * Checks whether the linked X account follows @bqrbase.
 * On success: completes follow-x quest and awards XP via quest engine.
 */
export async function POST(request: Request) {
  try {
    let body: VerifyBody = {};
    try {
      body = (await request.json()) as VerifyBody;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const wallet = body.wallet;
    if (!wallet || !isValidWalletAddress(wallet)) {
      return NextResponse.json(
        { error: "valid_wallet_required" },
        { status: 400 },
      );
    }

    const walletAddress = normalizeWalletAddress(wallet);
    const session = await readXSessionCookie();

    if (
      !session ||
      normalizeWalletAddress(session.walletAddress) !== walletAddress
    ) {
      return NextResponse.json(
        { status: "not_authenticated" },
        { status: 401 },
      );
    }

    const targetUserId = await fetchTargetXUserId();
    const following = await doesUserFollowTarget({
      accessToken: session.accessToken,
      sourceUserId: session.xUserId,
      targetUserId,
    });

    if (!following) {
      return NextResponse.json({ status: "not_following" });
    }

    const user = await fetchOrCreateUser(walletAddress);
    let progress: QuestProgress = user
      ? userRowToProgress(user)
      : {
          totalXp: 0,
          streak: 0,
          lastCheckInDate: null,
          completedQuestIds: [],
        };

    const alreadyCompleted = progress.completedQuestIds.includes("follow-x");
    if (!alreadyCompleted) {
      progress = completeOneTimeQuest(
        progress,
        "follow-x",
        QUEST_DEFINITIONS,
      );

      try {
        await saveUserProgress(walletAddress, progress);
      } catch (saveError) {
        console.error("[x/verify-follow] saveUserProgress", saveError);
        // Still return completed so client can apply local progress.
      }
    }

    return NextResponse.json({
      status: "completed",
      alreadyCompleted,
      progress: {
        totalXp: progress.totalXp,
        streak: progress.streak,
        lastCheckInDate: progress.lastCheckInDate,
        completedQuestIds: progress.completedQuestIds,
      },
      xUsername: session.xUsername,
    });
  } catch (error) {
    console.error("[x/verify-follow] exact exception:", error);
    if (error instanceof Error) {
      console.error("[x/verify-follow] message:", error.message);
      console.error("[x/verify-follow] stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
