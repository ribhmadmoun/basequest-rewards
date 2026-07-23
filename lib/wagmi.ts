import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import {
  baseAccount,
  coinbaseWallet,
  injected,
  walletConnect,
} from "wagmi/connectors";

export const wagmiConfig = createConfig({
  ssr: true,
  chains: [base],
  connectors: [
    // Official Farcaster Mini App connector (Farcaster clients).
    farcasterMiniApp(),
    // Official Base Account connector (Base App Mini App host).
    baseAccount({
      appName: "BaseQuest Rewards",
    }),
    // Standard browser wallets.
    injected(),
    coinbaseWallet({
      appName: "BaseQuest Rewards",
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      showQrModal: true,
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});
