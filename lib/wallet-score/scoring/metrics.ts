import { protocolUsage, walletStats } from "@/lib/wallet-score/mock-data";
import type {
  ResolvedWalletScoreMetrics,
  WalletScoreMetricInput,
} from "@/lib/wallet-score/scoring/types";
import type { DataSource } from "@/lib/wallet-score/types";

function parseStatNumber(id: string, fallback: number): number {
  const raw = walletStats.find((stat) => stat.id === id)?.value;
  if (!raw) {
    return fallback;
  }
  const parsed = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

const MOCK_PROTOCOL_COUNT = protocolUsage.length;
const MOCK_PROTOCOL_INTERACTIONS = protocolUsage.reduce(
  (sum, row) => sum + row.interactions,
  0,
);

/**
 * Fallback metrics aligned with current mock dashboard values.
 * Used whenever a live metric is not yet wired.
 */
export const MOCK_SCORE_METRICS = {
  walletAgeDays: parseStatNumber("age", 412),
  transactionCount: parseStatNumber("txs", 1847),
  activeDays: parseStatNumber("active", 186),
  contractInteractions: parseStatNumber("contracts", 67),
  uniqueTokens: parseStatNumber("tokens", 31),
  nftCount: parseStatNumber("nfts", 24),
  protocolCount: MOCK_PROTOCOL_COUNT,
  protocolInteractions: MOCK_PROTOCOL_INTERACTIONS,
} as const;

function pickMetric(
  liveValue: number | null | undefined,
  mockValue: number,
): { value: number; source: DataSource } {
  if (liveValue === null || liveValue === undefined) {
    return { value: mockValue, source: "mock" };
  }
  if (!Number.isFinite(liveValue) || liveValue < 0) {
    return { value: mockValue, source: "mock" };
  }
  return { value: liveValue, source: "live" };
}

/**
 * Resolve live + mock inputs into a complete metric set for scoring.
 */
export function resolveScoreMetrics(
  input: WalletScoreMetricInput,
): ResolvedWalletScoreMetrics {
  const walletAgeDays = pickMetric(
    input.walletAgeDays,
    MOCK_SCORE_METRICS.walletAgeDays,
  );
  const transactionCount = pickMetric(
    input.transactionCount,
    MOCK_SCORE_METRICS.transactionCount,
  );
  const activeDays = pickMetric(
    input.activeDays,
    MOCK_SCORE_METRICS.activeDays,
  );
  const contractInteractions = pickMetric(
    input.contractInteractions,
    MOCK_SCORE_METRICS.contractInteractions,
  );
  const uniqueTokens = pickMetric(
    input.uniqueTokens,
    MOCK_SCORE_METRICS.uniqueTokens,
  );
  const nftCount = pickMetric(input.nftCount, MOCK_SCORE_METRICS.nftCount);
  const protocolCount = pickMetric(
    input.protocolCount,
    MOCK_SCORE_METRICS.protocolCount,
  );
  const protocolInteractions = pickMetric(
    input.protocolInteractions,
    MOCK_SCORE_METRICS.protocolInteractions,
  );

  return {
    walletAgeDays: walletAgeDays.value,
    transactionCount: transactionCount.value,
    activeDays: activeDays.value,
    contractInteractions: contractInteractions.value,
    uniqueTokens: uniqueTokens.value,
    nftCount: nftCount.value,
    protocolCount: protocolCount.value,
    protocolInteractions: protocolInteractions.value,
    sources: {
      walletAgeDays: walletAgeDays.source,
      transactionCount: transactionCount.source,
      activeDays: activeDays.source,
      contractInteractions: contractInteractions.source,
      uniqueTokens: uniqueTokens.source,
      nftCount: nftCount.source,
      protocolCount: protocolCount.source,
      protocolInteractions: protocolInteractions.source,
    },
  };
}
