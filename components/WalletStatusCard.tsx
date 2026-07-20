"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useAccount, useDisconnect } from "wagmi";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getButtonClassName(isPrimary: boolean) {
  return `rounded-card border px-4 py-2.5 text-sm font-semibold transition-opacity ${
    isPrimary
      ? "border-glass-border bg-base-blue text-text-primary hover:opacity-90"
      : "border-glass-border bg-glass-bg text-text-secondary hover:opacity-90"
  }`;
}

export default function WalletStatusCard() {
  const { address, status } = useAccount();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  const isConnected = status === "connected";

  return (
    <article className="rounded-card border border-glass-border bg-glass-bg p-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Connection Status
          </p>
          <p className="mt-2 font-sans text-lg font-semibold text-text-primary">
            {isConnected ? "Connected" : "Disconnected"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Wallet Address
          </p>
          <p className="mt-2 font-sans text-lg font-semibold text-text-primary">
            {isConnected && address ? shortenAddress(address) : "—"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Network
          </p>
          <p className="mt-2 font-sans text-lg font-semibold text-text-primary">
            Base
          </p>
        </div>
      </div>

      <div className="mt-5 sm:mt-6">
        {isConnected ? (
          <button
            type="button"
            disabled={isDisconnecting}
            onClick={() => disconnect()}
            className={`${getButtonClassName(false)} w-full sm:w-auto sm:min-w-[140px]`}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : (
          <ConnectWalletButton
            connectLabel="Connect"
            connectingLabel="Connecting..."
            buttonClassName={getButtonClassName(true)}
            disabledClassName={getButtonClassName(false)}
            className="w-full sm:w-auto sm:min-w-[140px]"
          />
        )}
      </div>
    </article>
  );
}
