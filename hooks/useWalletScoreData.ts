"use client";

import { composeWalletScoreView } from "@/lib/wallet-score/composeWalletScoreView";
import type { WalletAnalytics } from "@/lib/wallet-score/analytics/types";
import { USDC_BASE_ADDRESS } from "@/lib/wallet-score/constants";
import {
  formatTokenAmount,
  getAvatarLabel,
} from "@/lib/wallet-score/formatters";
import { userMessageForFailure } from "@/lib/wallet-score/errors";
import type { LiveWalletBasics } from "@/lib/wallet-score/types";
import { useName } from "@coinbase/onchainkit/identity";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Address } from "viem";
import { base } from "viem/chains";
import {
  useAccount,
  useBalance,
  useTransactionCount,
} from "wagmi";

async function fetchWalletAnalyticsClient(
  address: Address,
): Promise<WalletAnalytics> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(
      `/api/wallet-score/analytics?address=${encodeURIComponent(address)}`,
      {
        cache: "default",
        signal: controller.signal,
      },
    );

    if (response.status === 400) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error || userMessageForFailure("invalid"));
    }

    if (response.status === 429) {
      throw new Error(userMessageForFailure("rate_limit"));
    }

    if (!response.ok) {
      // Prefer a soft payload when the API still returns JSON analytics.
      const body = (await response.json().catch(() => null)) as
        | WalletAnalytics
        | { error?: string }
        | null;
      if (body && "metrics" in body) {
        return body;
      }
      throw new Error(
        (body && "error" in body && body.error) ||
          userMessageForFailure(
            response.status >= 500 ? "server" : "unknown",
          ),
      );
    }

    return (await response.json()) as WalletAnalytics;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(userMessageForFailure("timeout"));
    }
    if (error instanceof TypeError) {
      throw new Error(userMessageForFailure("network"));
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Base Wallet Score data hook.
 * Live connection via wagmi; analytics via unified API with resilient fallbacks.
 */
export function useWalletScoreData() {
  const { address, isConnected, status } = useAccount();
  const connectedAddress = isConnected ? address : undefined;

  const chainQuery = {
    enabled: Boolean(connectedAddress),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  } as const;

  const ethBalanceQuery = useBalance({
    address: connectedAddress,
    chainId: base.id,
    query: chainQuery,
  });

  const usdcBalanceQuery = useBalance({
    address: connectedAddress,
    token: USDC_BASE_ADDRESS,
    chainId: base.id,
    query: chainQuery,
  });

  const txCountQuery = useTransactionCount({
    address: connectedAddress,
    chainId: base.id,
    query: chainQuery,
  });

  const basenameQuery = useName(
    {
      address: connectedAddress as Address | undefined,
      chain: base,
    },
    {
      enabled: Boolean(connectedAddress),
    },
  );

  const analyticsQuery = useQuery({
    queryKey: ["wallet-score-analytics", connectedAddress],
    queryFn: () => fetchWalletAnalyticsClient(connectedAddress as Address),
    enabled: Boolean(connectedAddress),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    retry: 1,
    retryDelay: 1500,
  });

  const isLoading =
    status === "connecting" ||
    status === "reconnecting" ||
    (Boolean(connectedAddress) &&
      analyticsQuery.isLoading &&
      !analyticsQuery.data);

  const isRefreshing = Boolean(
    connectedAddress && analyticsQuery.isFetching && analyticsQuery.data,
  );

  const live: LiveWalletBasics = useMemo(() => {
    const ethBalance =
      formatTokenAmount(ethBalanceQuery.data?.value, 18, 4) ??
      analyticsQuery.data?.ethBalance ??
      null;
    const usdcBalance =
      formatTokenAmount(usdcBalanceQuery.data?.value, 6, 2) ??
      analyticsQuery.data?.usdcBalance ??
      null;
    const transactionCount =
      typeof txCountQuery.data === "number" ||
      typeof txCountQuery.data === "bigint"
        ? Number(txCountQuery.data)
        : (analyticsQuery.data?.metrics.transactionCount ?? null);

    const metrics = analyticsQuery.data?.metrics;
    const analyticsErrors = analyticsQuery.data?.errors;

    return {
      address: connectedAddress ?? null,
      isConnected: Boolean(connectedAddress),
      basename: basenameQuery.data ?? null,
      ethBalance,
      usdcBalance,
      walletAgeDays: metrics?.walletAgeDays ?? null,
      walletAgeLabel:
        metrics?.walletAgeDays !== null && metrics?.walletAgeDays !== undefined
          ? `${metrics.walletAgeDays}d`
          : null,
      firstSeenAt: analyticsQuery.data?.firstSeenAt ?? null,
      transactionCount,
      activeDays: metrics?.activeDays ?? null,
      contractInteractions: metrics?.contractInteractions ?? null,
      uniqueTokens: metrics?.uniqueTokens ?? null,
      nftCount: metrics?.nftCount ?? null,
      nftCollectionCount: metrics?.nftCollectionCount ?? null,
      protocolsUsed: metrics?.protocolsUsed ?? null,
      protocolInteractions: metrics?.protocolInteractions ?? null,
      ecosystemScore: metrics?.ecosystemScore ?? null,
      ecosystemProtocols: analyticsQuery.data?.protocols ?? [],
      avatarLabel: getAvatarLabel(connectedAddress),
      isLoading,
      isRefreshing,
      errors: {
        balances:
          ethBalanceQuery.error?.message ||
          usdcBalanceQuery.error?.message ||
          analyticsErrors?.balances,
        basename: basenameQuery.error?.message,
        history: analyticsErrors?.history,
        transactionCount: txCountQuery.error?.message,
        activity: analyticsErrors?.activity,
        tokens: analyticsErrors?.tokens,
        nfts: analyticsErrors?.nfts,
        ecosystem: analyticsErrors?.ecosystem,
        analytics:
          analyticsQuery.error?.message ||
          analyticsQuery.data?.statusMessage ||
          undefined,
      },
    };
  }, [
    connectedAddress,
    ethBalanceQuery.data?.value,
    ethBalanceQuery.error?.message,
    usdcBalanceQuery.data?.value,
    usdcBalanceQuery.error?.message,
    txCountQuery.data,
    txCountQuery.error?.message,
    basenameQuery.data,
    basenameQuery.error?.message,
    analyticsQuery.data,
    analyticsQuery.error?.message,
    isLoading,
    isRefreshing,
  ]);

  return useMemo(
    () => composeWalletScoreView(live, analyticsQuery.data ?? null),
    [live, analyticsQuery.data],
  );
}
