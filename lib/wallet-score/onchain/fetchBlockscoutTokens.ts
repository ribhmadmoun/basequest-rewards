import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2 } from "@/lib/wallet-score/constants";
import type { NormalizedTokenHolding } from "@/lib/wallet-score/onchain/tokenFilters";
import {
  parseDecimals,
  parseExchangeRate,
  parseHolders,
} from "@/lib/wallet-score/onchain/tokenFilters";
import type { Address } from "viem";

type BlockscoutToken = {
  address?: string;
  address_hash?: string;
  symbol?: string | null;
  name?: string | null;
  decimals?: string | number | null;
  type?: string | null;
  holders?: string | number | null;
  holders_count?: string | number | null;
  exchange_rate?: string | number | null;
};

type BlockscoutTokenBalance = {
  value?: string;
  token?: BlockscoutToken;
};

type BlockscoutTokensPage = {
  items?: BlockscoutTokenBalance[];
  next_page_params?: Record<string, string | number> | null;
};

function toQueryParams(
  params: Record<string, string | number>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
}

function normalizeAddress(token: BlockscoutToken): string {
  const raw = token.address_hash || token.address || "";
  return raw.trim().toLowerCase();
}

export async function fetchBlockscoutErc20Holdings(
  address: Address,
): Promise<NormalizedTokenHolding[]> {
  const holdings: NormalizedTokenHolding[] = [];
  let pageParams: Record<string, string> | undefined;
  let pages = 0;
  const maxPages = 20;

  while (pages < maxPages) {
    const url = new URL(
      `${BLOCKSCOUT_BASE_API_V2}/addresses/${address}/tokens`,
    );
    url.searchParams.set("type", "ERC-20");
    if (pageParams) {
      for (const [key, value] of Object.entries(pageParams)) {
        url.searchParams.set(key, value);
      }
    }

    const page = await cachedJsonGet<BlockscoutTokensPage>(url.toString(), {
      errorPrefix: "Blockscout tokens HTTP",
      revalidateSeconds: 60,
    });
    const items = page.items ?? [];

    for (const item of items) {
      const token = item.token;
      if (!token) {
        continue;
      }

      const tokenAddress = normalizeAddress(token);
      if (!tokenAddress) {
        continue;
      }

      holdings.push({
        address: tokenAddress,
        symbol: String(token.symbol ?? "").trim(),
        name: String(token.name ?? "").trim(),
        decimals: parseDecimals(token.decimals),
        rawBalance: String(item.value ?? "0"),
        exchangeRateUsd: parseExchangeRate(token.exchange_rate),
        holders: parseHolders(token.holders_count ?? token.holders),
      });
    }

    pages += 1;
    const next = page.next_page_params;
    if (!next || items.length === 0) {
      break;
    }
    pageParams = toQueryParams(next);
  }

  return holdings;
}
