"use client";

import LevelProgressBar from "@/components/LevelProgressBar";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import PageShell from "@/components/PageShell";
import QuestCard from "@/components/QuestCard";
import WalletStatusCard from "@/components/WalletStatusCard";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import { getLevel } from "@/lib/levels";
import type { QuestId } from "@/lib/quest-engine";
import { ui } from "@/lib/ui-styles";

function DashboardSkeleton() {
  return (
    <>
      <section className="animate-pulse space-y-3">
        <div className="mx-auto h-3 w-20 rounded bg-glass-border sm:mx-0" />
        <div className="mx-auto h-8 w-56 rounded bg-glass-border sm:mx-0" />
        <div className="mx-auto h-4 w-72 max-w-full rounded bg-glass-border sm:mx-0" />
      </section>

      <section className={ui.gridStats}>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={`${ui.glassCard} min-h-[8.5rem] animate-pulse p-5 sm:p-6`}
          >
            <div className="h-3 w-24 rounded bg-glass-border" />
            <div className="mt-auto pt-6 h-8 w-16 rounded bg-glass-border" />
          </div>
        ))}
      </section>

      <section className={`${ui.glassCard} animate-pulse p-5 sm:p-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-12 rounded bg-glass-border" />
          <div className="h-12 rounded bg-glass-border" />
          <div className="h-12 rounded bg-glass-border" />
        </div>
      </section>
    </>
  );
}

export default function Dashboard() {
  const {
    hydrated,
    quests,
    progressStats,
    totalXp,
    levelUpLevel,
    clearLevelUpCelebration,
    isWalletQuestCompleted,
    handleQuestAction,
  } = useQuestEngine();

  return (
    <PageShell>
      {!hydrated ? (
        <DashboardSkeleton />
      ) : (
        <>
          {levelUpLevel ? (
            <LevelUpCelebration
              level={levelUpLevel}
              onDismiss={clearLevelUpCelebration}
            />
          ) : null}

          <section className="text-center sm:text-left">
            <p className={ui.sectionHeading}>Dashboard</p>
            <h1 className={ui.pageTitle}>BaseQuest Rewards</h1>
            <p className={ui.pageSubtitle}>
              Daily rewards and engagement for the Base ecosystem.
            </p>
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Overview</p>
              <h2 className={ui.sectionTitle}>Your Progress</h2>
            </div>

            <div className={ui.gridStats}>
              {progressStats.map((stat) => (
                <article key={stat.label} className={ui.statCard}>
                  <p className={ui.statLabel}>{stat.label}</p>
                  <p className={ui.statValue}>{stat.value}</p>
                </article>
              ))}
              <article className={ui.statCard}>
                <p className={ui.statLabel}>Current Level</p>
                <div className="mt-auto flex flex-1 flex-col pt-3">
                  <p className="font-sans text-2xl font-bold tabular-nums tracking-tight text-text-primary sm:text-3xl">
                    Level {getLevel(totalXp)}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{totalXp} XP</p>
                  <LevelProgressBar totalXp={totalXp} />
                </div>
              </article>
            </div>
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Wallet</p>
              <h2 className={ui.sectionTitle}>Wallet Status</h2>
            </div>

            <WalletStatusCard />
          </section>

          <section>
            <div className={ui.sectionHeaderWrap}>
              <p className={ui.sectionHeading}>Quests</p>
              <h2 className={ui.sectionTitle}>Start Earning</h2>
              <p className={ui.sectionDescription}>
                Complete quests to earn XP and stay engaged with the Base
                ecosystem.
              </p>
            </div>

            <div className={ui.gridCards}>
              {quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  questId={quest.id}
                  title={quest.title}
                  description={quest.description}
                  reward={quest.reward}
                  status={quest.status}
                  ctaLabel={quest.ctaLabel}
                  questCompleted={
                    quest.id === "connect-wallet" ? isWalletQuestCompleted : false
                  }
                  onAction={() => handleQuestAction(quest.id as QuestId)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
