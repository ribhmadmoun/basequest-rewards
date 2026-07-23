import { sdk } from "@farcaster/miniapp-sdk";
import { BASE_APP_CLIENT_FID } from "@/lib/miniapp/constants";

export type AppEnvironment = {
  isMiniApp: boolean;
  isBaseApp: boolean;
  isFarcasterClient: boolean;
  clientFid: number | null;
};

const BROWSER_ENVIRONMENT: AppEnvironment = {
  isMiniApp: false,
  isBaseApp: false,
  isFarcasterClient: false,
  clientFid: null,
};

/**
 * Detects whether the app is running inside a Farcaster Mini App host
 * (including Base App) using the official Mini App SDK.
 */
export async function detectAppEnvironment(): Promise<AppEnvironment> {
  if (typeof window === "undefined") {
    return BROWSER_ENVIRONMENT;
  }

  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      return BROWSER_ENVIRONMENT;
    }

    const context = await sdk.context;
    const clientFid = context?.client?.clientFid ?? null;
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
