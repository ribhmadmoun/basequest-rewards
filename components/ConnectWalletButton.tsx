"use client";

import { useAccount, useConnect } from "wagmi";
import { useEffect } from "react";

type ConnectWalletButtonProps = {
  connectLabel?: string;
  connectingLabel?: string;
  completedLabel?: string;
  buttonClassName: string;
  disabledClassName: string;
  questCompleted?: boolean;
  className?: string;
};

export default function ConnectWalletButton({
  connectLabel = "Connect Wallet",
  connectingLabel = "Connecting...",
  completedLabel,
  buttonClassName,
  disabledClassName,
  questCompleted = false,
  className = "",
}: ConnectWalletButtonProps) {
  const { isConnected } = useAccount();

  const {
    connect,
    connectors,
    isPending,
  } = useConnect();

  useEffect(() => {
    console.log(
      "Available connectors:",
      connectors.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    );
  }, [connectors]);

  if (completedLabel && questCompleted) {
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

  const handleConnect = () => {
    const connector =
      connectors.find((c) => c.id === "injected") ??
      connectors.find((c) => c.id === "coinbaseWallet") ??
      connectors.find((c) => c.id === "walletConnect");

    if (!connector) {
      console.error("No connector found");
      return;
    }

    console.log("Connecting with:", connector.name);

    connect({
      connector,
    });
  };

  const disabled = isPending || isConnected;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleConnect}
      className={`${
        disabled ? disabledClassName : buttonClassName
      } ${className}`.trim()}
    >
      {isPending ? connectingLabel : connectLabel}
    </button>
  );
}