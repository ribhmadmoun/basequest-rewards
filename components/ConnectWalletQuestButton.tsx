"use client";

import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useState } from "react";

type ConnectWalletQuestButtonProps = {
  ctaLabel: string;
  buttonClassName: string;
  disabledClassName: string;
  questCompleted?: boolean;
  onWalletConnected?: () => void;
};

export default function ConnectWalletQuestButton({
  ctaLabel,
  buttonClassName,
  disabledClassName,
  questCompleted = false,
  onWalletConnected,
}: ConnectWalletQuestButtonProps) {
  const [userConnected, setUserConnected] = useState(false);
  const [userConnecting, setUserConnecting] = useState(false);

  return (
    <ConnectWallet
      disconnectedLabel="Connect Wallet"
      onConnect={() => {
        setUserConnected(true);
        onWalletConnected?.();
      }}
      render={({ onClick, status: walletStatus, isLoading }) => {
        const showCompleted =
          questCompleted || (userConnected && walletStatus === "connected");

        if (showCompleted) {
          return (
            <button
              type="button"
              disabled
              className={disabledClassName}
            >
              {ctaLabel}
            </button>
          );
        }

        const isBusy = userConnecting && isLoading;

        return (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setUserConnecting(true);
              onClick();
            }}
            className={isBusy ? disabledClassName : buttonClassName}
          >
            {isBusy ? "Connecting..." : "Connect Wallet"}
          </button>
        );
      }}
    />
  );
}
