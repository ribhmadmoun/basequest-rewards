import { fetchWalletAnalytics } from "@/lib/wallet-score/analytics";
import { createUnavailableAnalytics } from "@/lib/wallet-score/analytics/fetchWalletAnalytics";
import { userMessageForFailure } from "@/lib/wallet-score/errors";
import { isAddressLike } from "@/lib/wallet-score/formatters";
import { NextResponse } from "next/server";
import type { Address } from "viem";

/**
 * Unified Base wallet analytics — resilient single source for dashboard widgets.
 * Never throws an unhandled 500 for provider outages.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address || !isAddressLike(address)) {
      return NextResponse.json(
        {
          error: userMessageForFailure("invalid"),
          code: "invalid_wallet",
        },
        { status: 400 },
      );
    }

    const analytics = await fetchWalletAnalytics(address as Address);

    return NextResponse.json(analytics, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
      },
    });
  } catch {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const fallbackAddress = (
      address && isAddressLike(address) ? address : "0x0000000000000000000000000000000000000000"
    ) as Address;

    return NextResponse.json(
      createUnavailableAnalytics(
        fallbackAddress,
        userMessageForFailure("server"),
      ),
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=15",
        },
      },
    );
  }
}
