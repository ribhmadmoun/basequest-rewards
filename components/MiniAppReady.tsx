"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";

/**
 * Hides the Mini App splash screen once the UI is ready.
 * Uses the official Farcaster Mini App SDK (`sdk.actions.ready()`).
 */
export default function MiniAppReady() {
  useEffect(() => {
    let cancelled = false;

    async function signalReady() {
      try {
        const isMiniApp = await sdk.isInMiniApp();
        if (cancelled || !isMiniApp) {
          return;
        }

        await sdk.actions.ready();
      } catch (error) {
        console.error("Mini App ready failed", error);
      }
    }

    void signalReady();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
