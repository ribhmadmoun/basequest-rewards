"use client";

import { useAppEnvironment } from "@/hooks/useAppEnvironment";
import {
  detectAppEnvironment,
  detectBaseAppFromInjectedProvider,
} from "@/lib/miniapp/environment";
import { getPreferredConnector } from "@/lib/wallet/getPreferredConnector";
import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";

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
  const account = useAccount();
  const { isConnected } = account;
  const { connect, connectors, isPending } = useConnect();
  const { environment, isReady } = useAppEnvironment();

  // TEMP DEBUG — remove after Base App wallet restore investigation
  useEffect(() => {
    const connectorList = connectors.map((c) => ({ id: c.id, name: c.name }));

    console.log("[ConnectWalletButton wallet debug]", {
      connectors: connectorList,
      accountStatus: account.status,
      accountConnectorId: account.connector?.id,
      accountConnectorName: account.connector?.name,
    });

    if (detectBaseAppFromInjectedProvider() || environment.isBaseApp) {
      console.log("[ConnectWalletButton Base App restore]", {
        restoredConnectorId: account.connector?.id,
        restoredConnectorName: account.connector?.name,
        accountStatus: account.status,
      });
    }
  }, [
    connectors,
    account.status,
    account.connector?.id,
    account.connector?.name,
    environment.isBaseApp,
  ]);

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

  const handleConnect = async () => {
    const resolvedEnvironment = isReady
      ? environment
      : await detectAppEnvironment();

    const connector = getPreferredConnector(connectors, resolvedEnvironment);

    if (!connector) {
      console.error("No connector found");
      return;
    }

    connect({ connector });
  };

  const disabled = isPending || isConnected;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        void handleConnect();
      }}
      className={`${
        disabled ? disabledClassName : buttonClassName
      } ${className}`.trim()}
    >
      {isPending ? connectingLabel : connectLabel}
    </button>
  );
}
