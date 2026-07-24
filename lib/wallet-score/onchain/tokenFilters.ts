import {
  MIN_TOKEN_HOLDERS,
  NON_DUST_UNITS_MIN,
  NON_DUST_USD_MIN,
} from "@/lib/wallet-score/onchain/assetDiversityTypes";

export type NormalizedTokenHolding = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  /** Raw integer balance as string. */
  rawBalance: string;
  exchangeRateUsd: number | null;
  holders: number | null;
};

const SPAM_NAME_RE =
  /https?:\/\/|www\.|\.com|\.xyz|\.io|claim|airdrop|reward|visit|http/i;

function parsePositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function humanBalance(rawBalance: string, decimals: number): number {
  if (!/^\d+$/.test(rawBalance)) {
    return 0;
  }
  if (decimals <= 0) {
    return Number(rawBalance) || 0;
  }

  const padded = rawBalance.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals);
  return Number(`${whole}.${fraction}`) || 0;
}

/**
 * Deterministic non-dust / non-spam filter for Asset Diversity.
 * Prefers USD notional when an exchange rate exists.
 */
export function isCountableErc20(token: NormalizedTokenHolding): boolean {
  if (!token.address || !/^0x[a-fA-F0-9]{40}$/.test(token.address)) {
    return false;
  }

  if (!token.symbol?.trim() || !token.name?.trim()) {
    return false;
  }

  if (SPAM_NAME_RE.test(token.name) || SPAM_NAME_RE.test(token.symbol)) {
    return false;
  }

  if (token.rawBalance === "0" || !token.rawBalance) {
    return false;
  }

  const units = humanBalance(token.rawBalance, token.decimals);
  if (!Number.isFinite(units) || units <= 0) {
    return false;
  }

  if (token.holders !== null && token.holders < MIN_TOKEN_HOLDERS) {
    return false;
  }

  if (token.exchangeRateUsd !== null && token.exchangeRateUsd > 0) {
    const usd = units * token.exchangeRateUsd;
    return usd >= NON_DUST_USD_MIN;
  }

  // No market price → stricter unit floor (filters most spam airdrops).
  return units >= NON_DUST_UNITS_MIN;
}

export function countFilteredTokens(tokens: NormalizedTokenHolding[]): {
  scanned: number;
  counted: number;
} {
  let counted = 0;
  for (const token of tokens) {
    if (isCountableErc20(token)) {
      counted += 1;
    }
  }
  return { scanned: tokens.length, counted };
}

export function parseHolders(value: unknown): number | null {
  return parsePositiveNumber(value);
}

export function parseExchangeRate(value: unknown): number | null {
  const n = parsePositiveNumber(value);
  return n !== null && n > 0 ? n : null;
}

export function parseDecimals(value: unknown): number {
  const n = parsePositiveNumber(value);
  if (n === null) {
    return 18;
  }
  return Math.min(36, Math.floor(n));
}
