export type QuestId =
  | "daily-check-in"
  | "connect-wallet"
  | "build-streak"
  | "explore-base";

const QUEST_IDS: QuestId[] = [
  "daily-check-in",
  "connect-wallet",
  "build-streak",
  "explore-base",
];

export function parseQuestIds(ids: unknown): QuestId[] {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids.filter(
    (id): id is QuestId =>
      typeof id === "string" && QUEST_IDS.includes(id as QuestId),
  );
}

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

export type QuestCatalogRow = {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
};

export const STORAGE_KEY = "basequest-progress";

const QUEST_ENGINE_METADATA: Record<
  QuestId,
  Pick<QuestDefinition, "prerequisites" | "ctaAvailable">
> = {
  "daily-check-in": {
    prerequisites: [],
    ctaAvailable: "Check In",
  },
  "connect-wallet": {
    prerequisites: [],
    ctaAvailable: "Connect Wallet",
  },
  "build-streak": {
    prerequisites: ["daily-check-in"],
    ctaAvailable: "View Streak",
  },
  "explore-base": {
    prerequisites: ["connect-wallet", "daily-check-in"],
    ctaAvailable: "Explore Apps",
  },
};

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "daily-check-in",
    title: "Daily Check-in",
    description:
      "Check in once per day to earn rewards and keep your streak alive.",
    rewardXp: 10,
    ...QUEST_ENGINE_METADATA["daily-check-in"],
  },
  {
    id: "connect-wallet",
    title: "Connect Wallet",
    description:
      "Link your wallet to unlock quests and track your Base rewards.",
    rewardXp: 25,
    ...QUEST_ENGINE_METADATA["connect-wallet"],
  },
  {
    id: "build-streak",
    title: "Build Your Streak",
    description:
      "Return daily to grow your streak and unlock bonus engagement rewards.",
    rewardXp: 5,
    ...QUEST_ENGINE_METADATA["build-streak"],
  },
  {
    id: "explore-base",
    title: "Explore Base Apps",
    description:
      "Discover popular apps in the Base ecosystem and earn bonus XP.",
    rewardXp: 15,
    ...QUEST_ENGINE_METADATA["explore-base"],
  },
];

function resolveQuestDefinitions(
  definitions?: QuestDefinition[],
): QuestDefinition[] {
  if (definitions && definitions.length > 0) {
    return definitions;
  }

  return QUEST_DEFINITIONS;
}

function findQuestDefinition(
  questId: QuestId,
  definitions?: QuestDefinition[],
): QuestDefinition | undefined {
  return resolveQuestDefinitions(definitions).find(
    (quest) => quest.id === questId,
  );
}

export function buildQuestDefinitionsFromCatalog(
  rows: QuestCatalogRow[],
): QuestDefinition[] {
  const definitions: QuestDefinition[] = [];

  for (const row of rows) {
    if (!QUEST_IDS.includes(row.id as QuestId)) {
      continue;
    }

    const questId = row.id as QuestId;
    const metadata = QUEST_ENGINE_METADATA[questId];

    definitions.push({
      id: questId,
      title: row.title,
      description: row.description,
      rewardXp: row.reward_xp,
      prerequisites: metadata.prerequisites,
      ctaAvailable: metadata.ctaAvailable,
    });
  }

  return definitions;
}

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

export function getProgressStorageKey(walletAddress?: string | null): string {
  if (!walletAddress) {
    return `${STORAGE_KEY}:guest`;
  }

  return `${STORAGE_KEY}:${walletAddress.toLowerCase()}`;
}

export function loadProgress(walletAddress?: string | null): QuestProgress {
  if (typeof window === "undefined") {
    return getDefaultProgress();
  }

  try {
    const storageKey = getProgressStorageKey(walletAddress);
    let raw = window.localStorage.getItem(storageKey);

    if (!raw && !walletAddress) {
      raw = window.localStorage.getItem(STORAGE_KEY);
    }

    if (!raw) {
      return getDefaultProgress();
    }

    const parsed = JSON.parse(raw) as Partial<QuestProgress>;
    return {
      totalXp: parsed.totalXp ?? 0,
      streak: parsed.streak ?? 0,
      lastCheckInDate: parsed.lastCheckInDate ?? null,
      completedQuestIds: parseQuestIds(parsed.completedQuestIds),
    };
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(
  progress: QuestProgress,
  walletAddress?: string | null,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getProgressStorageKey(walletAddress),
    JSON.stringify(progress),
  );
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
  definitions?: QuestDefinition[],
): QuestStatus {
  const definition = findQuestDefinition(questId, definitions);
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
  definitions?: QuestDefinition[],
): string {
  const status = getQuestStatus(questId, progress, today, definitions);
  const definition = findQuestDefinition(questId, definitions);

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
  definitions?: QuestDefinition[],
): QuestProgress {
  if (progress.lastCheckInDate === today) {
    return progress;
  }

  const rewardXp =
    findQuestDefinition("daily-check-in", definitions)?.rewardXp ?? 10;
  const yesterday = getPreviousDateString(today);
  const nextStreak =
    progress.lastCheckInDate === yesterday ? progress.streak + 1 : 1;

  const completedQuestIds: QuestId[] = hasCompletedQuest(progress, "daily-check-in")
    ? progress.completedQuestIds
    : [...progress.completedQuestIds, "daily-check-in"];

  return {
    totalXp: progress.totalXp + rewardXp,
    streak: nextStreak,
    lastCheckInDate: today,
    completedQuestIds,
  };
}

export function completeConnectWalletQuest(
  progress: QuestProgress,
  definitions?: QuestDefinition[],
): QuestProgress {
  if (hasCompletedQuest(progress, "connect-wallet")) {
    return progress;
  }

  const rewardXp =
    findQuestDefinition("connect-wallet", definitions)?.rewardXp ?? 25;

  return {
    ...progress,
    totalXp: progress.totalXp + rewardXp,
    completedQuestIds: [...progress.completedQuestIds, "connect-wallet"],
  };
}

export function completeOneTimeQuest(
  progress: QuestProgress,
  questId: QuestId,
  definitions?: QuestDefinition[],
): QuestProgress {
  const definition = findQuestDefinition(questId, definitions);
  if (!definition || questId === "daily-check-in" || questId === "connect-wallet") {
    return progress;
  }

  if (getQuestStatus(questId, progress, getTodayDateString(), definitions) !== "available") {
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
  definitions?: QuestDefinition[],
): QuestProgress {
  if (questId === "daily-check-in") {
    return performDailyCheckIn(progress, today, definitions);
  }

  if (questId === "connect-wallet") {
    return completeConnectWalletQuest(progress, definitions);
  }

  return completeOneTimeQuest(progress, questId, definitions);
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
  definitions?: QuestDefinition[],
  today = getTodayDateString(),
): QuestViewModel[] {
  return resolveQuestDefinitions(definitions).map((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    reward: `+${definition.rewardXp} XP`,
    status: getQuestStatus(definition.id, progress, today, definitions),
    ctaLabel: getQuestCtaLabel(definition.id, progress, today, definitions),
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
