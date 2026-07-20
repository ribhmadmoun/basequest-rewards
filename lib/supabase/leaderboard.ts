import { getSupabaseClient } from "@/lib/supabase/client";
import { logSupabaseError } from "@/lib/supabase/errors";

export type LeaderboardEntry = {
  wallet_address: string;
  total_xp: number;
  streak: number;
};

export type CurrentUserRank = {
  rank: number;
  wallet_address: string;
  total_xp: number;
  streak: number;
};

function normalizeWalletAddress(walletAddress: string) {
  return walletAddress.toLowerCase();
}

export async function getLeaderboard(): Promise<LeaderboardEntry[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    logSupabaseError(
      "getLeaderboard",
      "client unavailable",
      new Error("Supabase client is not configured"),
    );
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("wallet_address, total_xp, streak")
    .order("total_xp", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseError("getLeaderboard", "select", error);
    return null;
  }

  return data ?? [];
}

export async function getCurrentUserRank(
  walletAddress: string,
): Promise<CurrentUserRank | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    logSupabaseError(
      "getCurrentUserRank",
      "client unavailable",
      new Error("Supabase client is not configured"),
      { walletAddress: normalizeWalletAddress(walletAddress) },
    );
    return null;
  }

  const normalizedAddress = normalizeWalletAddress(walletAddress);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("wallet_address, total_xp, streak")
    .eq("wallet_address", normalizedAddress)
    .maybeSingle();

  if (userError) {
    logSupabaseError("getCurrentUserRank", "select user", userError, {
      walletAddress: normalizedAddress,
    });
    return null;
  }

  if (!user) {
    return null;
  }

  const { count, error: countError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("total_xp", user.total_xp);

  if (countError) {
    logSupabaseError("getCurrentUserRank", "count rank", countError, {
      walletAddress: normalizedAddress,
    });
    return null;
  }

  return {
    rank: (count ?? 0) + 1,
    wallet_address: user.wallet_address,
    total_xp: user.total_xp,
    streak: user.streak,
  };
}
