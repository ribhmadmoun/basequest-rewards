"use client";

import Header from "@/components/Header";
import QuestCard from "@/components/QuestCard";
import WalletStatusCard from "@/components/WalletStatusCard";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import type { QuestId } from "@/lib/quest-engine";

export default function Dashboard() {
  const {
    hydrated,
    quests,
    progressStats,
    isWalletQuestCompleted,
    handleQuestAction,
    handleWalletConnected,
  } = useQuestEngine();

  if (!hydrated) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to">
        <Header />
        <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-8 sm:gap-12 sm:px-6 sm:py-12" />
      </div>
    );
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
            Dashboard
          </p>
          <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            BaseQuest Rewards
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
            Daily rewards and engagement for the Base ecosystem.
          </p>
        </section>

        <section>
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Overview
            </p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Your Progress
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {progressStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-card border border-glass-border bg-glass-bg p-5 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6 sm:text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  {stat.label}
                </p>
                <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                  {stat.value}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Wallet
            </p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Wallet Status
            </h2>
          </div>

          <WalletStatusCard onWalletConnected={handleWalletConnected} />
        </section>

        <section>
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Quests
            </p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Start Earning
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
              Complete quests to earn XP and stay engaged with the Base
              ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                onWalletConnected={handleWalletConnected}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
