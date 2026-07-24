import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { resolveAlchemyBaseRpcUrl } from "@/lib/wallet-score/onchain/fetchAlchemyTokens";
import type { NftHoldingSummary } from "@/lib/wallet-score/onchain/nftActivityTypes";
import {
  summarizeNftCollections,
  type NftCollectionCandidate,
} from "@/lib/wallet-score/onchain/nftFilters";
import type { Address } from "viem";

function resolveAlchemyApiKey(): string | null {
  return (
    process.env.ALCHEMY_API_KEY ||
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ||
    null
  );
}

function resolveAlchemyNftBaseUrl(): string | null {
  const key = resolveAlchemyApiKey();
  if (key) {
    return `https://base-mainnet.g.alchemy.com/nft/v3/${key}`;
  }

  const rpc = resolveAlchemyBaseRpcUrl();
  if (!rpc) {
    return null;
  }

  const match = rpc.match(
    /^(https:\/\/[^/]+\.alchemy\.com)\/v2\/([^/?#]+)/i,
  );
  if (!match) {
    return null;
  }

  return `${match[1]}/nft/v3/${match[2]}`;
}

type AlchemyOwnedNft = {
  contract?: {
    address?: string;
    name?: string | null;
    symbol?: string | null;
    openSeaMetadata?: { collectionName?: string | null } | null;
  };
  name?: string | null;
  balance?: string | number;
  spamInfo?: { isSpam?: boolean | null } | null;
};

type AlchemyNftsResponse = {
  ownedNfts?: AlchemyOwnedNft[];
  totalCount?: number | string;
  pageKey?: string;
  error?: { message?: string };
};

/**
 * Existing NFT provider fallback — Alchemy NFT API getNFTsForOwner.
 */
export async function fetchAlchemyNftHoldings(
  address: Address,
): Promise<NftHoldingSummary> {
  const baseUrl = resolveAlchemyNftBaseUrl();
  if (!baseUrl) {
    throw new Error("Alchemy NFT fallback is not configured");
  }

  const byContract = new Map<string, NftCollectionCandidate>();
  let pageKey: string | undefined;
  let pages = 0;
  const maxPages = 20;

  while (pages < maxPages) {
    const url = new URL(`${baseUrl}/getNFTsForOwner`);
    url.searchParams.set("owner", address);
    url.searchParams.set("withMetadata", "true");
    url.searchParams.set("pageSize", "100");
    // Ask Alchemy to exclude spam when the API supports it.
    url.searchParams.set("excludeFilters[]", "SPAM");
    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const payload = await cachedJsonGet<AlchemyNftsResponse>(url.toString(), {
      errorPrefix: "Alchemy NFT HTTP",
      revalidateSeconds: 60,
    });
    if (payload.error?.message) {
      throw new Error(payload.error.message);
    }

    const owned = payload.ownedNfts ?? [];
    for (const nft of owned) {
      if (nft.spamInfo?.isSpam) {
        continue;
      }

      const contract = nft.contract?.address?.trim().toLowerCase();
      if (!contract || !/^0x[a-f0-9]{40}$/.test(contract)) {
        continue;
      }

      const balance = Number(nft.balance ?? 1);
      const amount =
        Number.isFinite(balance) && balance > 0 ? Math.floor(balance) : 1;

      const name =
        nft.contract?.openSeaMetadata?.collectionName ||
        nft.contract?.name ||
        nft.name ||
        null;
      const symbol = nft.contract?.symbol ?? null;

      const existing = byContract.get(contract);
      if (existing) {
        existing.amount += amount;
        if (!existing.name && name) {
          existing.name = name;
        }
        if (!existing.symbol && symbol) {
          existing.symbol = symbol;
        }
      } else {
        byContract.set(contract, {
          contractAddress: contract,
          name,
          symbol,
          amount,
          holders: null,
        });
      }
    }

    pages += 1;
    if (!payload.pageKey || owned.length === 0) {
      break;
    }
    pageKey = payload.pageKey;
  }

  return summarizeNftCollections([...byContract.values()]);
}
