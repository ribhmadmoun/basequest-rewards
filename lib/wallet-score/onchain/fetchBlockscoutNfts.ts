import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2 } from "@/lib/wallet-score/constants";
import type { NftHoldingSummary } from "@/lib/wallet-score/onchain/nftActivityTypes";
import {
  summarizeNftCollections,
  type NftCollectionCandidate,
} from "@/lib/wallet-score/onchain/nftFilters";
import type { Address } from "viem";

export type BlockscoutNftFetchResult = NftHoldingSummary & {
  /** True when pagination stopped early while more pages remained. */
  incomplete: boolean;
};

type BlockscoutTokenRef = {
  address?: string;
  address_hash?: string;
  name?: string | null;
  symbol?: string | null;
  type?: string | null;
  holders?: string | number | null;
  holders_count?: string | number | null;
};

type BlockscoutNftCollection = {
  token?: BlockscoutTokenRef;
  amount?: string | number | null;
  token_instances?: unknown[];
};

type BlockscoutNftInstance = {
  token?: BlockscoutTokenRef;
  id?: string | null;
  value?: string | number | null;
};

type BlockscoutPage<T> = {
  items?: T[];
  next_page_params?: Record<string, string | number> | null;
};

const MAX_PAGES = 25;

function toQueryParams(
  params: Record<string, string | number>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
}

function tokenAddress(token: BlockscoutTokenRef | undefined): string | null {
  const raw = token?.address_hash || token?.address || "";
  const normalized = raw.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(normalized) ? normalized : null;
}

function parseAmount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 1;
  }
  return Math.floor(n);
}

function parseHolders(token: BlockscoutTokenRef | undefined): number | null {
  const raw = token?.holders_count ?? token?.holders;
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function fetchJsonPage<T>(
  path: string,
  pageParams?: Record<string, string>,
): Promise<BlockscoutPage<T>> {
  const url = new URL(`${BLOCKSCOUT_BASE_API_V2}${path}`);
  url.searchParams.set("type", "ERC-721,ERC-1155");
  if (pageParams) {
    for (const [key, value] of Object.entries(pageParams)) {
      url.searchParams.set(key, value);
    }
  }

  return cachedJsonGet<BlockscoutPage<T>>(url.toString(), {
    errorPrefix: "Blockscout NFT HTTP",
    revalidateSeconds: 60,
  });
}

async function paginate<T>(
  path: string,
  onItems: (items: T[]) => void,
): Promise<{ incomplete: boolean }> {
  let pageParams: Record<string, string> | undefined;
  let pages = 0;
  let incomplete = false;

  while (pages < MAX_PAGES) {
    const page = await fetchJsonPage<T>(path, pageParams);
    const items = page.items ?? [];
    if (items.length === 0) {
      break;
    }
    onItems(items);
    pages += 1;
    const next = page.next_page_params;
    if (!next) {
      break;
    }
    if (pages >= MAX_PAGES) {
      incomplete = true;
      break;
    }
    pageParams = toQueryParams(next);
  }

  return { incomplete };
}

function toCandidate(
  token: BlockscoutTokenRef | undefined,
  amount: number,
): NftCollectionCandidate | null {
  const contract = tokenAddress(token);
  if (!contract) {
    return null;
  }

  return {
    contractAddress: contract,
    name: token?.name ?? null,
    symbol: token?.symbol ?? null,
    amount,
    holders: parseHolders(token),
  };
}

/**
 * Blockscout NFT endpoint:
 * 1) `/nft/collections` (preferred)
 * 2) `/nft` instance list if collections missing/empty
 */
export async function fetchBlockscoutNftHoldings(
  address: Address,
): Promise<BlockscoutNftFetchResult> {
  const byContract = new Map<string, NftCollectionCandidate>();
  let incomplete = false;
  let usedCollectionsEndpoint = false;

  const addCandidate = (candidate: NftCollectionCandidate | null) => {
    if (!candidate) {
      return;
    }
    const existing = byContract.get(candidate.contractAddress);
    if (existing) {
      existing.amount += candidate.amount;
      if (!existing.name && candidate.name) {
        existing.name = candidate.name;
      }
      if (!existing.symbol && candidate.symbol) {
        existing.symbol = candidate.symbol;
      }
      if (
        (existing.holders === null || existing.holders === undefined) &&
        candidate.holders !== null &&
        candidate.holders !== undefined
      ) {
        existing.holders = candidate.holders;
      }
      return;
    }
    byContract.set(candidate.contractAddress, candidate);
  };

  try {
    const result = await paginate<BlockscoutNftCollection>(
      `/addresses/${address}/nft/collections`,
      (items) => {
        usedCollectionsEndpoint = true;
        for (const item of items) {
          let amount = 1;
          if (typeof item.amount !== "undefined" && item.amount !== null) {
            amount = parseAmount(item.amount);
          } else if (Array.isArray(item.token_instances)) {
            amount = Math.max(1, item.token_instances.length);
          }
          addCandidate(toCandidate(item.token, amount));
        }
      },
    );
    incomplete = result.incomplete;
  } catch {
    usedCollectionsEndpoint = false;
    byContract.clear();
    incomplete = false;
  }

  if (!usedCollectionsEndpoint || byContract.size === 0) {
    byContract.clear();
    const result = await paginate<BlockscoutNftInstance>(
      `/addresses/${address}/nft`,
      (items) => {
        for (const item of items) {
          addCandidate(toCandidate(item.token, parseAmount(item.value ?? 1)));
        }
      },
    );
    incomplete = result.incomplete;
  }

  const summary = summarizeNftCollections([...byContract.values()]);
  return {
    ...summary,
    incomplete,
  };
}
