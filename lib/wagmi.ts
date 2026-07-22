import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import {
  injected,
  coinbaseWallet,
  walletConnect,
} from "wagmi/connectors";

export const wagmiConfig = createConfig({
  ssr: true,

  multiInjectedProviderDiscovery: true,

  chains: [base],

  connectors: [
    injected(),

    coinbaseWallet({
      appName: "BaseQuest Rewards",
    }),

    walletConnect({
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      showQrModal: true,
    }),
  ],

  transports: {
    [base.id]: http(),
  },
});