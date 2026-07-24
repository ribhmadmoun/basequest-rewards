export type WalletScoreHero = {
  title: string;
  score: number;
  maxScore: number;
  rank: string;
  percentile: string;
  walletAddress: string;
  avatarLabel: string;
  tier: string;
};

export type WalletStat = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type PortfolioSlice = {
  id: string;
  label: string;
  percent: number;
  valueUsd: string;
  color: string;
};

export type ActivityPoint = {
  day: string;
  transactions: number;
  volumeUsd: number;
};

export type AssetRow = {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  valueUsd: string;
  change24h: string;
  changePositive: boolean;
};

export type NftItem = {
  id: string;
  name: string;
  collection: string;
  floor: string;
  accent: string;
};

export type ActivityItem = {
  id: string;
  type: string;
  description: string;
  amount: string;
  time: string;
  status: "success" | "pending";
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export type AiInsight = {
  id: string;
  category: string;
  title: string;
  body: string;
  evidence: string;
  confidence: number;
  impact: "score+" | "neutral" | "risk";
  recommendation: string;
};

export type ProtocolUsage = {
  id: string;
  name: string;
  category: string;
  interactions: number;
  volume: string;
  share: number;
};

/** Hero chrome labels. Live score replaces score; address/basename from wallet. */
export const walletScoreHero: WalletScoreHero = {
  title: "Base Wallet Score",
  score: 782,
  maxScore: 1000,
  rank: "#1,248",
  percentile: "Top 8%",
  walletAddress: "0xA4b2C91d7E8f3a6B9c0D1e2F3a4B5c6D7e8F9012",
  avatarLabel: "A4",
  tier: "Elite Builder",
};

/**
 * Stat card labels / ordering.
 * Numeric `value` fields also feed scoring-engine mock fallbacks when a live
 * metric is unavailable — UI display values are overwritten in compose.
 */
export const walletStats: WalletStat[] = [
  { id: "age", label: "Wallet Age", value: "412d", hint: "Since first tx" },
  { id: "txs", label: "Transactions", value: "1,847", hint: "On Base" },
  { id: "active", label: "Active Days", value: "186", hint: "Last 12 months" },
  { id: "eth", label: "ETH", value: "2.41", hint: "~$8,420" },
  { id: "usdc", label: "USDC", value: "12,450", hint: "Stable balance" },
  { id: "nfts", label: "NFTs", value: "24", hint: "Across 9 collections" },
  { id: "tokens", label: "Tokens", value: "31", hint: "Non-dust holdings" },
  {
    id: "contracts",
    label: "Smart Contracts",
    value: "67",
    hint: "Unique interacted",
  },
];
/**
 * Fallback protocol counts for the scoring engine when live ecosystem
 * metrics are unavailable. Not used by dashboard UI.
 */
export const protocolUsage: ProtocolUsage[] = [
  {
    id: "aero",
    name: "Aerodrome",
    category: "DEX",
    interactions: 142,
    volume: "$48.2k",
    share: 34,
  },
  {
    id: "uniswap",
    name: "Uniswap",
    category: "DEX",
    interactions: 98,
    volume: "$31.6k",
    share: 24,
  },
  {
    id: "aave",
    name: "Aave",
    category: "Lending",
    interactions: 41,
    volume: "$22.1k",
    share: 18,
  },
  {
    id: "bridge",
    name: "Base Bridge",
    category: "Bridge",
    interactions: 27,
    volume: "$19.4k",
    share: 14,
  },
  {
    id: "opensea",
    name: "OpenSea",
    category: "NFT",
    interactions: 36,
    volume: "$6.8k",
    share: 10,
  },
];
