"use client";

import PageShell from "@/components/PageShell";
import QuestCard from "@/components/QuestCard";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import type { QuestId } from "@/lib/quest-engine";
import { ui } from "@/lib/ui-styles";
import { useRouter } from "next/navigation";

function QuestsSkeleton() {
  return (
    <div className={ui.gridCards}>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className={`${ui.glassCard} min-h-[12rem] animate-pulse p-5 sm:p-6`}
        >
          <div className="h-6 w-24 rounded bg-white/10" />
          <div className="mt-4 h-5 w-40 rounded bg-white/10" />
          <div className="mt-3 h-12 w-full rounded bg-white/10" />
          <div className="mt-6 h-11 w-full rounded-xl bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function QuestsPage() {
  const router = useRouter();
  const { hydrated, quests, handleQuestAction } = useQuestEngine();

  return (
    <PageShell>
      <section className="text-center sm:text-left">
        <p className={ui.sectionHeading}>Quests</p>
        <h1 className={ui.pageTitle}>Start Earning</h1>
        <p className={ui.pageSubtitle}>
          Complete quests to earn XP and stay engaged with the Base ecosystem.
        </p>
      </section>

      <section>
        {!hydrated ? (
          <QuestsSkeleton />
        ) : (
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
                onAction={() => {
                  if (quest.id === "view-leaderboard") {
                    router.push("/leaderboard");
                    return;
                  }

                  handleQuestAction(quest.id as QuestId);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
