import type { Address } from "viem";

export type NftActivityResult = {
  /** Total NFT items owned on Base (ERC-721 + ERC-1155 quantity). */
  nftCount: number | null;
  /** Distinct NFT collections/contracts. */
  collectionCount: number | null;
  source: "blockscout" | "alchemy" | "unavailable";
  error?: string;
};

export type NftHoldingSummary = {
  nftCount: number;
  collectionCount: number;
};
