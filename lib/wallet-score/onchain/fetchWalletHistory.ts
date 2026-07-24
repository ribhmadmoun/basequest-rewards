import { CACHE_TTL_MS, cachedJsonGet, getOrSetCached } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2 } from "@/lib/wallet-score/constants";
import { daysSinceTimestamp } from "@/lib/wallet-score/formatters";
import type { Address } from "viem";

export type WalletHistoryResult = {
  firstSeenAt: string | null;
  walletAgeDays: number | null;
  source: "blockscout" | "unavailable";
  error?: string;
};

type BlockscoutTx = {
  timestamp?: string;
  block_number?: number;
  hash?: string;
};

type BlockscoutTxPage = {
  items?: BlockscoutTx[];
  next_page_params?: Record<string, string | number> | null;
};

function toQueryParams(
  params: Record<string, string | number>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
}

async function fetchAddressTransactions(
  address: Address,
  params?: Record<string, string>,
): Promise<BlockscoutTxPage> {
  const url = new URL(
    `${BLOCKSCOUT_BASE_API_V2}/addresses/${address}/transactions`,
  );

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return cachedJsonGet<BlockscoutTxPage>(url.toString(), {
    errorPrefix: "Blockscout HTTP",
    revalidateSeconds: 60,
  });
}

/**
 * Blockscout V2 returns newest transactions first.
 * Find the wallet's first (oldest) transaction via cursor binary search,
 * then drain remaining older pages from that cursor.
 */
async function findFirstTransaction(
  address: Address,
): Promise<BlockscoutTx | null> {
  const tipPage = await fetchAddressTransactions(address);
  const tipItems = tipPage.items ?? [];

  if (tipItems.length === 0) {
    return null;
  }

  let oldest = tipItems[tipItems.length - 1];

  if (!tipPage.next_page_params) {
    return oldest;
  }

  const tipOldestBlock = tipItems[tipItems.length - 1]?.block_number;
  if (typeof tipOldestBlock !== "number") {
    return oldest;
  }

  let lo = 0;
  let hi = tipOldestBlock;

  for (let i = 0; i < 24 && hi - lo > 1; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    const page = await fetchAddressTransactions(address, {
      block_number: String(mid),
      index: "0",
      items_count: "50",
    });

    const items = page.items ?? [];
    if (items.length === 0) {
      lo = mid;
      continue;
    }

    oldest = items[items.length - 1];

    let params = page.next_page_params;
    let guard = 0;

    while (params && guard < 40) {
      const nextPage = await fetchAddressTransactions(
        address,
        toQueryParams(params),
      );
      const nextItems = nextPage.items ?? [];
      if (nextItems.length === 0) {
        break;
      }

      oldest = nextItems[nextItems.length - 1];
      params = nextPage.next_page_params;
      guard += 1;
    }

    // Reached the start of history for this address.
    if (!params) {
      return oldest;
    }

    hi = mid;
  }

  return oldest;
}

/**
 * Resolve wallet age from the earliest Base transaction via Blockscout API V2.
 * Kept server-side so remaining history metrics can share this provider later.
 */
export async function fetchWalletHistory(
  address: Address,
): Promise<WalletHistoryResult> {
  return getOrSetCached(
    `wallet-history:${address.toLowerCase()}`,
    CACHE_TTL_MS.walletHistory,
    async () => {
      try {
        const firstTx = await findFirstTransaction(address);
        const timestamp = firstTx?.timestamp;

        if (!timestamp) {
          return {
            firstSeenAt: null,
            walletAgeDays: null,
            source: "unavailable",
            error: "No transactions found on Base",
          };
        }

        const walletAgeDays = daysSinceTimestamp(timestamp);
        const firstSeenAt = new Date(timestamp).toISOString();

        if (walletAgeDays === null) {
          return {
            firstSeenAt: null,
            walletAgeDays: null,
            source: "unavailable",
            error: "Invalid first transaction timestamp",
          };
        }

        return {
          firstSeenAt,
          walletAgeDays,
          source: "blockscout",
        };
      } catch (error) {
        return {
          firstSeenAt: null,
          walletAgeDays: null,
          source: "unavailable",
          error: error instanceof Error ? error.message : "History fetch failed",
        };
      }
    },
    {
      // Persist successes and empty wallets; skip transient provider failures.
      shouldCache: (result) =>
        result.source === "blockscout" ||
        result.error === "No transactions found on Base",
    },
  );
}
