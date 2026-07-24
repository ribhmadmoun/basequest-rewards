import type { Address } from "viem";
import { formatUnits } from "viem";

export function getAvatarLabel(address?: string | null) {
  if (!address || address.length < 4) {
    return "—";
  }

  return address.slice(2, 4).toUpperCase();
}

export function formatTokenAmount(
  value: bigint | undefined,
  decimals: number,
  maxFractionDigits = 4,
): string | null {
  if (value === undefined) {
    return null;
  }

  const asNumber = Number(formatUnits(value, decimals));
  if (!Number.isFinite(asNumber)) {
    return formatUnits(value, decimals);
  }

  return asNumber.toLocaleString(undefined, {
    maximumFractionDigits: maxFractionDigits,
  });
}

export function formatTransactionCount(count: number | null | undefined) {
  if (count === null || count === undefined) {
    return null;
  }

  return count.toLocaleString();
}

export function formatWalletAgeDays(days: number | null | undefined) {
  if (days === null || days === undefined) {
    return null;
  }

  return `${days.toLocaleString()}d`;
}

export function daysSinceTimestamp(isoOrUnixSeconds: string | number) {
  const ms =
    typeof isoOrUnixSeconds === "number"
      ? isoOrUnixSeconds * 1000
      : Number.isFinite(Number(isoOrUnixSeconds)) &&
          String(isoOrUnixSeconds).length <= 10
        ? Number(isoOrUnixSeconds) * 1000
        : Date.parse(isoOrUnixSeconds);

  if (!Number.isFinite(ms)) {
    return null;
  }

  const diffMs = Date.now() - ms;
  if (diffMs < 0) {
    return 0;
  }

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isAddressLike(value: string): value is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}
