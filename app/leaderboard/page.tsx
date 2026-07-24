"use client";

import GlassPanel from "@/components/GlassPanel";
import PageShell from "@/components/PageShell";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import {
  getCurrentUserRank,
  getLeaderboard,
  type CurrentUserRank,
  type LeaderboardEntry,
} from "@/lib/supabase/leaderboard";
import { formatWalletAddress, ui } from "@/lib/ui-styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";

type LeaderboardState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; entries: LeaderboardEntry[] };

const PODIUM_ACCENTS = [
  {
    medal: "1",
    card: "border-amber-400/40 bg-gradient-to-b from-amber-400/20 via-[#12183a]/70 to-transparent shadow-[0_0_24px_rgba(251,191,36,0.18)]",
    rank: "text-amber-200",
    lift: "lg:mb-6",
  },
  {
    medal: "2",
    card: "border-slate-300/35 bg-gradient-to-b from-slate-300/15 via-[#12183a]/70 to-transparent shadow-[0_0_20px_rgba(203,213,225,0.12)]",
    rank: "text-slate-200",
    lift: "lg:mb-2 lg:mt-4",
  },
  {
    medal: "3",
    card: "border-orange-400/35 bg-gradient-to-b from-orange-500/15 via-[#12183a]/70 to-transparent shadow-[0_0_20px_rgba(234,88,12,0.14)]",
    rank: "text-orange-200",
    lift: "lg:mb-0 lg:mt-8",
  },
] as const;

function normalizeWalletAddress(walletAddress?: string | null) {
  return walletAddress?.toLowerCase() ?? null;
}

function getPodiumOrder(length: number) {
  if (length >= 3) {
    return [1, 0, 2];
  }

  if (length === 2) {
    return [1, 0];
  }

  return [0];
}

function getRowAccentClassName(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) {
    return "border-cyan-300/40 bg-cyan-500/10 shadow-[0_0_18px_rgba(34,211,238,0.2)]";
  }

  if (rank === 1) {
    return "border-amber-400/25 bg-amber-400/10";
  }

  if (rank === 2) {
    return "border-slate-300/20 bg-slate-300/5";
  }

  if (rank === 3) {
    return "border-orange-500/25 bg-orange-600/10";
  }

  return "border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.07]";
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="h-10 w-40 animate-pulse rounded-badge bg-white/10" />
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`${ui.glassCard} animate-pulse p-3 sm:p-4`}
          >
            <div className="mx-auto h-8 w-8 rounded-full bg-white/10" />
            <div className="mx-auto mt-3 h-3 w-20 rounded bg-white/10" />
            <div className="mx-auto mt-2 h-4 w-12 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className={`${ui.glassCard} animate-pulse p-3 sm:p-4`}
          >
            <div className="grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-2 sm:grid-cols-[3.5rem_1fr_auto_auto] sm:gap-4">
              <div className="h-4 w-8 rounded bg-white/10" />
              <div className="h-4 w-28 rounded bg-white/10" />
              <div className="h-4 w-10 rounded bg-white/10" />
              <div className="h-4 w-8 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YourRankSkeleton() {
  return (
    <article className={`${ui.glassCard} animate-pulse p-5 sm:p-6`}>
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="h-8 rounded bg-white/10" />
        <div className="h-8 rounded bg-white/10" />
        <div className="h-8 rounded bg-white/10" />
      </div>
    </article>
  );
}

type PodiumProps = {
  entries: LeaderboardEntry[];
  normalizedWalletAddress: string | null;
};

