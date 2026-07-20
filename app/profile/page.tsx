"use client";

import LevelProgressBar from "@/components/LevelProgressBar";
import PageShell from "@/components/PageShell";
import { getLevel } from "@/lib/levels";
import { QUEST_DEFINITIONS, type QuestId } from "@/lib/quest-engine";
import { getCurrentUserRank } from "@/lib/supabase/leaderboard";
import { getUserProfile, type UserProfile } from "@/lib/supabase/profile";
import { formatWalletAddress, ui } from "@/lib/ui-styles";
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

function getWalletAvatarLabel(address: string) {
  return address.slice(2, 4).toUpperCase();
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
    <div className="flex flex-col gap-8 sm:gap-10">
      <article className={`${ui.glassCard} animate-pulse p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="size-20 shrink-0 rounded-full bg-glass-border sm:size-24" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-40 rounded bg-glass-border" />
            <div className="h-4 w-32 rounded bg-glass-border" />
            <div className="h-2.5 w-full rounded-badge bg-glass-border" />
          </div>
        </div>
      </article>

      <div className={ui.gridStats}>
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={index}
            className={`${ui.glassCard} min-h-[8.5rem] animate-pulse p-5 sm:p-6`}
          >
            <div className="h-4 w-20 rounded bg-glass-border" />
            <div className="mt-4 h-8 w-14 rounded bg-glass-border" />
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
    <PageShell>
      <section className="text-center sm:text-left">
        <p className={ui.sectionHeading}>Profile</p>
        <h1 className={ui.pageTitle}>Your Profile</h1>
        <p className={ui.pageSubtitle}>
          Track your XP, streak, and achievements.
        </p>
      </section>

      {!normalizedWalletAddress ? (
        <article className={ui.messageCard}>
          <p className={ui.messageTitle}>Connect your wallet</p>
          <p className="mt-2 text-sm text-text-muted">
            Connect your wallet to view your profile and progress.
          </p>
        </article>
      ) : null}

      {normalizedWalletAddress && profileState.status === "loading" ? (
        <ProfileSkeleton />
      ) : null}

      {normalizedWalletAddress && profileState.status === "error" ? (
        <article className={ui.messageCard}>
          <p className={ui.messageTitle}>Unable to load profile</p>
          <p className="mt-2 text-sm text-text-muted">
            Please try again in a moment.
          </p>
        </article>
      ) : null}

      {normalizedWalletAddress && profileState.status === "ready" ? (
        <>
          <section>
            <article className={`${ui.glassCard} p-5 sm:p-6`}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div
                  aria-hidden
                  className="mx-auto flex size-20 shrink-0 items-center justify-center rounded-full border border-glass-border bg-gradient-to-br from-base-blue to-gradient-to text-xl font-bold text-text-primary shadow-[0_0_24px_rgba(0,82,255,0.35)] sm:mx-0 sm:size-24 sm:text-2xl"
                >
                  {getWalletAvatarLabel(profileState.profile.wallet_address)}
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className={ui.sectionHeading}>Connected Wallet</p>
                  <p
                    className="mt-1.5 truncate font-mono text-lg font-semibold tracking-wide text-text-primary sm:text-xl"
                    title={profileState.profile.wallet_address}
                  >
                    {formatWalletAddress(profileState.profile.wallet_address)}
                  </p>
                  <p className="mt-1.5 text-sm text-text-muted">
                    Member since{" "}
                    {formatMemberSince(profileState.profile.created_at)}
                  </p>
                  <div className="mt-4">
                    <LevelProgressBar
                      totalXp={profileState.profile.total_xp}
                      showDetails
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  aria-live="polite"
                  className={`shrink-0 self-center rounded-badge border px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-widest transition-all duration-200 sm:self-start sm:px-4 ${
                    copied
                      ? "border-emerald-400/50 bg-emerald-500/20 text-text-primary shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "border-glass-border bg-glass-bg text-text-primary hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </article>
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Stats</p>
              <h2 className={ui.sectionTitle}>Your Stats</h2>
            </div>

            <div className={ui.gridStats}>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>⭐ Total XP</p>
                <p className={ui.statValue}>{profileState.profile.total_xp}</p>
              </article>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>🎯 Current Level</p>
                <div className="mt-auto flex flex-col pt-3">
                  <p className="font-sans text-2xl font-bold tabular-nums tracking-tight text-text-primary sm:text-3xl">
                    Level {getLevel(profileState.profile.total_xp)}
                  </p>
                  <LevelProgressBar totalXp={profileState.profile.total_xp} />
                </div>
              </article>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>🔥 Streak</p>
                <p className={ui.statValue}>{profileState.profile.streak}</p>
              </article>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>🏆 Rank</p>
                <p className={ui.statValue}>
                  {profileState.rank ? `#${profileState.rank}` : "—"}
                </p>
              </article>
            </div>
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Badges</p>
              <h2 className={ui.sectionTitle}>Achievements</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {PROFILE_BADGES.map((badge) => {
                const unlocked = badge.isUnlocked(profileState.profile);

                return (
                  <article
                    key={badge.id}
                    className={`flex min-h-[6.5rem] flex-col items-center justify-center rounded-card border p-4 text-center shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-200 sm:min-h-[7rem] sm:p-5 ${
                      unlocked
                        ? "border-base-blue/50 bg-base-blue/15 hover:border-base-blue/70 hover:shadow-[0_0_16px_rgba(0,82,255,0.25)]"
                        : "border-glass-border bg-glass-bg/60 opacity-60 hover:opacity-75"
                    }`}
                  >
                    <span className="text-lg sm:text-xl" aria-hidden>
                      {unlocked ? "🏅" : "🔒"}
                    </span>
                    <p
                      className={`mt-2 text-[0.6rem] font-semibold uppercase tracking-widest sm:text-[0.65rem] ${
                        unlocked ? "text-text-primary" : "text-text-muted"
                      }`}
                    >
                      {badge.label}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Activity</p>
              <h2 className={ui.sectionTitle}>Completed Quests</h2>
            </div>

            <article className={`${ui.glassCard} p-4 sm:p-5`}>
              {profileState.profile.completed_quests.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted sm:py-8 sm:text-base">
                  No completed quests yet. Start earning on the dashboard.
                </p>
              ) : (
                <ul className="space-y-2 sm:space-y-2.5">
                  {profileState.profile.completed_quests.map((questId) => (
                    <li
                      key={questId}
                      className="flex items-center gap-3 rounded-card border border-glass-border bg-white/[0.04] px-3 py-3 transition-all hover:border-white/20 hover:bg-white/[0.06] sm:gap-4 sm:px-4 sm:py-3.5"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-base-blue/40 bg-base-blue/20 text-sm font-bold text-text-primary sm:size-9">
                        ✓
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-text-primary sm:text-base">
                        {getQuestName(questId)}
                      </span>
                      <span className="shrink-0 rounded-badge border border-glass-border bg-glass-bg px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-widest text-text-secondary sm:text-[0.6rem]">
                        Done
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
