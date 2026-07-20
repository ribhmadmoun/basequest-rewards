"use client";

import {
  buildQuestDefinitionsFromCatalog,
  completeConnectWalletQuest,
  getDefaultProgress,
  getProgressStats,
  getQuestViewModels,
  loadProgress,
  normalizeStreak,
  performQuestAction,
  QUEST_DEFINITIONS,
  saveProgress,
  type QuestDefinition,
  type QuestId,
  type QuestProgress,
} from "@/lib/quest-engine";
import { getLevel } from "@/lib/levels";
import { fetchQuests } from "@/lib/supabase/quests";
import {
  fetchOrCreateUser,
  saveUserProgress,
  userRowToProgress,
} from "@/lib/supabase/users";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

function getStorageWalletAddress(address?: string | null) {
  return address?.toLowerCase() ?? null;
}

function persistProgressLocally(
  progress: QuestProgress,
  walletAddress?: string | null,
) {
  const normalized = normalizeStreak(progress);
  saveProgress(normalized, walletAddress);
  return normalized;
}

export function useQuestEngine() {
  const [progress, setProgress] = useState<QuestProgress>(getDefaultProgress);
  const [questDefinitions, setQuestDefinitions] =
    useState<QuestDefinition[]>(QUEST_DEFINITIONS);
  const [hydrated, setHydrated] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { address, status: walletStatus } = useAccount();
  const isWalletConnected = walletStatus === "connected";
  const storageWalletAddress = getStorageWalletAddress(address);

  useEffect(() => {
    const loaded = persistProgressLocally(loadProgress(), null);
    setProgress(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const loaded = persistProgressLocally(
      loadProgress(storageWalletAddress),
      storageWalletAddress,
    );
    setProgress(loaded);
  }, [hydrated, storageWalletAddress]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestDefinitions() {
      const rows = await fetchQuests();
      if (cancelled || !rows || rows.length === 0) {
        return;
      }

      const definitions = buildQuestDefinitionsFromCatalog(rows);
      if (cancelled || definitions.length === 0) {
        return;
      }

      setQuestDefinitions(definitions);
    }

    void loadQuestDefinitions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !address || !isWalletConnected) {
      return;
    }

    const walletAddress = address;
    let cancelled = false;

    async function syncUserProgress() {
      try {
        const user = await fetchOrCreateUser(walletAddress);
        if (cancelled || !user) {
          return;
        }

        let next = normalizeStreak(userRowToProgress(user));
        next = completeConnectWalletQuest(next, questDefinitions);
        next = persistProgressLocally(next, storageWalletAddress);

        if (cancelled) {
          return;
        }

        setProgress(next);

        try {
          await saveUserProgress(walletAddress, next);
        } catch {
          // localStorage fallback already saved
        }
      } catch {
        if (cancelled) {
          return;
        }

        const fallback = persistProgressLocally(
          completeConnectWalletQuest(
            normalizeStreak(loadProgress(storageWalletAddress)),
            questDefinitions,
          ),
          storageWalletAddress,
        );
        setProgress(fallback);
      }
    }

    void syncUserProgress();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    address,
    isWalletConnected,
    questDefinitions,
    storageWalletAddress,
  ]);

  const updateProgress = useCallback(
    (updater: (current: QuestProgress) => QuestProgress) => {
      setProgress((current) => {
        const next = persistProgressLocally(updater(current), storageWalletAddress);

        if (address && isWalletConnected) {
          void saveUserProgress(address, next).catch(() => {
            // localStorage fallback already saved
          });
        }

        return next;
      });
    },
    [address, isWalletConnected, storageWalletAddress],
  );

  const handleQuestAction = useCallback(
    (questId: QuestId) => {
      updateProgress((current) => {
        const previousLevel = getLevel(current.totalXp);
        const next = performQuestAction(
          current,
          questId,
          undefined,
          questDefinitions,
        );
        const newLevel = getLevel(next.totalXp);

        if (newLevel > previousLevel) {
          setLevelUpLevel(newLevel);
        }

        return next;
      });
    },
    [updateProgress, questDefinitions],
  );

  const quests = useMemo(
    () => getQuestViewModels(progress, questDefinitions),
    [progress, questDefinitions],
  );
  const progressStats = useMemo(() => getProgressStats(progress), [progress]);
  const isWalletQuestCompleted = progress.completedQuestIds.includes(
    "connect-wallet",
  );

  return {
    hydrated,
    quests,
    progressStats,
    totalXp: progress.totalXp,
    levelUpLevel,
    clearLevelUpCelebration: () => setLevelUpLevel(null),
    isWalletQuestCompleted,
    handleQuestAction,
  };
}
