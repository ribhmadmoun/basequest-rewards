/**
 * Community quest catalog (UI metadata).
 * follow-x completion is handled by the quest engine + X OAuth verify flow.
 */
export type CommunityQuestId = "follow-x" | "follow-farcaster";

export type CommunityQuestDefinition = {
  id: CommunityQuestId;
  title: string;
  description: string;
  rewardXp: number;
  ctaLabel: string;
  href: string;
  icon: "x" | "farcaster";
  frequency: "one-time";
  category: "Community";
};

export const COMMUNITY_QUESTS: CommunityQuestDefinition[] = [
  {
    id: "follow-x",
    title: "Follow us on X",
    description:
      "Follow @bqrbase on X to stay updated with BaseQuest Rewards.",
    rewardXp: 25,
    ctaLabel: "Connect X",
    href: "https://x.com/bqrbase",
    icon: "x",
    frequency: "one-time",
    category: "Community",
  },
  {
    id: "follow-farcaster",
    title: "Follow us on Farcaster",
    description:
      "Follow @hqc on Farcaster and join the BaseQuest community.",
    rewardXp: 25,
    ctaLabel: "Follow on Farcaster",
    href: "https://warpcast.com/hqc",
    icon: "farcaster",
    frequency: "one-time",
    category: "Community",
  },
];
