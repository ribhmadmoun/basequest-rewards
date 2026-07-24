import type {
  ScoreCategoryBreakdown,
  ScoreCategoryId,
  WalletScoreResult,
} from "@/lib/wallet-score/scoring/types";
import type {
  WalletIntelligenceResult,
  WalletPersonalityId,
  WalletPersonalityResult,
  WalletReputationId,
  WalletReputationResult,
  WalletRiskLevelId,
  WalletRiskResult,
} from "@/lib/wallet-score/intelligence/types";

function categoryMap(
  breakdown: ScoreCategoryBreakdown[],
): Record<ScoreCategoryId, ScoreCategoryBreakdown> {
  return Object.fromEntries(
    breakdown.map((row) => [row.id, row]),
  ) as Record<ScoreCategoryId, ScoreCategoryBreakdown>;
}

function scoreOf(
  map: Record<ScoreCategoryId, ScoreCategoryBreakdown>,
  id: ScoreCategoryId,
): number {
  return map[id]?.categoryScore ?? 0;
}

const PERSONALITY_COPY: Record<
  WalletPersonalityId,
  { label: string; summary: string }
> = {
  explorer: {
    label: "Explorer",
    summary:
      "This wallet samples Base broadly — growing history with a curiosity-driven footprint.",
  },
  builder: {
    label: "Builder",
    summary:
      "Contract and protocol depth stand out. This profile looks like an onchain builder on Base.",
  },
  collector: {
    label: "Collector",
    summary:
      "NFT activity leads the profile. Collectibles are a defining signal for this wallet.",
  },
  trader: {
    label: "Trader",
    summary:
      "High transaction throughput and ecosystem routing point to an active Base trader.",
  },
  "power-user": {
    label: "Power User",
    summary:
      "Strong across multiple score categories — a high-conviction Base power user.",
  },
};

const REPUTATION_COPY: Record<
  WalletReputationId,
  { label: string; summary: string; scoreBand: string }
> = {
  elite: {
    label: "Elite",
    summary:
      "Top-tier Wallet Score with durable onchain signals. Reputation is firmly established.",
    scoreBand: "850–1000",
  },
  trusted: {
    label: "Trusted",
    summary:
      "Consistently strong score and history. Peers would read this as a trusted Base wallet.",
    scoreBand: "700–849",
  },
  established: {
    label: "Established",
    summary:
      "Solid mid-to-high score with meaningful Base activity. Reputation is forming well.",
    scoreBand: "550–699",
  },
  emerging: {
    label: "Emerging",
    summary:
      "Score is climbing but not yet mature. Keep compounding Base activity to rise.",
    scoreBand: "350–549",
  },
  developing: {
    label: "Developing",
    summary:
      "Early-stage reputation. More age, consistency, and ecosystem use will lift trust.",
    scoreBand: "0–349",
  },
};

const RISK_COPY: Record<
  WalletRiskLevelId,
  { label: string; summary: string }
> = {
  low: {
    label: "Low",
    summary:
      "Age and consistency support a stable profile. Risk pressure from score signals is limited.",
  },
  medium: {
    label: "Medium",
    summary:
      "Mixed durability signals. Activity is real, but consistency or age still leave room for volatility.",
  },
  high: {
    label: "High",
    summary:
      "Young history, bursty activity, or thin consistency raise risk relative to peer wallets.",
  },
};

function derivePersonality(
  map: Record<ScoreCategoryId, ScoreCategoryBreakdown>,
  totalScore: number,
): WalletPersonalityResult {
  const nft = scoreOf(map, "nftActivity");
  const txs = scoreOf(map, "transactionCount");
  const contracts = scoreOf(map, "contractInteractions");
  const eco = scoreOf(map, "baseEcosystemUsage");
  const assets = scoreOf(map, "assetDiversity");
  const active = scoreOf(map, "activeDays");
  const age = scoreOf(map, "walletAge");

  const strongCategories = [
    nft,
    txs,
    contracts,
    eco,
    assets,
    active,
    age,
  ].filter((value) => value >= 70).length;

  let id: WalletPersonalityId = "explorer";

  if (totalScore >= 800 && strongCategories >= 4) {
    id = "power-user";
  } else if (nft >= 65 && nft >= txs - 5 && nft >= eco - 5) {
    id = "collector";
  } else if (txs >= 72 && (eco >= 55 || active >= 65)) {
    id = "trader";
  } else if (contracts >= 68 && eco >= 60) {
    id = "builder";
  } else if (assets >= 70 && eco >= 55 && txs < 70) {
    id = "explorer";
  } else if (contracts >= eco && contracts >= txs && contracts >= 55) {
    id = "builder";
  } else if (txs >= active && txs >= 60) {
    id = "trader";
  } else {
    id = "explorer";
  }

  const copy = PERSONALITY_COPY[id];

  return {
    id,
    label: copy.label,
    summary: copy.summary,
    signals: [
      { label: "Transactions", value: `${Math.round(txs)}/100` },
      { label: "Contracts", value: `${Math.round(contracts)}/100` },
      { label: "NFTs", value: `${Math.round(nft)}/100` },
      { label: "Ecosystem", value: `${Math.round(eco)}/100` },
    ],
  };
}

