import type { Address } from "viem";
import type { EcosystemProtocolHit } from "@/lib/wallet-score/ecosystem/types";
import type { NormalizedTokenHolding } from "@/lib/wallet-score/onchain/tokenFilters";
import type {
  Achievement,
  ActivityItem,
  ActivityPoint,
  AiInsight,
  AssetRow,
  NftItem,
  PortfolioSlice,
} from "@/lib/wallet-score/mock-data";
import type { DataSource } from "@/lib/wallet-score/types";

export type AnalyticsTx = {
  hash: string;
  timestamp: string;
  method: string | null;
  to: string | null;
  toIsContract: boolean;
  toName: string | null;
  valueEth: number;
  status: "success" | "pending" | "error";
};

export type AnalyticsNftItem = {
  id: string;
  name: string;
  collection: string;
  tokenId: string;
  contractAddress: string;
  accent: string;
};

export type WalletAnalyticsMetrics = {
  walletAgeDays: number | null;
  transactionCount: number | null;
  activeDays: number | null;
  contractInteractions: number | null;
  uniqueTokens: number | null;
  nftCount: number | null;
  nftCollectionCount: number | null;
  protocolsUsed: number | null;
  protocolInteractions: number | null;
  ecosystemScore: number | null;
};

/** High-level analytics health for resilient UI messaging. */
export type AnalyticsHealth =
  | "ok"
  | "degraded"
  | "empty"
  | "unavailable";

/**
 * Unified live on-chain analytics for a Base wallet.
 * All dashboard widgets and score metric inputs derive from this layer.
 */
export type WalletAnalytics = {
  address: Address;
  source: DataSource;
  fetchedAt: string;
  firstSeenAt: string | null;
  ethBalance: string | null;
  ethUsd: number | null;
  usdcBalance: string | null;
  tokens: NormalizedTokenHolding[];
  nftItems: AnalyticsNftItem[];
  transactions: AnalyticsTx[];
  protocols: EcosystemProtocolHit[];
  metrics: WalletAnalyticsMetrics;
  /** Aggregated health for banners / fallbacks (scoring unchanged). */
  health: AnalyticsHealth;
  /** User-facing status line; null when everything is healthy. */
  statusMessage: string | null;
  /** True when this payload was served from stale cache after a provider failure. */
  fromCache: boolean;
  errors: Partial<
    Record<
      | "history"
      | "activity"
      | "tokens"
      | "nfts"
      | "ecosystem"
      | "transactions"
      | "balances",
      string
    >
  >;
};

export type SnapshotInsight = {
  id: "strength" | "weakness" | "improve";
  label: string;
  headline: string;
  detail: string;
};

/** UI-ready slices derived exclusively from WalletAnalytics (+ score). */
export type WalletAnalyticsDashboard = {
  source: DataSource;
  health: AnalyticsHealth;
  statusMessage: string | null;
  fromCache: boolean;
  portfolioDistribution: PortfolioSlice[];
  walletActivity: ActivityPoint[];
  assetsTable: AssetRow[];
  nftItems: NftItem[];
  recentActivity: ActivityItem[];
  achievements: Achievement[];
  snapshotInsights: SnapshotInsight[];
  aiInsights: AiInsight[];
  protocols: EcosystemProtocolHit[];
  sectionErrors: Partial<
    Record<
      | "portfolio"
      | "activity"
      | "assets"
      | "nfts"
      | "timeline"
      | "insights"
      | "ecosystem",
      string
    >
  >;
};
