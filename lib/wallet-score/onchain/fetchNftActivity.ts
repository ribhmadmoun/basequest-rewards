import { fetchAlchemyNftHoldings } from "@/lib/wallet-score/onchain/fetchAlchemyNfts";
import { fetchBlockscoutNftHoldings } from "@/lib/wallet-score/onchain/fetchBlockscoutNfts";
import type { NftActivityResult } from "@/lib/wallet-score/onchain/nftActivityTypes";
import type { Address } from "viem";

/**
 * NFT Activity for Wallet Score:
 * 1) Blockscout NFT endpoint (collections / instances)
 * 2) Alchemy NFT API when Blockscout fails or is incomplete
 * Returns owned NFT count + distinct collections (spam filtered).
 */
export async function fetchNftActivity(
  address: Address,
): Promise<NftActivityResult> {
  let blockscoutError: string | undefined;
  let blockscoutIncomplete = false;
  let blockscoutResult: {
    nftCount: number;
    collectionCount: number;
  } | null = null;

  try {
    const holdings = await fetchBlockscoutNftHoldings(address);
    blockscoutResult = {
      nftCount: holdings.nftCount,
      collectionCount: holdings.collectionCount,
    };
    blockscoutIncomplete = holdings.incomplete;

    // Complete Blockscout response → use it directly.
    if (!holdings.incomplete) {
      return {
        nftCount: holdings.nftCount,
        collectionCount: holdings.collectionCount,
        source: "blockscout",
      };
    }
  } catch (error) {
    blockscoutError =
      error instanceof Error ? error.message : "Blockscout NFT failed";
  }

  try {
    const holdings = await fetchAlchemyNftHoldings(address);

    // Prefer Alchemy when Blockscout failed or was truncated, unless Alchemy
    // returns a clearly weaker empty result while Blockscout had data.
    if (
      blockscoutResult &&
      holdings.nftCount === 0 &&
      blockscoutResult.nftCount > 0 &&
      !blockscoutError
    ) {
      return {
        nftCount: blockscoutResult.nftCount,
        collectionCount: blockscoutResult.collectionCount,
        source: "blockscout",
        error: blockscoutIncomplete
          ? "Blockscout pagination truncated; Alchemy returned empty — kept Blockscout"
          : undefined,
      };
    }

    return {
      nftCount: holdings.nftCount,
      collectionCount: holdings.collectionCount,
      source: "alchemy",
      error: blockscoutError
        ? `Blockscout failed (${blockscoutError}); used Alchemy fallback`
        : blockscoutIncomplete
          ? "Blockscout incomplete; used Alchemy fallback"
          : undefined,
    };
  } catch (error) {
    const alchemyError =
      error instanceof Error ? error.message : "Alchemy NFT fallback failed";

    if (blockscoutResult) {
      return {
        nftCount: blockscoutResult.nftCount,
        collectionCount: blockscoutResult.collectionCount,
        source: "blockscout",
        error: `Alchemy fallback failed (${alchemyError}); kept Blockscout${
          blockscoutIncomplete ? " (incomplete)" : ""
        }`,
      };
    }

    return {
      nftCount: null,
      collectionCount: null,
      source: "unavailable",
      error: blockscoutError
        ? `${blockscoutError}; fallback: ${alchemyError}`
        : alchemyError,
    };
  }
}
