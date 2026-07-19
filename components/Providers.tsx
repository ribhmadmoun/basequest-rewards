"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      miniKit={{ enabled: true }}
      config={{
        appearance: {
          name: "BaseQuest Rewards",
          mode: "auto",
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
