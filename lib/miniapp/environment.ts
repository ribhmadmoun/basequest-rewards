import { sdk } from "@farcaster/miniapp-sdk";
import { BASE_APP_CLIENT_FID } from "@/lib/miniapp/constants";

export type AppEnvironment = {
  isMiniApp: boolean;
  isBaseApp: boolean;
  isFarcasterClient: boolean;
  hasMiniAppWallet: boolean;
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
  hasMiniAppWallet: false,
  clientFid: null,
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
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
    return provider.providers.find((item) => item.isCoinbaseBrowser) ?? provider;
  }

  return provider;
}

/**
 * Detects the Base App / Coinbase Wallet in-app browser.
 * Base App still hosts Mini Apps, but wallet access uses Base/Coinbase connectors
 * rather than the Farcaster eth provider bridge.
 */
export function detectBaseAppBrowser(): boolean {
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

async function hasMiniAppEthereumWallet(): Promise<boolean> {
  try {
    const capabilities = await withTimeout(sdk.getCapabilities(), 750);
    if (!capabilities) {
      return false;
    }

    return capabilities.includes("wallet.getEthereumProvider");
  } catch {
    return false;
  }
}

/**
 * Detects whether the app is running inside a Farcaster Mini App host
 * (including Base App) using the official Mini App SDK + Base App signals.
 */
export async function detectAppEnvironment(): Promise<AppEnvironment> {
  if (typeof window === "undefined") {
    return BROWSER_ENVIRONMENT;
  }

  const isBaseAppBrowser = detectBaseAppBrowser();

  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      if (!isBaseAppBrowser) {
        return BROWSER_ENVIRONMENT;
      }

      // Base App in-app browser still counts as a Base Mini App host.
      return {
        isMiniApp: true,
        isBaseApp: true,
        isFarcasterClient: false,
        hasMiniAppWallet: false,
        clientFid: null,
      };
    }

    const context = await withTimeout(sdk.context, 1000);
    const clientFid = context?.client?.clientFid ?? null;
    const isBaseAppByFid = clientFid === BASE_APP_CLIENT_FID;
    const isBaseApp = isBaseAppByFid || isBaseAppBrowser;
    const hasMiniAppWallet = isBaseApp
      ? false
      : await hasMiniAppEthereumWallet();

    return {
      isMiniApp: true,
      isBaseApp,
      isFarcasterClient: !isBaseApp,
      hasMiniAppWallet,
      clientFid,
    };
  } catch {
    if (isBaseAppBrowser) {
      return {
        isMiniApp: true,
        isBaseApp: true,
        isFarcasterClient: false,
        hasMiniAppWallet: false,
        clientFid: null,
      };
    }

    return BROWSER_ENVIRONMENT;
  }
}
