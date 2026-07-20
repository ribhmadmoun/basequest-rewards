"use client";

import Header from "@/components/Header";
import {
  getCurrentUserRank,
  getLeaderboard,
  type CurrentUserRank,
  type LeaderboardEntry,
} from "@/lib/supabase/leaderboard";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

type LeaderboardState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; entries: LeaderboardEntry[] };

function normalizeWalletAddress(walletAddress?: string | null) {
  return walletAddress?.toLowerCase() ?? null;
}

function formatWalletAddress(address: string) {
  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-card border border-glass-border bg-glass-bg p-4 backdrop-blur-xl sm:p-5"
        >
          <div className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-3 sm:grid-cols-[4rem_1fr_auto_auto] sm:gap-4">
            <div className="h-4 w-8 rounded bg-glass-border" />
            <div className="h-4 w-28 rounded bg-glass-border" />
            <div className="h-4 w-12 rounded bg-glass-border" />
            <div className="h-4 w-10 rounded bg-glass-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

function YourRankSkeleton() {
  return (
    <article className="animate-pulse rounded-card border border-glass-border bg-glass-bg p-5 backdrop-blur-xl sm:p-6">
      <div className="h-4 w-24 rounded bg-glass-border" />
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="h-8 rounded bg-glass-border" />
        <div className="h-8 rounded bg-glass-border" />
        <div className="h-8 rounded bg-glass-border" />
      </div>
    </article>
  );
}

export default function LeaderboardPage() {
  const { address } = useAccount();
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
        normalizeWalletAddress(entry.wallet_address) === normalizedWalletAddress,
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/4 size-72 rounded-badge bg-base-blue/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-1/3 size-56 rounded-badge bg-glass-bg blur-2xl"
      />

      <Header />

      <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-8 sm:gap-12 sm:px-6 sm:py-12">
        <section className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Leaderboard
          </p>
          <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            🏆 Leaderboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
            Top BaseQuest explorers
          </p>
        </section>

        <section>
          {leaderboardState.status === "loading" ? (
            <LeaderboardSkeleton />
          ) : null}

          {leaderboardState.status === "error" ? (
            <article className="rounded-card border border-glass-border bg-glass-bg p-6 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-8">
              <p className="font-sans text-base font-semibold text-text-primary sm:text-lg">
                Leaderboard unavailable
              </p>
            </article>
          ) : null}

          {leaderboardState.status === "empty" ? (
            <article className="rounded-card border border-glass-border bg-glass-bg p-6 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-8">
              <p className="font-sans text-base font-semibold text-text-primary sm:text-lg">
                No players yet
              </p>
            </article>
          ) : null}

          {leaderboardState.status === "ready" ? (
            <div className="overflow-hidden rounded-card border border-glass-border bg-glass-bg shadow-lg shadow-black/10 backdrop-blur-xl">
              <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-3 border-b border-glass-border px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-widest text-text-secondary sm:grid-cols-[4rem_1fr_auto_auto] sm:gap-4 sm:px-6 sm:py-4">
                <span>Rank</span>
                <span>Wallet</span>
                <span className="text-right">XP</span>
                <span className="text-right">Streak</span>
              </div>

              <div className="divide-y divide-glass-border">
                {leaderboardState.entries.map((entry, index) => {
                  const normalizedRowAddress = normalizeWalletAddress(
                    entry.wallet_address,
                  );
                  const isCurrentUser =
                    normalizedWalletAddress !== null &&
                    normalizedRowAddress === normalizedWalletAddress;

                  return (
                    <div
                      key={entry.wallet_address}
                      className={`grid grid-cols-[3rem_1fr_auto_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[4rem_1fr_auto_auto] sm:gap-4 sm:px-6 sm:py-5 ${
                        isCurrentUser
                          ? "bg-base-blue/20 ring-1 ring-inset ring-base-blue/40"
                          : ""
                      }`}
                    >
                      <span className="font-sans text-sm font-bold text-text-primary sm:text-base">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-text-primary sm:text-base">
                          {formatWalletAddress(entry.wallet_address)}
                        </p>
                        {isCurrentUser ? (
                          <span className="mt-1 inline-flex rounded-badge border border-glass-border bg-base-blue px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-text-primary">
                            You
                          </span>
                        ) : null}
                      </div>
                      <span className="text-right font-sans text-sm font-semibold text-text-primary sm:text-base">
                        {entry.total_xp}
                      </span>
                      <span className="text-right font-sans text-sm font-semibold text-text-secondary sm:text-base">
                        {entry.streak}
                      </span>
                    </div>
                  );
                })}
              </div>
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
              <article className="rounded-card border border-glass-border bg-glass-bg p-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Your Rank
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">
                      Rank
                    </p>
                    <p className="mt-1 font-sans text-2xl font-bold text-text-primary">
                      #{currentUserRank.rank}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">
                      XP
                    </p>
                    <p className="mt-1 font-sans text-2xl font-bold text-text-primary">
                      {currentUserRank.total_xp}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">
                      Streak
                    </p>
                    <p className="mt-1 font-sans text-2xl font-bold text-text-primary">
                      {currentUserRank.streak}
                    </p>
                  </div>
                </div>
              </article>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
