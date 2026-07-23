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

const BASE_APP_ENVIRONMENT: AppEnvironment = {
  isMiniApp: true,
  isBaseApp: true,
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
 * EIP-1193 provider and user-agent signals.
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
 *
 * Farcaster is only reported when the host exposes wallet.getEthereumProvider.
 * The Farcaster SDK module is loaded only after Base App injected detection fails,
 * so Base App never evaluates that bridge during boot.
 */
export async function detectAppEnvironment(): Promise<AppEnvironment> {
  if (typeof window === "undefined") {
    return BROWSER_ENVIRONMENT;
  }

  // Give the injected provider a brief chance to appear after WebView boot.
  if (!detectBaseAppFromInjectedProvider()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (detectBaseAppFromInjectedProvider()) {
    return BASE_APP_ENVIRONMENT;
  }

  // Lazy-load SDK only when we are not clearly in Base App.
  const { sdk } = await import("@farcaster/miniapp-sdk");

  try {
    const isMiniApp = await withTimeout(sdk.isInMiniApp(), 1000);
    if (!isMiniApp) {
      return detectBaseAppFromInjectedProvider()
        ? BASE_APP_ENVIRONMENT
        : BROWSER_ENVIRONMENT;
    }

    if (detectBaseAppFromInjectedProvider()) {
      return BASE_APP_ENVIRONMENT;
    }

    const context = await withTimeout(sdk.context, 1000);
    const clientFid = context?.client?.clientFid ?? null;
    const isBaseAppByFid = clientFid === BASE_APP_CLIENT_FID;

    const capabilities = await withTimeout(sdk.getCapabilities(), 750);
    const farcasterWalletAvailable =
      capabilities?.includes("wallet.getEthereumProvider") ?? false;

    // Only a real Farcaster wallet host may use farcasterMiniApp.
    if (!isBaseAppByFid && farcasterWalletAvailable) {
      return {
        isMiniApp: true,
        isBaseApp: false,
        isFarcasterClient: true,
        clientFid,
      };
    }

    // Mini App without Farcaster eth provider → Base App style host.
    return {
      isMiniApp: true,
      isBaseApp: true,
      isFarcasterClient: false,
      clientFid: isBaseAppByFid ? clientFid : null,
    };
  } catch {
    return detectBaseAppFromInjectedProvider()
      ? BASE_APP_ENVIRONMENT
      : BROWSER_ENVIRONMENT;
  }
}
