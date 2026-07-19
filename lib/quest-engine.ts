export type QuestId =
  | "daily-check-in"
  | "connect-wallet"
  | "build-streak"
  | "explore-base";

export type QuestStatus = "available" | "completed" | "locked";

export type QuestProgress = {
  totalXp: number;
  streak: number;
  lastCheckInDate: string | null;
  completedQuestIds: QuestId[];
};

export type QuestDefinition = {
  id: QuestId;
  title: string;
  description: string;
  rewardXp: number;
  prerequisites: QuestId[];
  ctaAvailable: string;
};

export const STORAGE_KEY = "basequest-progress";

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "daily-check-in",
    title: "Daily Check-in",
    description:
      "Check in once per day to earn rewards and keep your streak alive.",
    rewardXp: 10,
    prerequisites: [],
    ctaAvailable: "Check In",
  },
  {
    id: "connect-wallet",
    title: "Connect Wallet",
    description:
      "Link your wallet to unlock quests and track your Base rewards.",
    rewardXp: 25,
    prerequisites: [],
    ctaAvailable: "Connect Wallet",
  },
  {
    id: "build-streak",
    title: "Build Your Streak",
    description:
      "Return daily to grow your streak and unlock bonus engagement rewards.",
    rewardXp: 5,
    prerequisites: ["daily-check-in"],
    ctaAvailable: "View Streak",
  },
  {
    id: "explore-base",
    title: "Explore Base Apps",
    description:
      "Discover popular apps in the Base ecosystem and earn bonus XP.",
    rewardXp: 15,
    prerequisites: ["connect-wallet", "daily-check-in"],
    ctaAvailable: "Explore Apps",
  },
];

export function getDefaultProgress(): QuestProgress {
  return {
    totalXp: 0,
    streak: 0,
    lastCheckInDate: null,
    completedQuestIds: [],
  };
}

export function getTodayDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousDateString(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getTodayDateString(date);
}

export function normalizeStreak(
  progress: QuestProgress,
  today = getTodayDateString(),
): QuestProgress {
  if (!progress.lastCheckInDate) {
    return progress.streak === 0 ? progress : { ...progress, streak: 0 };
  }

  const yesterday = getPreviousDateString(today);
  if (
    progress.lastCheckInDate === today ||
    progress.lastCheckInDate === yesterday
  ) {
    return progress;
  }

  return { ...progress, streak: 0 };
}

export function loadProgress(): QuestProgress {
  if (typeof window === "undefined") {
    return getDefaultProgress();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultProgress();
    }

    const parsed = JSON.parse(raw) as QuestProgress;
    return {
      totalXp: parsed.totalXp ?? 0,
      streak: parsed.streak ?? 0,
      lastCheckInDate: parsed.lastCheckInDate ?? null,
      completedQuestIds: parsed.completedQuestIds ?? [],
    };
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: QuestProgress): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function hasCompletedQuest(progress: QuestProgress, questId: QuestId): boolean {
  return progress.completedQuestIds.includes(questId);
}

function prerequisitesMet(
  progress: QuestProgress,
  prerequisites: QuestId[],
): boolean {
  return prerequisites.every((questId) => hasCompletedQuest(progress, questId));
}

export function getQuestStatus(
  questId: QuestId,
  progress: QuestProgress,
  today = getTodayDateString(),
): QuestStatus {
  const definition = QUEST_DEFINITIONS.find((quest) => quest.id === questId);
  if (!definition) {
    return "locked";
  }

  if (!prerequisitesMet(progress, definition.prerequisites)) {
    return "locked";
  }

  if (questId === "daily-check-in") {
    return progress.lastCheckInDate === today ? "completed" : "available";
  }

  return hasCompletedQuest(progress, questId) ? "completed" : "available";
}

export function getQuestCtaLabel(
  questId: QuestId,
  progress: QuestProgress,
  today = getTodayDateString(),
): string {
  const status = getQuestStatus(questId, progress, today);
  const definition = QUEST_DEFINITIONS.find((quest) => quest.id === questId);

  if (!definition) {
    return "Locked";
  }

  if (status === "locked") {
    return "Locked";
  }

  if (status === "completed") {
    return questId === "connect-wallet" ? "Completed" : "Completed";
  }

  return definition.ctaAvailable;
}

export function performDailyCheckIn(
  progress: QuestProgress,
  today = getTodayDateString(),
): QuestProgress {
  if (progress.lastCheckInDate === today) {
    return progress;
  }

  const yesterday = getPreviousDateString(today);
  const nextStreak =
    progress.lastCheckInDate === yesterday ? progress.streak + 1 : 1;

  const completedQuestIds: QuestId[] = hasCompletedQuest(progress, "daily-check-in")
    ? progress.completedQuestIds
    : [...progress.completedQuestIds, "daily-check-in"];

  return {
    totalXp: progress.totalXp + 10,
    streak: nextStreak,
    lastCheckInDate: today,
    completedQuestIds,
  };
}

export function completeConnectWalletQuest(
  progress: QuestProgress,
): QuestProgress {
  if (hasCompletedQuest(progress, "connect-wallet")) {
    return progress;
  }

  return {
    ...progress,
    totalXp: progress.totalXp + 25,
    completedQuestIds: [...progress.completedQuestIds, "connect-wallet"],
  };
}

export function completeOneTimeQuest(
  progress: QuestProgress,
  questId: QuestId,
): QuestProgress {
  const definition = QUEST_DEFINITIONS.find((quest) => quest.id === questId);
  if (!definition || questId === "daily-check-in" || questId === "connect-wallet") {
    return progress;
  }

  if (getQuestStatus(questId, progress) !== "available") {
    return progress;
  }

  if (hasCompletedQuest(progress, questId)) {
    return progress;
  }

  return {
    ...progress,
    totalXp: progress.totalXp + definition.rewardXp,
    completedQuestIds: [...progress.completedQuestIds, questId],
  };
}

export function performQuestAction(
  progress: QuestProgress,
  questId: QuestId,
  today = getTodayDateString(),
): QuestProgress {
  if (questId === "daily-check-in") {
    return performDailyCheckIn(progress, today);
  }

  if (questId === "connect-wallet") {
    return completeConnectWalletQuest(progress);
  }

  return completeOneTimeQuest(progress, questId);
}

export function getCompletedQuestCount(progress: QuestProgress): number {
  return progress.completedQuestIds.length;
}

export type QuestViewModel = {
  id: QuestId;
  title: string;
  description: string;
  reward: string;
  status: QuestStatus;
  ctaLabel: string;
};

export function getQuestViewModels(
  progress: QuestProgress,
  today = getTodayDateString(),
): QuestViewModel[] {
  return QUEST_DEFINITIONS.map((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    reward: `+${definition.rewardXp} XP`,
    status: getQuestStatus(definition.id, progress, today),
    ctaLabel: getQuestCtaLabel(definition.id, progress, today),
  }));
}

export function getProgressStats(progress: QuestProgress) {
  return [
    { label: "Total XP", value: progress.totalXp.toString() },
    { label: "Current Streak", value: `${progress.streak} days` },
    {
      label: "Completed Quests",
      value: getCompletedQuestCount(progress).toString(),
    },
  ];
}
