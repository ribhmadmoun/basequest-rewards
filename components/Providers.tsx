"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  detectAppEnvironment,
  detectBaseAppFromInjectedProvider,
} from "@/lib/miniapp/environment";
import {
  createBaseAppWagmiConfig,
  createBrowserWagmiConfig,
  createWagmiConfig,
  resolveWalletHost,
  type WalletHost,
} from "@/lib/wagmi";
import { useEffect, useState } from "react";
import { useAccount, useConnect, WagmiProvider, type Config } from "wagmi";
import { base } from "wagmi/chains";

type ProvidersProps = {
  children: React.ReactNode;
};

type WalletSetup = {
  host: WalletHost;
  config: Config;
};

function getInitialHostAndConfig(): WalletSetup {
  if (typeof window !== "undefined" && detectBaseAppFromInjectedProvider()) {
    return {
      host: "baseApp",
      config: createBaseAppWagmiConfig(),
    };
  }

  return {
    host: "browser",
    config: createBrowserWagmiConfig(),
  };
}

/** TEMP DEBUG — remove after Base App wallet restore investigation */
function WalletDebugLogger({ host }: { host: WalletHost }) {
  const account = useAccount();
  const { connectors } = useConnect();

  useEffect(() => {
    const connectorList = connectors.map((c) => ({ id: c.id, name: c.name }));

    console.log("[Providers wallet debug]", {
      host,
      connectors: connectorList,
      accountStatus: account.status,
      accountConnectorId: account.connector?.id,
      accountConnectorName: account.connector?.name,
    });

    if (host === "baseApp" || detectBaseAppFromInjectedProvider()) {
      console.log("[Providers Base App restore]", {
        restoredConnectorId: account.connector?.id,
        restoredConnectorName: account.connector?.name,
        accountStatus: account.status,
      });
    }
  }, [
    host,
    connectors,
    account.status,
    account.connector?.id,
    account.connector?.name,
  ]);

  return null;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [{ host, config }, setWalletSetup] = useState(getInitialHostAndConfig);

  useEffect(() => {
    let cancelled = false;

    async function resolveHostConfig() {
      // Hard stop: Base App must never load/register farcasterMiniApp.
      if (detectBaseAppFromInjectedProvider()) {
        if (!cancelled) {
          setWalletSetup((current) =>
            current.host === "baseApp"
              ? current
              : {
                  host: "baseApp",
                  config: createBaseAppWagmiConfig(),
                },
          );
        }
        return;
      }

      const environment = await detectAppEnvironment();
      if (cancelled) {
        return;
      }

      // Re-check after async work — provider flags can appear late.
      if (detectBaseAppFromInjectedProvider() || environment.isBaseApp) {
        setWalletSetup((current) =>
          current.host === "baseApp"
            ? current
            : {
                host: "baseApp",
                config: createBaseAppWagmiConfig(),
              },
        );
        return;
      }

      const nextHost = resolveWalletHost(environment);
      const nextConfig = await createWagmiConfig(nextHost);
      if (cancelled) {
        return;
      }

      setWalletSetup((current) => {
        // Never leave Base App for Farcaster/browser after Base was confirmed.
        if (current.host === "baseApp") {
          return current;
        }

        if (current.host === nextHost) {
          return current;
        }

        return {
          host: nextHost,
          config: nextConfig,
        };
      });
    }

    void resolveHostConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WagmiProvider key={host} config={config} reconnectOnMount>
      <WalletDebugLogger host={host} />
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </WagmiProvider>
  );
}
