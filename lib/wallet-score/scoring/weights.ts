import type { ScoreCategoryId, ScoreWeights } from "@/lib/wallet-score/scoring/types";

/**
 * Initial Base Wallet Score weight model.
 * Keep values as fractions that sum to 1.0.
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  walletAge: 0.2,
  transactionCount: 0.2,
  activeDays: 0.15,
  contractInteractions: 0.15,
  assetDiversity: 0.1,
  nftActivity: 0.05,
  baseEcosystemUsage: 0.1,
  consistency: 0.05,
};

export const SCORE_CATEGORY_LABELS: Record<ScoreCategoryId, string> = {
  walletAge: "Wallet Age",
  transactionCount: "Transaction Count",
  activeDays: "Active Days",
  contractInteractions: "Contract Interactions",
  assetDiversity: "Asset Diversity",
  nftActivity: "NFT Activity",
  baseEcosystemUsage: "Base Ecosystem Usage",
  consistency: "Consistency",
};

const WEIGHT_SUM_TOLERANCE = 1e-6;

export function assertValidWeights(weights: ScoreWeights): void {
  const sum = (Object.keys(weights) as ScoreCategoryId[]).reduce(
    (acc, key) => acc + weights[key],
    0,
  );

  if (!Number.isFinite(sum) || Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new Error(
      `Score weights must sum to 1 (got ${sum}). Check DEFAULT_SCORE_WEIGHTS or overrides.`,
    );
  }

  for (const key of Object.keys(weights) as ScoreCategoryId[]) {
    const value = weights[key];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Score weight "${key}" must be a non-negative number.`);
    }
  }
}

export function mergeScoreWeights(
  overrides?: Partial<ScoreWeights>,
): ScoreWeights {
  const weights = {
    ...DEFAULT_SCORE_WEIGHTS,
    ...overrides,
  };
  assertValidWeights(weights);
  return weights;
}
