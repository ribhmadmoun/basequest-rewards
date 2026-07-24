import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2, USDC_BASE_ADDRESS } from "@/lib/wallet-score/constants";
import {
  humanBalance,
  isCountableErc20,
  type NormalizedTokenHolding,
} from "@/lib/wallet-score/onchain/tokenFilters";
import type { Address } from "viem";
import { formatUnits } from "viem";

export type NativeBalances = {
  ethBalance: string | null;
  ethUsd: number | null;
  usdcBalance: string | null;
};

type BlockscoutAddress = {
  coin_balance?: string | null;
  exchange_rate?: string | number | null;
};

function formatTokenDisplay(raw: string, decimals: number, maxFraction = 4): string {
  const units = humanBalance(raw, decimals);
  if (!Number.isFinite(units)) {
    return "0";
  }
  return units.toLocaleString(undefined, {
    maximumFractionDigits: maxFraction,
  });
}

/**
 * Native ETH (and USD if Blockscout provides rate) + USDC from holdings.
 */
export async function fetchNativeBalances(
  address: Address,
  tokens: NormalizedTokenHolding[],
): Promise<NativeBalances> {
  let ethBalance: string | null = null;
  let ethUsd: number | null = null;

  try {
    const data = await cachedJsonGet<BlockscoutAddress>(
      `${BLOCKSCOUT_BASE_API_V2}/addresses/${address}`,
      {
        errorPrefix: "Blockscout address HTTP",
        revalidateSeconds: 60,
      },
    );
    if (data.coin_balance) {
      const eth = Number(formatUnits(BigInt(data.coin_balance), 18));
      ethBalance = eth.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      });
      const rate = Number(data.exchange_rate);
      if (Number.isFinite(rate) && rate > 0 && Number.isFinite(eth)) {
        ethUsd = eth * rate;
      }
    }
  } catch {
    // leave null
  }

  const usdc = tokens.find(
    (token) => token.address === USDC_BASE_ADDRESS.toLowerCase(),
  );
  const usdcBalance = usdc
    ? formatTokenDisplay(usdc.rawBalance, usdc.decimals, 2)
    : null;

  return { ethBalance, ethUsd, usdcBalance };
}

export function filterCountableTokens(
  tokens: NormalizedTokenHolding[],
): NormalizedTokenHolding[] {
  return tokens.filter(isCountableErc20);
}
