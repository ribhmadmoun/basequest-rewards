"use client";

import {
  buildQuestDefinitionsFromCatalog,
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

function cacheProgressLocally(
  progress: QuestProgress,
  walletAddress?: string | null,
) {
  saveProgress(normalizeStreak(progress), walletAddress);
}

export function useQuestEngine() {
  const [progress, setProgress] = useState<QuestProgress>(getDefaultProgress);
  const [questDefinitions, setQuestDefinitions] =
    useState<QuestDefinition[]>(QUEST_DEFINITIONS);
  const [hydrated, setHydrated] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { address, status: walletStatus } = useAccount();
  const isWalletConnected = walletStatus === "connected";
  const isWalletReconnecting =
    walletStatus === "connecting" || walletStatus === "reconnecting";
  const storageWalletAddress = getStorageWalletAddress(address);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setProgressReady(false);
  }, [storageWalletAddress, isWalletConnected]);

  useEffect(() => {
    if (!hydrated || isWalletReconnecting) {
      return;
    }

    // Authenticated users load from Supabase in syncUserProgress.
    if (isWalletConnected && storageWalletAddress) {
      return;
    }

    const next = normalizeStreak(loadProgress(storageWalletAddress));
    console.log("SET_PROGRESS", "line 65", {
      lastCheckInDate: next.lastCheckInDate,
      totalXp: next.totalXp,
      completedQuestIds: next.completedQuestIds,
    });
    console.log("SET_PROGRESS_LINE_71");
    setProgress(next);
    setProgressReady(true);
  }, [
    hydrated,
    storageWalletAddress,
    isWalletConnected,
    isWalletReconnecting,
  ]);

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

        const next = normalizeStreak(userRowToProgress(user));

        if (cancelled) {
          return;
        }

        console.log("SET_PROGRESS", "line 119", {
          lastCheckInDate: next.lastCheckInDate,
          totalXp: next.totalXp,
          completedQuestIds: next.completedQuestIds,
        });
        console.log("SET_PROGRESS_LINE_130");
        setProgress(next);
        setProgressReady(true);

        try {
          await saveUserProgress(walletAddress, next);
        } catch {
          // Supabase unavailable; local cache below is offline fallback only.
        }

        cacheProgressLocally(next, storageWalletAddress);
      } catch (error) {
        console.error("SYNC ERROR", error);
        if (cancelled) {
          return;
        }

        const fallback = normalizeStreak(loadProgress(storageWalletAddress));
        console.log("SET_PROGRESS", "line 139", {
          lastCheckInDate: fallback.lastCheckInDate,
          totalXp: fallback.totalXp,
          completedQuestIds: fallback.completedQuestIds,
        });
        console.log("SET_PROGRESS_LINE_155");
        setProgress(fallback);
        setProgressReady(true);
        cacheProgressLocally(fallback, storageWalletAddress);
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
    storageWalletAddress,
  ]);

  const updateProgress = useCallback(
    (updater: (current: QuestProgress) => QuestProgress) => {
      console.log("SET_PROGRESS_LINE_175");
      setProgress((current) => {
        const next = normalizeStreak(updater(current));

        console.log("SET_PROGRESS", "line 159", {
          lastCheckInDate: next.lastCheckInDate,
          totalXp: next.totalXp,
          completedQuestIds: next.completedQuestIds,
        });

        if (address && isWalletConnected) {
          void saveUserProgress(address, next)
            .then(() => {
              cacheProgressLocally(next, storageWalletAddress);
            })
            .catch(() => {
              cacheProgressLocally(next, storageWalletAddress);
            });
        } else {
          cacheProgressLocally(next, storageWalletAddress);
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

  const applyServerProgress = useCallback(
    (nextProgress: QuestProgress) => {
      updateProgress((current) => {
        const previousLevel = getLevel(current.totalXp);
        const next = normalizeStreak(nextProgress);
        const newLevel = getLevel(next.totalXp);

        if (newLevel > previousLevel) {
          setLevelUpLevel(newLevel);
        }

        return next;
      });
    },
    [updateProgress],
  );

  const quests = useMemo(
    () => getQuestViewModels(progress, questDefinitions),
    [progress, questDefinitions],
  );
  const progressStats = useMemo(() => getProgressStats(progress), [progress]);

  return {
    hydrated,
    progressReady,
    quests,
    progressStats,
    totalXp: progress.totalXp,
    levelUpLevel,
    clearLevelUpCelebration: () => setLevelUpLevel(null),
    handleQuestAction,
    applyServerProgress,
  };
}
