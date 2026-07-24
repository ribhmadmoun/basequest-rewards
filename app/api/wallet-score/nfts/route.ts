import { fetchNftActivity } from "@/lib/wallet-score/onchain/fetchNftActivity";
import { isAddressLike } from "@/lib/wallet-score/formatters";
import { NextResponse } from "next/server";

/**
 * NFT Activity for Wallet Score — owned NFTs + collections on Base.
 * Blockscout first, Alchemy NFT API fallback.
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

  const result = await fetchNftActivity(address);

  return NextResponse.json({
    address,
    ...result,
  });
}
