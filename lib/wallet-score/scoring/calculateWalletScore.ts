import {
  easeOutScore,
  linearScore,
  logScore,
  clamp,
} from "@/lib/wallet-score/scoring/normalize";
import { resolveScoreMetrics } from "@/lib/wallet-score/scoring/metrics";
import type {
  ScoreCategoryBreakdown,
  ScoreCategoryId,
  ScoreWeights,
  WalletScoreMetricInput,
  WalletScoreResult,
  ResolvedWalletScoreMetrics,
} from "@/lib/wallet-score/scoring/types";
import {
  SCORE_CATEGORY_LABELS,
  mergeScoreWeights,
} from "@/lib/wallet-score/scoring/weights";
import type { DataSource } from "@/lib/wallet-score/types";

export const WALLET_SCORE_MAX = 1000;

const CATEGORY_ORDER: ScoreCategoryId[] = [
  "walletAge",
  "transactionCount",
  "activeDays",
  "contractInteractions",
  "assetDiversity",
  "nftActivity",
  "baseEcosystemUsage",
  "consistency",
];

/**
 * Map resolved raw metrics → category scores on a 0–100 scale.
 * Curves are intentionally generous early so healthy Base wallets
 * land in a premium band without requiring whale-level activity.
 */
export function scoreCategories(metrics: ResolvedWalletScoreMetrics): Record<
  ScoreCategoryId,
  { categoryScore: number; rawValue: number; rawUnit: string; source: DataSource }
> {
  const consistencyRatio =
    metrics.activeDays /
    Math.max(Math.min(metrics.walletAgeDays, 365), 1);

  const ecosystemScore = clamp(
    0.45 * linearScore(metrics.protocolCount, 8) +
      0.55 * logScore(metrics.protocolInteractions, 500),
  );

  return {
    walletAge: {
      categoryScore: easeOutScore(metrics.walletAgeDays, 540, 0.72),
      rawValue: metrics.walletAgeDays,
      rawUnit: "days",
      source: metrics.sources.walletAgeDays,
    },
    transactionCount: {
      categoryScore: logScore(metrics.transactionCount, 2200),
      rawValue: metrics.transactionCount,
      rawUnit: "transactions",
      source: metrics.sources.transactionCount,
    },
    activeDays: {
      categoryScore: easeOutScore(metrics.activeDays, 220, 0.75),
      rawValue: metrics.activeDays,
      rawUnit: "days",
      source: metrics.sources.activeDays,
    },
    contractInteractions: {
      categoryScore: logScore(metrics.contractInteractions, 120),
      rawValue: metrics.contractInteractions,
      rawUnit: "contracts",
      source: metrics.sources.contractInteractions,
    },
    assetDiversity: {
      categoryScore: easeOutScore(metrics.uniqueTokens, 40, 0.7),
      rawValue: metrics.uniqueTokens,
      rawUnit: "tokens",
      source: metrics.sources.uniqueTokens,
    },
    nftActivity: {
      categoryScore: easeOutScore(metrics.nftCount, 40, 0.75),
      rawValue: metrics.nftCount,
      rawUnit: "nfts",
      source: metrics.sources.nftCount,
    },
    baseEcosystemUsage: {
      categoryScore: ecosystemScore,
      rawValue: metrics.protocolInteractions,
      rawUnit: "protocol interactions",
      source:
        metrics.sources.protocolCount === "live" ||
        metrics.sources.protocolInteractions === "live"
          ? "live"
          : "mock",
    },
    consistency: {
      categoryScore: linearScore(consistencyRatio, 0.65),
      rawValue: Number(consistencyRatio.toFixed(4)),
      rawUnit: "active-day ratio",
      source:
        metrics.sources.activeDays === "live" &&
        metrics.sources.walletAgeDays === "live"
          ? "live"
          : "mock",
    },
  };
}

function buildBreakdown(
  weights: ScoreWeights,
  categories: ReturnType<typeof scoreCategories>,
): ScoreCategoryBreakdown[] {
  return CATEGORY_ORDER.map((id) => {
    const weight = weights[id];
    const category = categories[id];
    const weightedPoints = (category.categoryScore / 100) * weight * WALLET_SCORE_MAX;

    return {
      id,
      label: SCORE_CATEGORY_LABELS[id],
      weight,
      weightPercent: Math.round(weight * 1000) / 10,
      categoryScore: Math.round(category.categoryScore * 10) / 10,
      weightedPoints: Math.round(weightedPoints * 10) / 10,
      rawValue: category.rawValue,
      rawUnit: category.rawUnit,
      source: category.source,
    };
  });
}

export type CalculateWalletScoreOptions = {
  /**
   * Full or partial weight map. Merged onto defaults; the result must sum to 1.
   * Pass a complete `ScoreWeights` object to fully reconfigure the model.
   */
  weights?: Partial<ScoreWeights>;
};

/**
 * Base Wallet Score engine.
 * Returns a final 0–1000 score plus a per-category breakdown.
 */
export function calculateWalletScore(
  input: WalletScoreMetricInput,
  options: CalculateWalletScoreOptions = {},
): WalletScoreResult {
  const weights = options.weights
    ? mergeScoreWeights(options.weights)
    : mergeScoreWeights();
  const metrics = resolveScoreMetrics(input);
  const categories = scoreCategories(metrics);
  const breakdown = buildBreakdown(weights, categories);

  const rawScore = breakdown.reduce(
    (sum, row) => sum + row.weightedPoints,
    0,
  );
  const score = Math.round(clamp(rawScore, 0, WALLET_SCORE_MAX));

  return {
    score,
    maxScore: WALLET_SCORE_MAX,
    weights,
    metrics,
    breakdown,
  };
}
