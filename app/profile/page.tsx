"use client";

import Header from "@/components/Header";
import LevelProgressBar from "@/components/LevelProgressBar";
import { QUEST_DEFINITIONS, type QuestId } from "@/lib/quest-engine";
import { getCurrentUserRank } from "@/lib/supabase/leaderboard";
import { getUserProfile, type UserProfile } from "@/lib/supabase/profile";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

type ProfileState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; profile: UserProfile; rank: number | null };

type BadgeDefinition = {
  id: string;
  label: string;
  isUnlocked: (profile: UserProfile) => boolean;
};

const PROFILE_BADGES: BadgeDefinition[] = [
  {
    id: "first-quest",
    label: "First Quest",
    isUnlocked: (profile) => profile.completed_quests.length >= 1,
  },
  {
    id: "100-xp",
    label: "100 XP",
    isUnlocked: (profile) => profile.total_xp >= 100,
  },
  {
    id: "500-xp",
    label: "500 XP",
    isUnlocked: (profile) => profile.total_xp >= 500,
  },
  {
    id: "7-day-streak",
    label: "7 Day Streak",
    isUnlocked: (profile) => profile.streak >= 7,
  },
  {
    id: "30-day-streak",
    label: "30 Day Streak",
    isUnlocked: (profile) => profile.streak >= 30,
  },
];

function normalizeWalletAddress(walletAddress?: string | null) {
  return walletAddress?.toLowerCase() ?? null;
}

function formatWalletAddress(address: string) {
  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatMemberSince(createdAt: string) {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getQuestName(questId: QuestId) {
  return (
    QUEST_DEFINITIONS.find((quest) => quest.id === questId)?.title ?? questId
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <article className="animate-pulse rounded-card border border-glass-border bg-glass-bg p-5 backdrop-blur-xl sm:p-6">
        <div className="h-4 w-28 rounded bg-glass-border" />
        <div className="mt-4 flex items-center gap-4">
          <div className="size-16 rounded-card bg-glass-border sm:size-20" />
          <div className="h-8 w-32 rounded bg-glass-border" />
        </div>
        <div className="mt-4 h-4 w-40 rounded bg-glass-border" />
        <div className="mt-3 h-2.5 w-full rounded-badge bg-glass-border" />
      </article>

      <article className="animate-pulse rounded-card border border-glass-border bg-glass-bg p-5 backdrop-blur-xl sm:p-6">
        <div className="h-4 w-20 rounded bg-glass-border" />
        <div className="mt-4 h-8 w-48 rounded bg-glass-border" />
        <div className="mt-3 h-4 w-32 rounded bg-glass-border" />
      </article>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={index}
            className="animate-pulse rounded-card border border-glass-border bg-glass-bg p-5 backdrop-blur-xl sm:p-6"
          >
            <div className="h-4 w-24 rounded bg-glass-border" />
            <div className="mt-3 h-8 w-16 rounded bg-glass-border" />
          </article>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { address } = useAccount();
  const normalizedWalletAddress = useMemo(
    () => normalizeWalletAddress(address),
    [address],
  );
  const [profileState, setProfileState] = useState<ProfileState>({
    status: "loading",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!normalizedWalletAddress) {
      return;
    }

    let cancelled = false;
    const walletAddress = normalizedWalletAddress;

    async function loadProfile() {
      setProfileState({ status: "loading" });

      const [profile, rankResult] = await Promise.all([
        getUserProfile(walletAddress),
        getCurrentUserRank(walletAddress),
      ]);

      if (cancelled) {
        return;
      }

      if (!profile) {
        setProfileState({ status: "error" });
        return;
      }

      setProfileState({
        status: "ready",
        profile,
        rank: rankResult?.rank ?? null,
      });
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [normalizedWalletAddress]);

  async function handleCopyAddress() {
    if (!address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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
            Profile
          </p>
          <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Profile
          </h1>
        </section>

        {!normalizedWalletAddress ? (
          <article className="rounded-card border border-glass-border bg-glass-bg p-6 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-8">
            <p className="font-sans text-base font-semibold text-text-primary sm:text-lg">
              Connect your wallet to view your profile.
            </p>
          </article>
        ) : null}

        {normalizedWalletAddress && profileState.status === "loading" ? (
          <ProfileSkeleton />
        ) : null}

        {normalizedWalletAddress && profileState.status === "error" ? (
          <article className="rounded-card border border-glass-border bg-glass-bg p-6 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-8">
            <p className="font-sans text-base font-semibold text-text-primary sm:text-lg">
              Unable to load profile.
            </p>
          </article>
        ) : null}

        {normalizedWalletAddress && profileState.status === "ready" ? (
          <>
            <section>
              <article className="rounded-card border border-glass-border bg-glass-bg p-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6">
                <LevelProgressBar
                  totalXp={profileState.profile.total_xp}
                  showDetails
                />
              </article>
            </section>

            <section>
              <article className="rounded-card border border-glass-border bg-glass-bg p-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Connected wallet
                </p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-lg font-semibold text-text-primary sm:text-xl">
                      {formatWalletAddress(profileState.profile.wallet_address)}
                    </p>
                    <p className="mt-2 text-sm text-text-muted">
                      Member since{" "}
                      {formatMemberSince(profileState.profile.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="rounded-badge border border-glass-border bg-glass-bg px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-widest text-text-primary transition-opacity hover:opacity-90"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </article>
            </section>

            <section>
              <div className="mb-5 sm:mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Stats
                </p>
                <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                  Your Stats
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-card border border-glass-border bg-glass-bg p-5 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6 sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    ⭐ Total XP
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                    {profileState.profile.total_xp}
                  </p>
                </article>
                <article className="rounded-card border border-glass-border bg-glass-bg p-5 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6 sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    🔥 Current Streak
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                    {profileState.profile.streak}
                  </p>
                </article>
                <article className="rounded-card border border-glass-border bg-glass-bg p-5 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6 sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    ✅ Completed Quests
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                    {profileState.profile.completed_quests.length}
                  </p>
                </article>
                <article className="rounded-card border border-glass-border bg-glass-bg p-5 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6 sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    🏆 Current Rank
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                    {profileState.rank ? `#${profileState.rank}` : "—"}
                  </p>
                </article>
              </div>
            </section>

            <section>
              <div className="mb-5 sm:mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Badges
                </p>
                <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                  Achievements
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {PROFILE_BADGES.map((badge) => {
                  const unlocked = badge.isUnlocked(profileState.profile);

                  return (
                    <span
                      key={badge.id}
                      className={`rounded-badge border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-widest shadow-sm ${
                        unlocked
                          ? "border-glass-border bg-base-blue text-text-primary"
                          : "border-glass-border bg-glass-bg text-text-muted opacity-60"
                      }`}
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-5 sm:mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Activity
                </p>
                <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                  Completed Quests
                </h2>
              </div>

              <article className="rounded-card border border-glass-border bg-glass-bg p-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6">
                {profileState.profile.completed_quests.length === 0 ? (
                  <p className="text-sm text-text-muted sm:text-base">
                    No completed quests yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {profileState.profile.completed_quests.map((questId) => (
                      <li
                        key={questId}
                        className="flex items-center gap-3 text-sm text-text-primary sm:text-base"
                      >
                        <span className="font-semibold text-base-blue">✓</span>
                        <span>{getQuestName(questId)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
