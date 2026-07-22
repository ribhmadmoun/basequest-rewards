import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import {
  injected,
  coinbaseWallet,
  walletConnect,
} from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

export const wagmiConfig = createConfig({
  ssr: true,

  multiInjectedProviderDiscovery: true,

  chains: [base],

  connectors: [
    // Farcaster Mini App connector
    farcasterMiniApp(),

    // Browser wallets (MetaMask etc.)
    injected(),

    // Coinbase Wallet / Base Wallet
    coinbaseWallet({
      appName: "BaseQuest Rewards",
    }),

    // WalletConnect fallback
    walletConnect({
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      showQrModal: true,
    }),
  ],

  transports: {
    [base.id]: http(),
  },
});