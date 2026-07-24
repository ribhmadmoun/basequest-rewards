import type { DataSource } from "@/lib/wallet-score/types";

/** Configurable category keys for the Base Wallet Score model. */
export type ScoreCategoryId =
  | "walletAge"
  | "transactionCount"
  | "activeDays"
  | "contractInteractions"
  | "assetDiversity"
  | "nftActivity"
  | "baseEcosystemUsage"
  | "consistency";

/** Weights must sum to 1 (100%). */
export type ScoreWeights = Record<ScoreCategoryId, number>;

/**
 * Raw on-chain (or mock) inputs consumed by the scoring engine.
 * Null means “prefer mock / default for this field”.
 */
export type WalletScoreMetricInput = {
  walletAgeDays: number | null;
  transactionCount: number | null;
  activeDays: number | null;
  contractInteractions: number | null;
  uniqueTokens: number | null;
  nftCount: number | null;
  /** Distinct Base protocols / apps interacted with. */
  protocolCount: number | null;
  /** Total interactions across Base ecosystem protocols. */
  protocolInteractions: number | null;
};

export type ResolvedWalletScoreMetrics = {
  walletAgeDays: number;
  transactionCount: number;
  activeDays: number;
  contractInteractions: number;
  uniqueTokens: number;
  nftCount: number;
  protocolCount: number;
  protocolInteractions: number;
  sources: Record<keyof Omit<ResolvedWalletScoreMetrics, "sources">, DataSource>;
};

export type ScoreCategoryBreakdown = {
  id: ScoreCategoryId;
  label: string;
  /** Weight as a fraction of the total model (e.g. 0.2 = 20%). */
  weight: number;
  /** Weight expressed as a percentage for display (e.g. 20). */
  weightPercent: number;
  /** Normalized category score on a 0–100 scale. */
  categoryScore: number;
  /** Points contributed to the final 0–1000 score. */
  weightedPoints: number;
  /** Raw metric value used for this category. */
  rawValue: number;
  /** Human-readable unit / meaning of rawValue. */
  rawUnit: string;
  source: DataSource;
};

export type WalletScoreResult = {
  /** Final score on a 0–1000 scale. */
  score: number;
  maxScore: number;
  weights: ScoreWeights;
  metrics: ResolvedWalletScoreMetrics;
  breakdown: ScoreCategoryBreakdown[];
};
