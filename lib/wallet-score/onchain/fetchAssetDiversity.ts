import type { AssetDiversityResult } from "@/lib/wallet-score/onchain/assetDiversityTypes";
import { fetchAlchemyErc20Holdings } from "@/lib/wallet-score/onchain/fetchAlchemyTokens";
import { fetchBlockscoutErc20Holdings } from "@/lib/wallet-score/onchain/fetchBlockscoutTokens";
import { countFilteredTokens } from "@/lib/wallet-score/onchain/tokenFilters";
import type { Address } from "viem";

/**
 * Asset Diversity for Wallet Score:
 * 1) Blockscout ERC-20 holdings
 * 2) Alchemy token balances fallback (existing provider)
 * Filters dust + spam, returns unique countable tokens.
 */
export async function fetchAssetDiversity(
  address: Address,
): Promise<AssetDiversityResult> {
  let blockscoutError: string | undefined;

  try {
    const holdings = await fetchBlockscoutErc20Holdings(address);
    const { scanned, counted } = countFilteredTokens(holdings);
    return {
      uniqueTokens: counted,
      tokensScanned: scanned,
      tokensCounted: counted,
      source: "blockscout",
    };
  } catch (error) {
    blockscoutError =
      error instanceof Error ? error.message : "Blockscout tokens failed";
  }

  try {
    const holdings = await fetchAlchemyErc20Holdings(address);
    const { scanned, counted } = countFilteredTokens(holdings);
    return {
      uniqueTokens: counted,
      tokensScanned: scanned,
      tokensCounted: counted,
      source: "alchemy",
      error: blockscoutError
        ? `Blockscout failed (${blockscoutError}); used Alchemy fallback`
        : undefined,
    };
  } catch (error) {
    const alchemyError =
      error instanceof Error ? error.message : "Alchemy fallback failed";

    return {
      uniqueTokens: null,
      tokensScanned: 0,
      tokensCounted: 0,
      source: "unavailable",
      error: blockscoutError
        ? `${blockscoutError}; fallback: ${alchemyError}`
        : alchemyError,
    };
  }
}
