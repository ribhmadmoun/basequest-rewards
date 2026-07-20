"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import { formatWalletAddress, ui } from "@/lib/ui-styles";
import { useAccount, useDisconnect } from "wagmi";

export default function WalletStatusCard() {
  const { address, status } = useAccount();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  const isConnected = status === "connected";

  return (
    <article className={`${ui.glassCardInteractive} p-5 sm:p-6`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <div>
          <p className={ui.statLabel}>Connection Status</p>
          <p className="mt-2 font-sans text-lg font-semibold text-text-primary">
            {isConnected ? "Connected" : "Disconnected"}
          </p>
        </div>

        <div>
          <p className={ui.statLabel}>Wallet Address</p>
          <p
            className="mt-2 truncate font-mono text-base font-semibold tracking-wide text-text-primary sm:text-lg"
            title={address ?? undefined}
          >
            {isConnected && address ? formatWalletAddress(address) : "—"}
          </p>
        </div>

        <div>
          <p className={ui.statLabel}>Network</p>
          <p className="mt-2 font-sans text-lg font-semibold text-text-primary">
            Base
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-glass-border pt-5 sm:mt-6">
        {isConnected ? (
          <button
            type="button"
            disabled={isDisconnecting}
            onClick={() => disconnect()}
            className={`${ui.secondaryButton} w-full sm:w-auto sm:min-w-[140px]`}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : (
          <ConnectWalletButton
            connectLabel="Connect"
            connectingLabel="Connecting..."
            buttonClassName={`${ui.primaryButton} w-full sm:w-auto sm:min-w-[140px]`}
            disabledClassName={`${ui.secondaryButton} w-full sm:w-auto sm:min-w-[140px] opacity-70`}
          />
        )}
      </div>
    </article>
  );
}
