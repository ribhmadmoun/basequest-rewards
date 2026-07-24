import type { AnalyticsTx } from "@/lib/wallet-score/analytics/types";
import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2 } from "@/lib/wallet-score/constants";
import type { Address } from "viem";
import { formatUnits } from "viem";

type BlockscoutAddressRef = {
  hash?: string;
  is_contract?: boolean;
  name?: string | null;
};

type BlockscoutTx = {
  hash?: string;
  timestamp?: string;
  status?: string | null;
  result?: string | null;
  method?: string | null;
  value?: string | null;
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

function parseEth(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  try {
    return Number(formatUnits(BigInt(value), 18));
  } catch {
    return 0;
  }
}

function mapStatus(tx: BlockscoutTx): AnalyticsTx["status"] {
  const raw = (tx.result || tx.status || "").toLowerCase();
  if (raw.includes("pending")) {
    return "pending";
  }
  if (raw.includes("error") || raw.includes("fail")) {
    return "error";
  }
  return "success";
}

/**
 * Recent Base transactions for timeline + momentum charts.
 */
export async function fetchRecentTransactions(
  address: Address,
  options?: { maxPages?: number; maxItems?: number },
): Promise<AnalyticsTx[]> {
  const maxPages = options?.maxPages ?? 4;
  const maxItems = options?.maxItems ?? 80;
  const txs: AnalyticsTx[] = [];
  let pageParams: Record<string, string> | undefined;
  let pages = 0;

  while (pages < maxPages && txs.length < maxItems) {
    const url = new URL(
      `${BLOCKSCOUT_BASE_API_V2}/addresses/${address}/transactions`,
    );
    if (pageParams) {
      for (const [key, value] of Object.entries(pageParams)) {
        url.searchParams.set(key, value);
      }
    }

    const page = await cachedJsonGet<BlockscoutTxPage>(url.toString(), {
      errorPrefix: "Blockscout txs HTTP",
      revalidateSeconds: 60,
    });
    const items = page.items ?? [];
    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      if (!item.hash || !item.timestamp) {
        continue;
      }
      txs.push({
        hash: item.hash,
        timestamp: item.timestamp,
        method: item.method ?? null,
        to: item.to?.hash?.toLowerCase() ?? item.created_contract?.hash?.toLowerCase() ?? null,
        toIsContract: Boolean(item.to?.is_contract || item.created_contract?.hash),
        toName: item.to?.name ?? null,
        valueEth: parseEth(item.value),
        status: mapStatus(item),
      });
      if (txs.length >= maxItems) {
        break;
      }
    }

    pages += 1;
    const next = page.next_page_params;
    if (!next) {
      break;
    }
    pageParams = toQueryParams(next);
  }

  return txs;
}
