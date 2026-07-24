import type { NftHoldingSummary } from "@/lib/wallet-score/onchain/nftActivityTypes";

export type NftCollectionCandidate = {
  contractAddress: string;
  name?: string | null;
  symbol?: string | null;
  /** Number of NFTs from this collection toward the total. */
  amount: number;
  holders?: number | null;
};

const SPAM_NAME_RE =
  /https?:\/\/|www\.|\.com|\.xyz|\.io|\.app|claim|airdrop|reward|visit|free\s*mint|http/i;

/** Ignore ultra-thin spam collections when holder count is known. */
export const MIN_NFT_COLLECTION_HOLDERS = 25;

export function isSpamNftCollection(collection: NftCollectionCandidate): boolean {
  const name = (collection.name ?? "").trim();
  const symbol = (collection.symbol ?? "").trim();

  if (!collection.contractAddress || !/^0x[a-f0-9]{40}$/.test(collection.contractAddress)) {
    return true;
  }

  if (collection.amount <= 0) {
    return true;
  }

  // Nameless + symbol-less contracts are usually spam/airdrops.
  if (!name && !symbol) {
    return true;
  }

  if (SPAM_NAME_RE.test(name) || SPAM_NAME_RE.test(symbol)) {
    return true;
  }

  if (
    collection.holders !== null &&
    collection.holders !== undefined &&
    collection.holders < MIN_NFT_COLLECTION_HOLDERS
  ) {
    return true;
  }

  return false;
}

export function summarizeNftCollections(
  collections: NftCollectionCandidate[],
): NftHoldingSummary {
  let nftCount = 0;
  const unique = new Set<string>();

  for (const collection of collections) {
    if (isSpamNftCollection(collection)) {
      continue;
    }
    unique.add(collection.contractAddress);
    nftCount += Math.max(0, Math.floor(collection.amount));
  }

  return {
    nftCount,
    collectionCount: unique.size,
  };
}
