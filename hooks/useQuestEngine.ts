"use client";

import {
  completeConnectWalletQuest,
  getDefaultProgress,
  getProgressStats,
  getQuestViewModels,
  loadProgress,
  normalizeStreak,
  performQuestAction,
  saveProgress,
  type QuestId,
  type QuestProgress,
} from "@/lib/quest-engine";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useQuestEngine() {
  const [progress, setProgress] = useState<QuestProgress>(getDefaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = normalizeStreak(loadProgress());
    setProgress(loaded);
    saveProgress(loaded);
    setHydrated(true);
  }, []);

  const updateProgress = useCallback((updater: (current: QuestProgress) => QuestProgress) => {
    setProgress((current) => {
      const next = updater(current);
      saveProgress(next);
      return next;
    });
  }, []);

  const handleQuestAction = useCallback(
    (questId: QuestId) => {
      updateProgress((current) => performQuestAction(current, questId));
    },
    [updateProgress],
  );

  const handleWalletConnected = useCallback(() => {
    updateProgress((current) => completeConnectWalletQuest(current));
  }, [updateProgress]);

  const quests = useMemo(() => getQuestViewModels(progress), [progress]);
  const progressStats = useMemo(() => getProgressStats(progress), [progress]);
  const isWalletQuestCompleted = progress.completedQuestIds.includes(
    "connect-wallet",
  );

  return {
    hydrated,
    quests,
    progressStats,
    isWalletQuestCompleted,
    handleQuestAction,
    handleWalletConnected,
  };
}
