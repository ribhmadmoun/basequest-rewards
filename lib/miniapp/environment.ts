import { sdk } from "@farcaster/miniapp-sdk";
import { BASE_APP_CLIENT_FID } from "@/lib/miniapp/constants";

export type AppEnvironment = {
  isMiniApp: boolean;
  isBaseApp: boolean;
  isFarcasterClient: boolean;
  clientFid: number | null;
};

type EthereumProviderFlags = {
  isCoinbaseBrowser?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: EthereumProviderFlags[];
};

const BROWSER_ENVIRONMENT: AppEnvironment = {
  isMiniApp: false,
  isBaseApp: false,
  isFarcasterClient: false,
  clientFid: null,
};

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  return Promise.race([
    promise.then((value) => value).catch(() => null),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

function readEthereumFlags(
  provider: EthereumProviderFlags | undefined,
): EthereumProviderFlags | undefined {
  if (!provider) {
    return undefined;
  }

  if (Array.isArray(provider.providers) && provider.providers.length > 0) {
    return (
      provider.providers.find((item) => item.isCoinbaseBrowser) ?? provider
    );
  }

  return provider;
}

/**
 * Detect Base App / Coinbase Wallet in-app browser from the injected
 * EIP-1193 provider and user-agent signals (not Farcaster clientFid alone).
 */
export function detectBaseAppFromInjectedProvider(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ethereum = readEthereumFlags(
    window.ethereum as EthereumProviderFlags | undefined,
  );

  if (ethereum?.isCoinbaseBrowser) {
    return true;
  }

  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /CoinbaseWallet|CBWallet/i.test(userAgent);
}

/**
 * Detects browser vs Farcaster Mini App vs Base App host.
 * Base App is identified primarily via injected EIP-1193 / Coinbase signals.
 */
export async function detectAppEnvironment(): Promise<AppEnvironment> {
  if (typeof window === "undefined") {
    return BROWSER_ENVIRONMENT;
  }

  // Prefer Base App injected-provider detection first so we never wait on
  // the Farcaster SDK bridge (which hangs in Base App post-April 2026).
  const isBaseAppBrowser = detectBaseAppFromInjectedProvider();
  if (isBaseAppBrowser) {
    return {
      isMiniApp: true,
      isBaseApp: true,
      isFarcasterClient: false,
      clientFid: null,
    };
  }

  try {
    const isMiniApp = await withTimeout(sdk.isInMiniApp(), 1000);
    if (!isMiniApp) {
      return BROWSER_ENVIRONMENT;
    }

    const context = await withTimeout(sdk.context, 1000);
    const clientFid = context?.client?.clientFid ?? null;

    // clientFid is a secondary signal only; injected provider already handled above.
    const isBaseApp = clientFid === BASE_APP_CLIENT_FID;

    return {
      isMiniApp: true,
      isBaseApp,
      isFarcasterClient: !isBaseApp,
      clientFid,
    };
  } catch {
    return BROWSER_ENVIRONMENT;
  }
}
