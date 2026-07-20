import { parseQuestIds, type QuestId } from "@/lib/quest-engine";
import { getSupabaseClient } from "@/lib/supabase/client";
import { logSupabaseError } from "@/lib/supabase/errors";

export type UserProfile = {
  wallet_address: string;
  total_xp: number;
  streak: number;
  completed_quests: QuestId[];
  created_at: string;
};

function normalizeWalletAddress(walletAddress: string) {
  return walletAddress.toLowerCase();
}

export async function getUserProfile(
  walletAddress: string,
): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    logSupabaseError(
      "getUserProfile",
      "client unavailable",
      new Error("Supabase client is not configured"),
      { walletAddress: normalizeWalletAddress(walletAddress) },
    );
    return null;
  }

  const normalizedAddress = normalizeWalletAddress(walletAddress);

  const { data, error } = await supabase
    .from("users")
    .select("wallet_address, total_xp, streak, completed_quests, created_at")
    .eq("wallet_address", normalizedAddress)
    .maybeSingle();

  if (error) {
    logSupabaseError("getUserProfile", "select", error, {
      walletAddress: normalizedAddress,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    wallet_address: data.wallet_address,
    total_xp: data.total_xp ?? 0,
    streak: data.streak ?? 0,
    completed_quests: parseQuestIds(data.completed_quests),
    created_at: data.created_at,
  };
}
