import { fetchAssetDiversity } from "@/lib/wallet-score/onchain/fetchAssetDiversity";
import { isAddressLike } from "@/lib/wallet-score/formatters";
import { NextResponse } from "next/server";

/**
 * Asset Diversity for Wallet Score — non-dust ERC-20 count on Base.
 * Blockscout first, Alchemy fallback.
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

  const result = await fetchAssetDiversity(address);

  return NextResponse.json({
    address,
    ...result,
  });
}