function PodiumSection({ entries, normalizedWalletAddress }: PodiumProps) {
  const topThree = entries.slice(0, 3);
  const podiumOrder = getPodiumOrder(topThree.length);

  if (topThree.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid items-end gap-2 sm:gap-3 ${
        topThree.length === 1
          ? "mx-auto max-w-[11rem] grid-cols-1"
          : topThree.length === 2
            ? "mx-auto max-w-md grid-cols-2"
            : "grid-cols-3"
      }`}
    >
      {podiumOrder.map((entryIndex) => {
        const entry = topThree[entryIndex];
        const rank = entryIndex + 1;
        const accent = PODIUM_ACCENTS[entryIndex];
        const isCurrentUser =
          normalizedWalletAddress !== null &&
          normalizeWalletAddress(entry.wallet_address) ===
            normalizedWalletAddress;

        return (
          <article
            key={entry.wallet_address}
            className={`relative flex flex-col items-center overflow-hidden rounded-2xl border p-3 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 sm:p-4 ${accent.card} ${accent.lift}`}
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-sans text-sm font-bold sm:size-9 sm:text-base ${accent.rank}`}
            >
              {accent.medal}
            </span>
            <p
              className={`mt-2 font-sans text-lg font-bold sm:text-xl ${accent.rank}`}
            >
              #{rank}
            </p>
            <p
              className="mt-2 w-full truncate font-mono text-[0.65rem] tracking-wide text-white sm:text-xs"
              title={entry.wallet_address}
            >
              {formatWalletAddress(entry.wallet_address)}
            </p>
            {isCurrentUser ? (
              <span className={`mt-2 ${ui.badgeYou}`}>You</span>
            ) : null}
            <div className="mt-3 flex w-full items-center justify-between gap-2 border-t border-white/10 pt-3 text-[0.65rem] sm:text-xs">
              <span className="font-semibold tabular-nums text-white">
                {entry.total_xp} XP
              </span>
              <span className="font-semibold tabular-nums text-white/60">
                {entry.streak}d
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { hydrated, progressReady, quests, handleQuestAction } = useQuestEngine();
  const hasCompletedViewLeaderboard = useRef(false);
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>({
    status: "loading",
  });
  const [currentUserRank, setCurrentUserRank] = useState<CurrentUserRank | null>(
    null,
  );
  const [currentUserLoading, setCurrentUserLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLeaderboardState({ status: "loading" });

      const entries = await getLeaderboard();
      if (cancelled) {
        return;
      }

      if (entries === null) {
        setLeaderboardState({ status: "error" });
        return;
      }

      if (entries.length === 0) {
        setLeaderboardState({ status: "empty" });
        return;
      }

      setLeaderboardState({ status: "ready", entries });
    }

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !progressReady || hasCompletedViewLeaderboard.current) {
      return;
    }

    const viewLeaderboardQuest = quests.find(
      (quest) => quest.id === "view-leaderboard",
    );

    if (!viewLeaderboardQuest || viewLeaderboardQuest.status !== "available") {
      return;
    }

    hasCompletedViewLeaderboard.current = true;
    handleQuestAction("view-leaderboard");
  }, [hydrated, progressReady, quests, handleQuestAction]);

  const normalizedWalletAddress = useMemo(
    () => normalizeWalletAddress(address),
    [address],
  );

  const isConnectedUserInTop50 = useMemo(() => {
    if (!normalizedWalletAddress || leaderboardState.status !== "ready") {
      return false;
    }

    return leaderboardState.entries.some(
      (entry) =>
        normalizeWalletAddress(entry.wallet_address) ===
        normalizedWalletAddress,
    );
  }, [normalizedWalletAddress, leaderboardState]);

  useEffect(() => {
    if (!normalizedWalletAddress || leaderboardState.status !== "ready") {
      setCurrentUserRank(null);
      setCurrentUserLoading(false);
      return;
    }

    if (isConnectedUserInTop50) {
      setCurrentUserRank(null);
      setCurrentUserLoading(false);
      return;
    }

    let cancelled = false;
    const walletAddress = normalizedWalletAddress;

    async function loadCurrentUserRank() {
      setCurrentUserLoading(true);
      const rank = await getCurrentUserRank(walletAddress);
      if (cancelled) {
        return;
      }

      setCurrentUserRank(rank);
      setCurrentUserLoading(false);
    }

    void loadCurrentUserRank();

    return () => {
      cancelled = true;
    };
  }, [normalizedWalletAddress, isConnectedUserInTop50, leaderboardState]);

  return (
    <PageShell>
      <section className="text-center sm:text-left">
        <p className={ui.sectionHeading}>Leaderboard</p>
        <h1 className={ui.pageTitle}>Leaderboard</h1>
        <p className={ui.pageSubtitle}>Top BaseQuest explorers</p>
      </section>

      <section>
        {leaderboardState.status === "loading" ? <LeaderboardSkeleton /> : null}

        {leaderboardState.status === "error" ? (
          <GlassPanel className="p-6 text-center sm:p-8">
            <p className={ui.messageTitle}>Leaderboard unavailable</p>
            <p className="mt-2 text-sm text-white/45">
              Please try again in a moment.
            </p>
          </GlassPanel>
        ) : null}

        {leaderboardState.status === "empty" ? (
          <GlassPanel className="p-6 text-center sm:p-8">
            <p className={ui.messageTitle}>No players yet</p>
            <p className="mt-2 text-sm text-white/45">
              Complete quests on the dashboard to claim the top spot.
            </p>
          </GlassPanel>
        ) : null}

        {leaderboardState.status === "ready" ? (
          <div className="space-y-5 sm:space-y-6">
            <GlassPanel className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
              <p className={ui.statLabel}>Total Players</p>
              <p className="font-sans text-lg font-bold tabular-nums text-white sm:text-xl">
                {leaderboardState.entries.length}
              </p>
            </GlassPanel>

            <PodiumSection
              entries={leaderboardState.entries}
              normalizedWalletAddress={normalizedWalletAddress}
            />

            <GlassPanel className="p-2 sm:p-3">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_2.5rem] gap-2 px-2 py-2 text-[0.6rem] font-semibold uppercase tracking-widest text-white/45 sm:grid-cols-[3.5rem_minmax(0,1fr)_4.5rem_3.5rem] sm:gap-4 sm:px-3 sm:py-3 sm:text-[0.65rem]">
                <span>Rank</span>
                <span>Wallet</span>
                <span className="text-right">XP</span>
                <span className="text-right">Streak</span>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                {leaderboardState.entries.map((entry, index) => {
                  const rank = index + 1;
                  const normalizedRowAddress = normalizeWalletAddress(
                    entry.wallet_address,
                  );
                  const isCurrentUser =
                    normalizedWalletAddress !== null &&
                    normalizedRowAddress === normalizedWalletAddress;

                  return (
                    <div
                      key={entry.wallet_address}
                      className={`grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_2.5rem] items-center gap-2 rounded-2xl border px-2 py-3 transition-all duration-300 sm:grid-cols-[3.5rem_minmax(0,1fr)_4.5rem_3.5rem] sm:gap-4 sm:px-3 sm:py-3.5 ${getRowAccentClassName(rank, isCurrentUser)}`}
                    >
                      <span className="font-sans text-xs font-bold tabular-nums text-white sm:text-sm">
                        #{rank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <p
                            className="truncate font-mono text-xs tracking-wide text-white sm:text-sm"
                            title={entry.wallet_address}
                          >
                            {formatWalletAddress(entry.wallet_address)}
                          </p>
                          {isCurrentUser ? (
                            <span className={ui.badgeYou}>You</span>
                          ) : null}
                        </div>
                      </div>
                      <span className="text-right font-sans text-xs font-semibold tabular-nums text-white sm:text-sm">
                        {entry.total_xp}
                      </span>
                      <span className="text-right font-sans text-xs font-semibold tabular-nums text-white/60 sm:text-sm">
                        {entry.streak}
                      </span>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </div>
        ) : null}
      </section>

      {normalizedWalletAddress &&
      leaderboardState.status === "ready" &&
      !isConnectedUserInTop50 ? (
        <section>
          {currentUserLoading ? (
            <YourRankSkeleton />
          ) : currentUserRank ? (
            <GlassPanel interactive className="p-5 sm:p-6">
              <p className={ui.sectionHeading}>Your Rank</p>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className={ui.statLabel}>Rank</p>
                  <p className="mt-1 font-sans text-xl font-bold tabular-nums text-white sm:text-2xl">
                    #{currentUserRank.rank}
                  </p>
                </div>
                <div>
                  <p className={ui.statLabel}>XP</p>
                  <p className="mt-1 font-sans text-xl font-bold tabular-nums text-white sm:text-2xl">
                    {currentUserRank.total_xp}
                  </p>
                </div>
                <div>
                  <p className={ui.statLabel}>Streak</p>
                  <p className="mt-1 font-sans text-xl font-bold tabular-nums text-white sm:text-2xl">
                    {currentUserRank.streak}
                  </p>
                </div>
              </div>
            </GlassPanel>
          ) : null}
        </section>
      ) : null}
    </PageShell>
  );
}
