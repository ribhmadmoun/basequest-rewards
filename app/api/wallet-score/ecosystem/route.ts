import { analyzeBaseEcosystem } from "@/lib/wallet-score/ecosystem";
import { isAddressLike } from "@/lib/wallet-score/formatters";
import { NextResponse } from "next/server";

/**
 * Base ecosystem usage for Wallet Score — unique protocols + interactions.
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

  const analysis = await analyzeBaseEcosystem({ address });

  return NextResponse.json({
    address,
    protocolsUsed: analysis.protocolsUsed,
    contractInteractions: analysis.contractInteractions,
    ecosystemScore: analysis.ecosystemScore,
    uniqueContracts: analysis.uniqueContracts,
    protocols: analysis.protocols,
    transactionsScanned: analysis.transactionsScanned,
    source: analysis.source,
    error: analysis.error,
  });
}
