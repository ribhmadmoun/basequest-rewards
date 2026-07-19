"use client";

import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useState } from "react";

type ConnectWalletButtonProps = {
  connectLabel?: string;
  connectingLabel?: string;
  completedLabel?: string;
  buttonClassName: string;
  disabledClassName: string;
  questCompleted?: boolean;
  onWalletConnected?: () => void;
  className?: string;
};

export default function ConnectWalletButton({
  connectLabel = "Connect Wallet",
  connectingLabel = "Connecting...",
  completedLabel,
  buttonClassName,
  disabledClassName,
  questCompleted = false,
  onWalletConnected,
  className = "",
}: ConnectWalletButtonProps) {
  const [userConnected, setUserConnected] = useState(false);
  const [userConnecting, setUserConnecting] = useState(false);

  return (
    <ConnectWallet
      disconnectedLabel={connectLabel}
      onConnect={() => {
        setUserConnected(true);
        onWalletConnected?.();
      }}
      render={({ onClick, status: walletStatus, isLoading }) => {
        const showCompleted =
          completedLabel !== undefined &&
          (questCompleted || (userConnected && walletStatus === "connected"));

        if (showCompleted) {
          return (
            <button
              type="button"
              disabled
              className={`${disabledClassName} ${className}`.trim()}
            >
              {completedLabel}
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
            className={`${isBusy ? disabledClassName : buttonClassName} ${className}`.trim()}
          >
            {isBusy ? connectingLabel : connectLabel}
          </button>
        );
      }}
    />
  );
}
