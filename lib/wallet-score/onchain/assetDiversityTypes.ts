import type { Address } from "viem";

export type AssetDiversityResult = {
  /** Non-dust, non-spam ERC-20 count on Base. */
  uniqueTokens: number | null;
  tokensScanned: number;
  tokensCounted: number;
  source: "blockscout" | "alchemy" | "unavailable";
  error?: string;
};

/** Minimum USD notional to count as non-dust when a price is available. */
export const NON_DUST_USD_MIN = 0.5;

/** Minimum human-unit balance when no USD price is available. */
export const NON_DUST_UNITS_MIN = 0.01;

/** Ignore ultra-low-holder spam / airdrop dust. */
export const MIN_TOKEN_HOLDERS = 75;
