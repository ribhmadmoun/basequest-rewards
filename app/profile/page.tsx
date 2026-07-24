"use client";

import GlassPanel from "@/components/GlassPanel";
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
          <div className="size-20 shrink-0 rounded-full bg-white/10 sm:size-24" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-40 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-2.5 w-full rounded-badge bg-white/10" />
          </div>
        </div>
      </article>

      <div className={ui.gridStats}>
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={index}
            className={`${ui.glassCard} min-h-[9rem] animate-pulse p-5 sm:p-6`}
          >
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="mt-4 h-8 w-14 rounded bg-white/10" />
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
        <GlassPanel className="p-6 text-center sm:p-8">
          <p className={ui.messageTitle}>Connect your wallet</p>
          <p className="mt-2 text-sm text-white/45">
            Connect your wallet to view your profile and progress.
          </p>
        </GlassPanel>
      ) : null}

      {normalizedWalletAddress && profileState.status === "loading" ? (
        <ProfileSkeleton />
      ) : null}

      {normalizedWalletAddress && profileState.status === "error" ? (
        <GlassPanel className="p-6 text-center sm:p-8">
          <p className={ui.messageTitle}>Unable to load profile</p>
          <p className="mt-2 text-sm text-white/45">
            Please try again in a moment.
          </p>
        </GlassPanel>
      ) : null}

      {normalizedWalletAddress && profileState.status === "ready" ? (
        <>
          <section>
            <GlassPanel className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div
                  aria-hidden
                  className="mx-auto flex size-20 shrink-0 items-center justify-center rounded-full border border-cyan-200/25 bg-gradient-to-br from-base-blue via-indigo-600 to-violet-700 text-xl font-bold text-white shadow-[0_0_24px_rgba(0,82,255,0.4)] sm:mx-0 sm:size-24 sm:text-2xl"
                >
                  {getWalletAvatarLabel(profileState.profile.wallet_address)}
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className={ui.sectionHeading}>Connected Wallet</p>
                  <p
                    className="mt-1.5 truncate font-mono text-lg font-semibold tracking-wide text-white sm:text-xl"
                    title={profileState.profile.wallet_address}
                  >
                    {formatWalletAddress(profileState.profile.wallet_address)}
                  </p>
                  <p className="mt-1.5 text-sm text-white/45">
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
                      ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "border-white/12 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </GlassPanel>
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Stats</p>
              <h2 className={ui.sectionTitle}>Your Stats</h2>
            </div>

            <div className={ui.gridStats}>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>Total XP</p>
                <p className={ui.statValue}>{profileState.profile.total_xp}</p>
              </article>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>Current Level</p>
                <div className="mt-auto flex flex-col pt-3">
                  <p className="font-sans text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
                    Level {getLevel(profileState.profile.total_xp)}
                  </p>
                  <LevelProgressBar totalXp={profileState.profile.total_xp} />
                </div>
              </article>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>Streak</p>
                <p className={ui.statValue}>{profileState.profile.streak}</p>
              </article>
              <article className={ui.statCard}>
                <p className={ui.statLabel}>Rank</p>
                <p className={ui.statValue}>
                  {profileState.rank ? `#${profileState.rank}` : "—"}
                </p>
              </article>
            </div>
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Milestones</p>
              <h2 className={ui.sectionTitle}>Achievements</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {PROFILE_BADGES.map((badge) => {
                const unlocked = badge.isUnlocked(profileState.profile);

                return (
                  <article
                    key={badge.id}
                    className={`relative flex min-h-[6.5rem] flex-col items-center justify-center overflow-hidden rounded-2xl border p-4 text-center shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 sm:min-h-[7rem] sm:p-5 ${
                      unlocked
                        ? "border-white/14 bg-white/[0.05] hover:border-violet-300/30 hover:bg-white/[0.07]"
                        : "border-white/[0.06] bg-white/[0.02] opacity-50 hover:opacity-70"
                    }`}
                  >
                    <p
                      className={`text-[0.6rem] font-semibold uppercase tracking-[0.16em] sm:text-[0.65rem] ${
                        unlocked ? "text-white/85" : "text-white/40"
                      }`}
                    >
                      {badge.label}
                    </p>
                    <p className="mt-3 text-[0.55rem] font-semibold uppercase tracking-widest text-white/45">
                      {unlocked ? "Unlocked" : "Locked"}
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

            <GlassPanel secondary className="p-4 sm:p-5">
              {profileState.profile.completed_quests.length === 0 ? (
                <p className="py-6 text-center text-sm text-white/45 sm:py-8 sm:text-base">
                  No completed quests yet. Start earning on the dashboard.
                </p>
              ) : (
                <ul className="space-y-2 sm:space-y-2.5">
                  {profileState.profile.completed_quests.map((questId) => (
                    <li
                      key={questId}
                      className={`flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5 ${ui.glassRow}`}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-500/15 text-sm font-bold text-cyan-100 sm:size-9">
                        ✓
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-white sm:text-base">
                        {getQuestName(questId)}
                      </span>
                      <span className="shrink-0 rounded-badge border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-widest text-emerald-100 sm:text-[0.6rem]">
                        Done
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassPanel>
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
