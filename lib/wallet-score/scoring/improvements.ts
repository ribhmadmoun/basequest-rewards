import type {
  ScoreCategoryBreakdown,
  ScoreCategoryId,
} from "@/lib/wallet-score/scoring/types";

export type ScoreImprovementSuggestion = {
  id: ScoreCategoryId;
  categoryLabel: string;
  /** Current weighted points toward the final score. */
  currentPoints: number;
  /** Maximum points available for this category. */
  maxPoints: number;
  /** Points still available if this category reaches full weight. */
  potentialGain: number;
  recommendation: string;
};

const IMPROVEMENT_LABELS: Record<ScoreCategoryId, string> = {
  walletAge: "Wallet Age",
  transactionCount: "Transactions",
  activeDays: "Active Days",
  contractInteractions: "Contract Usage",
  assetDiversity: "Asset Diversity",
  nftActivity: "NFT Activity",
  baseEcosystemUsage: "Base Usage",
  consistency: "Consistency",
};

const IMPROVEMENT_RECOMMENDATIONS: Record<ScoreCategoryId, string> = {
  walletAge:
    "Your wallet is still young. More onchain history will improve this category.",
  transactionCount:
    "Increase meaningful Base transactions to improve your activity score.",
  activeDays:
    "Increase meaningful Base transactions to improve your activity score.",
  contractInteractions:
    "Interact with more Base ecosystem protocols to improve your ecosystem score.",
  assetDiversity: "Hold or interact with more Base ecosystem assets.",
  nftActivity:
    "Collect or trade Base NFTs to strengthen your collectibles signal.",
  baseEcosystemUsage:
    "Interact with more Base ecosystem protocols to improve your ecosystem score.",
  consistency:
    "Keep a steady weekly cadence of Base activity to boost consistency.",
};

export type GetScoreImprovementSuggestionsOptions = {
  /** How many lowest categories to surface (default 3). */
  limit?: number;
  /** Ignore categories with less remaining upside than this (default 1). */
  minPotentialGain?: number;
};

/**
 * Build improvement tips from an existing score breakdown.
 * Does not recalculate scores — only ranks categories by remaining upside / low fill.
 */
export function getScoreImprovementSuggestions(
  breakdown: ScoreCategoryBreakdown[],
  maxScore: number,
  options: GetScoreImprovementSuggestionsOptions = {},
): ScoreImprovementSuggestion[] {
  const limit = options.limit ?? 3;
  const minPotentialGain = options.minPotentialGain ?? 1;

  const ranked = breakdown
    .map((row) => {
      const maxPoints = Math.round(row.weight * maxScore);
      const currentPoints = Math.round(row.weightedPoints);
      const potentialGain = Math.max(0, maxPoints - currentPoints);

      return {
        id: row.id,
        categoryLabel: IMPROVEMENT_LABELS[row.id],
        currentPoints,
        maxPoints,
        potentialGain,
        categoryScore: row.categoryScore,
        recommendation: IMPROVEMENT_RECOMMENDATIONS[row.id],
      };
    })
    .filter((row) => row.potentialGain >= minPotentialGain)
    // Lowest category fill first; break ties by largest upside.
    .sort((a, b) => {
      if (a.categoryScore !== b.categoryScore) {
        return a.categoryScore - b.categoryScore;
      }
      return b.potentialGain - a.potentialGain;
    })
    .slice(0, limit);

  return ranked.map(
    ({ categoryScore: _categoryScore, ...suggestion }) => suggestion,
  );
}
