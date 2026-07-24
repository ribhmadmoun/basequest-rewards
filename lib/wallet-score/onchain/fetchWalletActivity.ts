import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2 } from "@/lib/wallet-score/constants";
import type { Address } from "viem";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ACTIVE_WINDOW_DAYS = 365;
/** Safety cap — enough pages to cover 12 months for typical Base wallets. */
const DEFAULT_MAX_PAGES = 40;

export type WalletActivityResult = {
  /** Distinct UTC calendar days with ≥1 Base tx in the last 12 months. */
  activeDays: number | null;
  /** Unique smart-contract addresses interacted with (to / created). */
  contractInteractions: number | null;
  transactionsScanned: number;
  windowStartAt: string;
  windowEndAt: string;
  source: "blockscout" | "unavailable";
  error?: string;
};

type BlockscoutAddressRef = {
  hash?: string;
  is_contract?: boolean;
};

type BlockscoutTx = {
  timestamp?: string;
  hash?: string;
  to?: BlockscoutAddressRef | null;
  created_contract?: BlockscoutAddressRef | null;
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

function parseTxTimeMs(timestamp: string | undefined): number | null {
  if (!timestamp) {
    return null;
  }

  const ms =
    Number.isFinite(Number(timestamp)) && String(timestamp).length <= 10
      ? Number(timestamp) * 1000
      : Date.parse(timestamp);

  return Number.isFinite(ms) ? ms : null;
}

/** UTC calendar day key: YYYY-MM-DD */
function utcDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function contractAddressFromTx(tx: BlockscoutTx): string | null {
  if (tx.to?.hash && tx.to.is_contract) {
    return normalizeAddress(tx.to.hash);
  }
  if (tx.created_contract?.hash) {
    return normalizeAddress(tx.created_contract.hash);
  }
  return null;
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
 * Scan recent Base transactions (newest → oldest) to compute:
 * - Active Days: distinct UTC days with ≥1 tx in the last 12 months
 * - Contract Interactions: unique smart-contract addresses touched
 */
export async function fetchWalletActivity(
  address: Address,
  options?: { maxPages?: number },
): Promise<WalletActivityResult> {
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const windowEndMs = Date.now();
  const windowStartMs = windowEndMs - ACTIVE_WINDOW_DAYS * MS_PER_DAY;
  const windowStartAt = new Date(windowStartMs).toISOString();
  const windowEndAt = new Date(windowEndMs).toISOString();

  try {
    const activeDayKeys = new Set<string>();
    const uniqueContracts = new Set<string>();
    let transactionsScanned = 0;
    let pageParams: Record<string, string> | undefined;
    let pages = 0;
    let reachedBeforeWindow = false;

    while (pages < maxPages && !reachedBeforeWindow) {
      const page = await fetchAddressTransactions(address, pageParams);
      const items = page.items ?? [];

      if (items.length === 0) {
        break;
      }

      for (const tx of items) {
        transactionsScanned += 1;
        const txMs = parseTxTimeMs(tx.timestamp);

        if (txMs === null) {
          continue;
        }

        // Newest-first: once we pass the window start, older pages are out of range.
        if (txMs < windowStartMs) {
          reachedBeforeWindow = true;
          break;
        }

        if (txMs <= windowEndMs) {
          activeDayKeys.add(utcDayKey(txMs));
        }

        const contract = contractAddressFromTx(tx);
        if (contract) {
          uniqueContracts.add(contract);
        }
      }

      pages += 1;
      const next = page.next_page_params;
      if (!next || reachedBeforeWindow) {
        break;
      }
      pageParams = toQueryParams(next);
    }

    return {
      activeDays: activeDayKeys.size,
      contractInteractions: uniqueContracts.size,
      transactionsScanned,
      windowStartAt,
      windowEndAt,
      source: "blockscout",
    };
  } catch (error) {
    return {
      activeDays: null,
      contractInteractions: null,
      transactionsScanned: 0,
      windowStartAt,
      windowEndAt,
      source: "unavailable",
      error:
        error instanceof Error ? error.message : "Activity fetch failed",
    };
  }
}
