import { fetchWalletActivity } from "@/lib/wallet-score/onchain/fetchWalletActivity";
import { isAddressLike } from "@/lib/wallet-score/formatters";
import { NextResponse } from "next/server";

/**
 * Base activity metrics for Wallet Score P0:
 * - activeDays (distinct days, last 12 months)
 * - contractInteractions (unique smart contracts)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !isAddressLike(address)) {
    return NextResponse.json(
      { error: "Valid wallet address required" },
      { status: 400 },
    );
  }

  const activity = await fetchWalletActivity(address);

  return NextResponse.json({
    address,
    ...activity,
  });
}
