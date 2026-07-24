import type {
  SnapshotInsight,
  WalletAnalytics,
  WalletAnalyticsDashboard,
} from "@/lib/wallet-score/analytics/types";
import { USDC_BASE_ADDRESS } from "@/lib/wallet-score/constants";
import { getScoreImprovementSuggestions } from "@/lib/wallet-score/scoring/improvements";
import type { WalletScoreResult } from "@/lib/wallet-score/scoring/types";
import { humanBalance } from "@/lib/wallet-score/onchain/tokenFilters";
import type {
  Achievement,
  ActivityItem,
  ActivityPoint,
  AiInsight,
  AssetRow,
  NftItem,
  PortfolioSlice,
} from "@/lib/wallet-score/mock-data";

const PORTFOLIO_COLORS = [
  "#0052ff",
  "#22d3ee",
  "#a78bfa",
  "#38bdf8",
  "#f59e0b",
  "#34d399",
] as const;

function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "$0";
  }
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });
}

function relativeTime(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    return "—";
  }
  const delta = Date.now() - ms;
  const mins = Math.floor(delta / 60000);
  if (mins < 60) {
    return `${Math.max(1, mins)}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function classifyMethod(method: string | null, toIsContract: boolean): string {
  const m = (method || "").toLowerCase();
  if (m.includes("swap")) return "Swap";
  if (m.includes("mint")) return "Mint";
  if (m.includes("stake") || m.includes("deposit")) return "Stake";
  if (m.includes("transfer") || m === "transfer") return "Transfer";
  if (m.includes("bridge")) return "Bridge";
  if (toIsContract || m) return "Contract";
  return "Transfer";
}

function buildPortfolio(analytics: WalletAnalytics): PortfolioSlice[] {
  const slices: Array<{ id: string; label: string; usd: number; color: string }> =
    [];

  if (analytics.ethUsd && analytics.ethUsd > 0) {
    slices.push({
      id: "eth",
      label: "ETH",
      usd: analytics.ethUsd,
      color: PORTFOLIO_COLORS[0],
    });
  }

  let usdcUsd = 0;
  let otherUsd = 0;
  for (const token of analytics.tokens) {
    const units = humanBalance(token.rawBalance, token.decimals);
    const rate = token.exchangeRateUsd ?? 0;
    const usd = units * rate;
    if (!Number.isFinite(usd) || usd <= 0) {
      continue;
    }
    if (token.address === USDC_BASE_ADDRESS.toLowerCase()) {
      usdcUsd += usd;
    } else {
      otherUsd += usd;
    }
  }

  if (usdcUsd > 0) {
    slices.push({
      id: "usdc",
      label: "USDC",
      usd: usdcUsd,
      color: PORTFOLIO_COLORS[1],
    });
  }
  if (otherUsd > 0) {
    slices.push({
      id: "other",
      label: "Other Tokens",
      usd: otherUsd,
      color: PORTFOLIO_COLORS[3],
    });
  }

  const total = slices.reduce((sum, row) => sum + row.usd, 0);
  if (total <= 0) {
    return [];
  }

  return slices.map((row) => ({
    id: row.id,
    label: row.label,
    percent: Math.max(1, Math.round((row.usd / total) * 100)),
    valueUsd: formatUsd(row.usd),
    color: row.color,
  }));
}

function buildActivitySeries(analytics: WalletAnalytics): ActivityPoint[] {
  const ethUnits = analytics.ethBalance
    ? Number(String(analytics.ethBalance).replace(/,/g, ""))
    : 0;
  const ethPrice =
    analytics.ethUsd !== null && ethUnits > 0
      ? analytics.ethUsd / ethUnits
      : 0;

  const buckets = new Map<string, ActivityPoint>();
  const now = new Date();

  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - i,
    ));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    buckets.set(key, { day: label, transactions: 0, volumeUsd: 0 });
  }

  for (const tx of analytics.transactions) {
    const ms = Date.parse(tx.timestamp);
    if (!Number.isFinite(ms)) {
      continue;
    }
    const key = new Date(ms).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) {
      continue;
    }
    bucket.transactions += 1;
    if (ethPrice > 0 && tx.valueEth > 0) {
      bucket.volumeUsd += Math.round(tx.valueEth * ethPrice);
    }
  }

  return [...buckets.values()];
}

function buildAssetsTable(analytics: WalletAnalytics): AssetRow[] {
  const rows: AssetRow[] = [];

  if (analytics.ethBalance) {
    rows.push({
      id: "eth",
      symbol: "ETH",
      name: "Ether",
      balance: analytics.ethBalance,
      valueUsd: analytics.ethUsd !== null ? formatUsd(analytics.ethUsd) : "—",
      change24h: "—",
      changePositive: true,
    });
  }

  const sorted = [...analytics.tokens].sort((a, b) => {
    const aUsd = humanBalance(a.rawBalance, a.decimals) * (a.exchangeRateUsd ?? 0);
    const bUsd = humanBalance(b.rawBalance, b.decimals) * (b.exchangeRateUsd ?? 0);
    return bUsd - aUsd;
  });

  for (const token of sorted.slice(0, 12)) {
    const units = humanBalance(token.rawBalance, token.decimals);
    const usd =
      token.exchangeRateUsd !== null
        ? units * token.exchangeRateUsd
        : null;
    rows.push({
      id: token.address,
      symbol: token.symbol || "TOKEN",
      name: token.name || token.symbol || "Token",
      balance: units.toLocaleString(undefined, {
        maximumFractionDigits: token.decimals > 8 ? 4 : 2,
      }),
      valueUsd: usd !== null && usd > 0 ? formatUsd(usd) : "—",
      change24h: "—",
      changePositive: true,
    });
  }

  return rows;
}

function buildNftItems(analytics: WalletAnalytics): NftItem[] {
  return analytics.nftItems.map((nft) => ({
    id: nft.id,
    name: nft.name,
    collection: nft.collection,
    floor: "—",
    accent: nft.accent,
  }));
}

function buildTimeline(analytics: WalletAnalytics): ActivityItem[] {
  return analytics.transactions.slice(0, 8).map((tx, index) => {
    const type = classifyMethod(tx.method, tx.toIsContract);
    const target = tx.toName || (tx.to ? `${tx.to.slice(0, 6)}…${tx.to.slice(-4)}` : "Base");
    const amount =
      tx.valueEth > 0
        ? `${tx.valueEth.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`
        : type;
    return {
      id: tx.hash || String(index),
      type,
      description:
        tx.method
          ? `${tx.method} → ${target}`
          : tx.toIsContract
            ? `Interacted with ${target}`
            : `Transfer involving ${target}`,
      amount,
      time: relativeTime(tx.timestamp),
      status: tx.status === "pending" ? "pending" : "success",
    };
  });
}

function buildAchievementsFromMetrics(
  m: WalletAnalytics["metrics"],
  recentTxCount: number,
): Achievement[] {
  const age = m.walletAgeDays ?? 0;
  const active = m.activeDays ?? 0;
  const tokens = m.uniqueTokens ?? 0;
  const nfts = m.nftCount ?? 0;
  const protocols = m.protocolsUsed ?? 0;
  const contracts = m.contractInteractions ?? 0;

  return [
    {
      id: "early",
      title: "Early Base",
      description: "Wallet age over 180 days on Base",
      unlocked: age >= 180,
    },
    {
      id: "power",
      title: "Power User",
      description: "50+ recent Base transactions scanned",
      unlocked: recentTxCount >= 50 || active >= 60,
    },
    {
      id: "defi",
      title: "DeFi Native",
      description: "Used 3+ Base ecosystem protocols",
      unlocked: protocols >= 3,
    },
    {
      id: "collector",
      title: "Collector",
      description: "Hold 5+ NFTs on Base",
      unlocked: nfts >= 5,
    },
    {
      id: "diverse",
      title: "Diversified",
      description: "Hold 5+ non-dust ERC-20 tokens",
      unlocked: tokens >= 5,
    },
    {
      id: "builder",
      title: "Contract Savvy",
      description: "Interacted with 20+ unique contracts",
      unlocked: contracts >= 20,
    },
  ];
}

function buildAchievements(analytics: WalletAnalytics): Achievement[] {
  return buildAchievementsFromMetrics(
    analytics.metrics,
    analytics.transactions.length,
  );
}

function buildSnapshot(
  score: WalletScoreResult,
): SnapshotInsight[] {
  const suggestions = getScoreImprovementSuggestions(
    score.breakdown,
    score.maxScore,
    { limit: 2 },
  );
  const strongest = [...score.breakdown].sort(
    (a, b) => b.categoryScore - a.categoryScore,
  )[0];

  const insights: SnapshotInsight[] = [
    {
      id: "strength",
      label: "Biggest Strength",
      headline: strongest?.label ?? "Onchain activity",
      detail: strongest
        ? `${Math.round(strongest.categoryScore)}/100 in ${strongest.label} from live Base metrics.`
        : "Connect a wallet to analyze strengths.",
    },
  ];

  if (suggestions[0]) {
    insights.push({
      id: "weakness",
      label: "Biggest Weakness",
      headline: suggestions[0].categoryLabel,
      detail: suggestions[0].recommendation,
    });
  }

  if (suggestions[1] || suggestions[0]) {
    const tip = suggestions[1] ?? suggestions[0];
    insights.push({
      id: "improve",
      label: "Next Score Improvement",
      headline: tip.categoryLabel,
      detail: `Up to +${tip.potentialGain} pts — ${tip.recommendation}`,
    });
  }

  return insights.slice(0, 3);
}

function buildInsights(
  analytics: WalletAnalytics,
  score: WalletScoreResult,
): AiInsight[] {
  const m = analytics.metrics;
  return [
    {
      id: "activity",
      category: "Score driver",
      title: "Live Base activity is shaping your score",
      body: `Your Wallet Score is ${score.score}/${score.maxScore} from live metrics: ${m.activeDays ?? 0} active days (12m), ${m.contractInteractions ?? 0} unique contracts, and ${m.protocolsUsed ?? 0} known protocols.`,
      evidence: `${analytics.transactions.length} recent txs scanned · ${m.uniqueTokens ?? 0} non-dust tokens`,
      confidence: analytics.source === "live" ? 88 : 40,
      impact: "score+",
      recommendation:
        "Keep a weekly cadence of meaningful Base interactions to defend your percentile.",
    },
    {
      id: "portfolio",
      category: "Portfolio",
      title:
        analytics.tokens.length > 0
          ? "Token holdings are reflected in Asset Diversity"
          : "Limited non-dust token diversity detected",
      body:
        analytics.tokens.length > 0
          ? `Counted ${m.uniqueTokens ?? 0} non-dust ERC-20s on Base after spam/dust filters.`
          : "No countable ERC-20 holdings yet — diversity score will stay low until you hold non-dust tokens.",
      evidence: `ETH ${analytics.ethBalance ?? "—"} · USDC ${analytics.usdcBalance ?? "—"}`,
      confidence: 82,
      impact: analytics.tokens.length > 0 ? "neutral" : "risk",
      recommendation:
        "Hold a broader set of productive Base assets to lift Asset Diversity.",
    },
    {
      id: "ecosystem",
      category: "Ecosystem",
      title:
        (m.protocolsUsed ?? 0) > 0
          ? "Base ecosystem usage is live"
          : "No known Base protocols detected yet",
      body:
        (m.protocolsUsed ?? 0) > 0
          ? `Detected ${m.protocolsUsed} protocols with ${m.protocolInteractions ?? 0} interactions in recent history.`
          : "Interact with Aerodrome, Uniswap, Aave, or other Base apps to raise ecosystem score.",
      evidence: analytics.protocols
        .slice(0, 3)
        .map((p) => `${p.name} (${p.interactions})`)
        .join(" · ") || "No protocol hits",
      confidence: 80,
      impact: (m.protocolsUsed ?? 0) > 0 ? "score+" : "neutral",
      recommendation:
        "Route swaps and liquidity through established Base protocols you already trust.",
    },
  ];
}

function sectionErrorsFromAnalytics(
  analytics: WalletAnalytics,
): WalletAnalyticsDashboard["sectionErrors"] {
  return {
    portfolio: analytics.errors.tokens || analytics.errors.balances,
    activity: analytics.errors.activity || analytics.errors.transactions,
    assets: analytics.errors.tokens || analytics.errors.balances,
    nfts: analytics.errors.nfts,
    timeline: analytics.errors.transactions || analytics.errors.activity,
    insights: analytics.errors.activity,
    ecosystem: analytics.errors.ecosystem,
  };
}

/**
 * Derive all dashboard UI slices from the unified analytics layer + score.
 * No mock datasets — empty arrays when data is missing.
 */
export function deriveAnalyticsDashboard(
  analytics: WalletAnalytics | null,
  score: WalletScoreResult,
): WalletAnalyticsDashboard {
  if (!analytics) {
    const emptyMetrics = {
      walletAgeDays: null,
      transactionCount: null,
      activeDays: null,
      contractInteractions: null,
      uniqueTokens: null,
      nftCount: null,
      nftCollectionCount: null,
      protocolsUsed: null,
      protocolInteractions: null,
      ecosystemScore: null,
    } satisfies WalletAnalytics["metrics"];

    return {
      source: "unavailable",
      health: "unavailable",
      statusMessage: null,
      fromCache: false,
      portfolioDistribution: [],
      walletActivity: [],
      assetsTable: [],
      nftItems: [],
      recentActivity: [],
      achievements: buildAchievementsFromMetrics(emptyMetrics, 0),
      snapshotInsights: buildSnapshot(score),
      aiInsights: [],
      protocols: [],
      sectionErrors: {},
    };
  }

  return {
    source: analytics.source,
    health: analytics.health,
    statusMessage: analytics.statusMessage,
    fromCache: analytics.fromCache,
    portfolioDistribution: buildPortfolio(analytics),
    walletActivity: buildActivitySeries(analytics),
    assetsTable: buildAssetsTable(analytics),
    nftItems: buildNftItems(analytics),
    recentActivity: buildTimeline(analytics),
    achievements: buildAchievements(analytics),
    snapshotInsights: buildSnapshot(score),
    aiInsights: buildInsights(analytics, score),
    protocols: analytics.protocols,
    sectionErrors: sectionErrorsFromAnalytics(analytics),
  };
}