function deriveReputation(
  totalScore: number,
  map: Record<ScoreCategoryId, ScoreCategoryBreakdown>,
): WalletReputationResult {
  const age = scoreOf(map, "walletAge");
  const consistency = scoreOf(map, "consistency");

  let id: WalletReputationId;
  if (totalScore >= 850) {
    id = "elite";
  } else if (totalScore >= 700) {
    id = "trusted";
  } else if (totalScore >= 550) {
    id = "established";
  } else if (totalScore >= 350) {
    id = "emerging";
  } else {
    id = "developing";
  }

  // Soft downgrade when age/consistency lag far behind score (possible burst activity).
  if (
    (id === "elite" || id === "trusted") &&
    age < 45 &&
    consistency < 50
  ) {
    id = id === "elite" ? "trusted" : "established";
  }

  const copy = REPUTATION_COPY[id];

  return {
    id,
    label: copy.label,
    summary: copy.summary,
    scoreBand: copy.scoreBand,
    signals: [
      { label: "Wallet Score", value: String(totalScore) },
      { label: "Age signal", value: `${Math.round(age)}/100` },
      {
        label: "Consistency",
        value: `${Math.round(consistency)}/100`,
      },
    ],
  };
}

function deriveRisk(
  map: Record<ScoreCategoryId, ScoreCategoryBreakdown>,
  metrics: WalletScoreResult["metrics"],
): WalletRiskResult {
  const age = scoreOf(map, "walletAge");
  const consistency = scoreOf(map, "consistency");
  const txs = scoreOf(map, "transactionCount");
  const active = scoreOf(map, "activeDays");
  const eco = scoreOf(map, "baseEcosystemUsage");

  const txsPerActiveDay =
    metrics.activeDays > 0
      ? metrics.transactionCount / metrics.activeDays
      : metrics.transactionCount;

  // Higher pressure = higher risk. Deterministic blend of durability gaps.
  let pressure =
    (100 - age) * 0.28 +
    (100 - consistency) * 0.32 +
    Math.min(txsPerActiveDay * 4, 40) * 0.2 +
    (txs > 75 && eco < 40 ? 18 : 0) +
    (age < 35 && txs > 70 ? 16 : 0) +
    (active < 40 && txs > 65 ? 12 : 0);

  pressure = Math.max(0, Math.min(100, pressure));

  let id: WalletRiskLevelId;
  if (pressure >= 58) {
    id = "high";
  } else if (pressure >= 34) {
    id = "medium";
  } else {
    id = "low";
  }

  const copy = RISK_COPY[id];

  return {
    id,
    label: copy.label,
    summary: copy.summary,
    riskScore: Math.round(pressure * 10) / 10,
    signals: [
      { label: "Age durability", value: `${Math.round(age)}/100` },
      {
        label: "Consistency",
        value: `${Math.round(consistency)}/100`,
      },
      {
        label: "Tx intensity",
        value: `${txsPerActiveDay.toFixed(1)} / active day`,
      },
    ],
  };
}

/**
 * Deterministic Wallet Intelligence from existing score engine output.
 * No external AI — pure rules over breakdown + metrics.
 */
export function analyzeWalletIntelligence(
  scoreResult: WalletScoreResult,
): WalletIntelligenceResult {
  const map = categoryMap(scoreResult.breakdown);

  return {
    personality: derivePersonality(map, scoreResult.score),
    reputation: deriveReputation(scoreResult.score, map),
    risk: deriveRisk(map, scoreResult.metrics),
  };
}
