"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";

export default function MiniAppReady() {
  const { setMiniAppReady } = useMiniKit();

  useEffect(() => {
    void setMiniAppReady();
  }, [setMiniAppReady]);

  return null;
}
