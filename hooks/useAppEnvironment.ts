"use client";

import {
  detectAppEnvironment,
  type AppEnvironment,
} from "@/lib/miniapp/environment";
import { useEffect, useState } from "react";

const BROWSER_ENVIRONMENT: AppEnvironment = {
  isMiniApp: false,
  isBaseApp: false,
  isFarcasterClient: false,
  clientFid: null,
};

export function useAppEnvironment() {
  const [environment, setEnvironment] =
    useState<AppEnvironment>(BROWSER_ENVIRONMENT);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEnvironment() {
      const next = await detectAppEnvironment();
      if (cancelled) {
        return;
      }

      setEnvironment(next);
      setIsReady(true);
    }

    void loadEnvironment();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    environment,
    isReady,
    isMiniApp: environment.isMiniApp,
    isBaseApp: environment.isBaseApp,
    isFarcasterClient: environment.isFarcasterClient,
  };
}
