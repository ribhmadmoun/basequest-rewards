import type { AnalyticsNftItem } from "@/lib/wallet-score/analytics/types";
import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2 } from "@/lib/wallet-score/constants";
import { isSpamNftCollection } from "@/lib/wallet-score/onchain/nftFilters";
import type { Address } from "viem";

const NFT_ACCENTS = [
  "from-base-blue via-[#3b6cff] to-amber-400",
  "from-amber-300 via-amber-500 to-base-blue",
  "from-violet-400 via-base-blue to-sky-400",
  "from-sky-300 via-violet-400 to-amber-300",
  "from-indigo-400 via-cyan-400 to-base-blue",
  "from-emerald-400 via-base-blue to-violet-400",
] as const;

type BlockscoutTokenRef = {
  address?: string;
  address_hash?: string;
  name?: string | null;
  symbol?: string | null;
  holders?: string | number | null;
  holders_count?: string | number | null;
};

type BlockscoutNftInstance = {
  id?: string | null;
  token?: BlockscoutTokenRef;
  image_url?: string | null;
  metadata?: { name?: string | null } | null;
};

type BlockscoutPage = {
  items?: BlockscoutNftInstance[];
  next_page_params?: Record<string, string | number> | null;
};

function tokenAddress(token: BlockscoutTokenRef | undefined): string | null {
  const raw = token?.address_hash || token?.address || "";
  const normalized = raw.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(normalized) ? normalized : null;
}

/**
 * Sample NFT instances for the Collectibles gallery (live Blockscout).
 */
export async function fetchNftGalleryItems(
  address: Address,
  limit = 8,
): Promise<AnalyticsNftItem[]> {
  const url = new URL(`${BLOCKSCOUT_BASE_API_V2}/addresses/${address}/nft`);
  url.searchParams.set("type", "ERC-721,ERC-1155");

  const page = await cachedJsonGet<BlockscoutPage>(url.toString(), {
    errorPrefix: "Blockscout NFT gallery HTTP",
    revalidateSeconds: 60,
  });
  const items: AnalyticsNftItem[] = [];

  for (const [index, item] of (page.items ?? []).entries()) {
    const contract = tokenAddress(item.token);
    if (!contract) {
      continue;
    }

    const collection = (item.token?.name || item.token?.symbol || "Collection").trim();
    const holdersRaw = item.token?.holders_count ?? item.token?.holders;
    const holders =
      holdersRaw === null || holdersRaw === undefined || holdersRaw === ""
        ? null
        : Number(holdersRaw);

    if (
      isSpamNftCollection({
        contractAddress: contract,
        name: collection,
        symbol: item.token?.symbol ?? null,
        amount: 1,
        holders: Number.isFinite(holders) ? holders : null,
      })
    ) {
      continue;
    }

    const tokenId = String(item.id ?? index);
    const name =
      item.metadata?.name?.trim() ||
      `${collection} #${tokenId.length > 8 ? `${tokenId.slice(0, 6)}…` : tokenId}`;

    items.push({
      id: `${contract}-${tokenId}`,
      name,
      collection,
      tokenId,
      contractAddress: contract,
      accent: NFT_ACCENTS[index % NFT_ACCENTS.length],
    });

    if (items.length >= limit) {
      break;
    }
  }

  return items;
}
