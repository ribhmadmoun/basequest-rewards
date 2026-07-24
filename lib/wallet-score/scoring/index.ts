export {
  calculateWalletScore,
  scoreCategories,
  WALLET_SCORE_MAX,
} from "@/lib/wallet-score/scoring/calculateWalletScore";
export type { CalculateWalletScoreOptions } from "@/lib/wallet-score/scoring/calculateWalletScore";
export {
  getScoreImprovementSuggestions,
} from "@/lib/wallet-score/scoring/improvements";
export type {
  GetScoreImprovementSuggestionsOptions,
  ScoreImprovementSuggestion,
} from "@/lib/wallet-score/scoring/improvements";
export {
  MOCK_SCORE_METRICS,
  resolveScoreMetrics,
} from "@/lib/wallet-score/scoring/metrics";
export {
  DEFAULT_SCORE_WEIGHTS,
  SCORE_CATEGORY_LABELS,
  assertValidWeights,
  mergeScoreWeights,
} from "@/lib/wallet-score/scoring/weights";
export type {
  ResolvedWalletScoreMetrics,
  ScoreCategoryBreakdown,
  ScoreCategoryId,
  ScoreWeights,
  WalletScoreMetricInput,
  WalletScoreResult,
} from "@/lib/wallet-score/scoring/types";
