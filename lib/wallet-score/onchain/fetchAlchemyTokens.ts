import { cachedJsonPost } from "@/lib/wallet-score/cache";
import type { NormalizedTokenHolding } from "@/lib/wallet-score/onchain/tokenFilters";
import { parseDecimals } from "@/lib/wallet-score/onchain/tokenFilters";
import type { Address } from "viem";

/**
 * Resolve Alchemy Base RPC URL from existing env keys.
 * Supports dedicated Alchemy keys or an Alchemy-hosted BASE_RPC_URL.
 */
export function resolveAlchemyBaseRpcUrl(): string | null {
  const explicit =
    process.env.ALCHEMY_BASE_RPC_URL ||
    process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC_URL;
  if (explicit) {
    return explicit;
  }

  const key =
    process.env.ALCHEMY_API_KEY ||
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ||
    process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;

  if (!key) {
    return null;
  }

  // CDP / OnchainKit keys are not Alchemy keys — only use Alchemy URL shape
  // when an Alchemy-specific key/env is present.
  if (
    process.env.ALCHEMY_API_KEY ||
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ||
    process.env.ALCHEMY_BASE_RPC_URL ||
    process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC_URL
  ) {
    return `https://base-mainnet.g.alchemy.com/v2/${key}`;
  }

  const rpc = process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL;
  if (rpc && /alchemy\.com/i.test(rpc)) {
    return rpc;
  }

  return null;
}

type AlchemyTokenBalance = {
  contractAddress?: string;
  tokenBalance?: string;
};

type AlchemyTokenBalancesResponse = {
  result?: {
    tokenBalances?: AlchemyTokenBalance[];
  };
  error?: { message?: string };
};

type AlchemyTokenMetadataResponse = {
  result?: {
    decimals?: number | null;
    name?: string | null;
    symbol?: string | null;
  };
  error?: { message?: string };
};

async function alchemyRpc<T>(
  rpcUrl: string,
  method: string,
  params: unknown[],
): Promise<T> {
  return cachedJsonPost<T>(rpcUrl, {
    errorPrefix: "Alchemy HTTP",
    revalidateSeconds: 60,
    body: {
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    },
  });
}

function hexToDecimalString(hex: string): string {
  try {
    return BigInt(hex).toString(10);
  } catch {
    return "0";
  }
}

/**
 * Fallback provider: Alchemy `alchemy_getTokenBalances` + metadata.
 * Used only when Blockscout fails.
 */
export async function fetchAlchemyErc20Holdings(
  address: Address,
): Promise<NormalizedTokenHolding[]> {
  const rpcUrl = resolveAlchemyBaseRpcUrl();
  if (!rpcUrl) {
    throw new Error("Alchemy fallback is not configured");
  }

  const balancesPayload = await alchemyRpc<AlchemyTokenBalancesResponse>(
    rpcUrl,
    "alchemy_getTokenBalances",
    [address, "erc20"],
  );

  if (balancesPayload.error?.message) {
    throw new Error(balancesPayload.error.message);
  }

  const rows = balancesPayload.result?.tokenBalances ?? [];
  const holdings: NormalizedTokenHolding[] = [];

  for (const row of rows) {
    const contract = row.contractAddress?.trim().toLowerCase();
    const hexBalance = row.tokenBalance;
    if (!contract || !hexBalance || hexBalance === "0x0") {
      continue;
    }

    const rawBalance = hexToDecimalString(hexBalance);
    if (rawBalance === "0") {
      continue;
    }

    let symbol = "";
    let name = "";
    let decimals = 18;

    try {
      const meta = await alchemyRpc<AlchemyTokenMetadataResponse>(
        rpcUrl,
        "alchemy_getTokenMetadata",
        [contract],
      );
      if (!meta.error) {
        symbol = String(meta.result?.symbol ?? "").trim();
        name = String(meta.result?.name ?? "").trim();
        decimals = parseDecimals(meta.result?.decimals ?? 18);
      }
    } catch {
      // Metadata miss → filter layer will drop empty symbol/name.
    }

    holdings.push({
      address: contract,
      symbol,
      name,
      decimals,
      rawBalance,
      exchangeRateUsd: null,
      holders: null,
    });
  }

  return holdings;
}
