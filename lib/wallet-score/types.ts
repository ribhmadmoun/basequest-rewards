import type { Address } from "viem";
import type { WalletAnalyticsDashboard } from "@/lib/wallet-score/analytics/types";
import type { EcosystemProtocolHit } from "@/lib/wallet-score/ecosystem/types";
import type { WalletIntelligenceResult } from "@/lib/wallet-score/intelligence/types";
import type { WalletScoreResult } from "@/lib/wallet-score/scoring/types";

/** Marks whether a dashboard field is live, still mocked, or unavailable. */
export type DataSource = "live" | "mock" | "unavailable";

export type SourcedValue<T> = {
  value: T;
  source: DataSource;
};

/**
 * Live wallet connection + analytics-backed metrics for scoring / hero.
 */
export type LiveWalletBasics = {
  address: Address | null;
  isConnected: boolean;
  basename: string | null;
  ethBalance: string | null;
  usdcBalance: string | null;
  walletAgeDays: number | null;
  walletAgeLabel: string | null;
  firstSeenAt: string | null;
  transactionCount: number | null;
  activeDays: number | null;
  contractInteractions: number | null;
  uniqueTokens: number | null;
  nftCount: number | null;
  nftCollectionCount: number | null;
  protocolsUsed: number | null;
  protocolInteractions: number | null;
  ecosystemScore: number | null;
  ecosystemProtocols: EcosystemProtocolHit[];
  avatarLabel: string;
  isLoading: boolean;
  /** True while a background refresh is in flight with prior data shown. */
  isRefreshing: boolean;
  errors: {
    balances?: string;
    basename?: string;
    history?: string;
    transactionCount?: string;
    ecosystem?: string;
    activity?: string;
    tokens?: string;
    nfts?: string;
    analytics?: string;
  };
};

export type EcosystemUsagePanel = {
  source: DataSource;
  protocolsUsed: number;
  contractInteractions: number;
  ecosystemScore: number;
  scorePoints: number;
  scorePointsMax: number;
  protocols: Array<{
    id: string;
    name: string;
    interactions: number;
    share: number;
  }>;
};

/**
 * Full page view model — UI sections consume `analytics`, not mock data.
 */
export type WalletScoreViewModel = {
  live: LiveWalletBasics;
  hero: {
    title: string;
    score: number;
    maxScore: number;
    rank: string;
    percentile: string;
    walletAddress: string;
    basename: string | null;
    avatarLabel: string;
    tier: string;
    addressSource: DataSource;
    basenameSource: DataSource;
  };
  score: WalletScoreResult;
  ecosystem: EcosystemUsagePanel;
  intelligence: WalletIntelligenceResult;
  /** Unified live dashboard slices (Allocation, Momentum, Holdings, etc.). */
  analytics: WalletAnalyticsDashboard;
  stats: Array<{
    id: string;
    label: string;
    value: string;
    hint: string;
    source: DataSource;
  }>;
};
