import { fetchWalletHistory } from "@/lib/wallet-score/onchain/fetchWalletHistory";
import { isAddressLike } from "@/lib/wallet-score/formatters";
import { NextResponse } from "next/server";

/**
 * Wallet history endpoint — wallet age from first Base tx (Blockscout API V2).
 * Designed so later score metrics can share this route or adjacent handlers.
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

  const history = await fetchWalletHistory(address);

  return NextResponse.json(
    {
      address,
      ...history,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
      },
    },
  );
}
