"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Link from "next/link";
import { useAccount } from "wagmi";

const navLinkClassName =
  "shrink-0 rounded-badge border border-glass-border bg-glass-bg px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-text-primary shadow-sm transition-opacity hover:opacity-90 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-widest lg:px-3 lg:py-1 lg:text-[0.65rem] lg:tracking-widest";

const walletButtonClassName =
  "rounded-badge border border-glass-border bg-base-blue px-1.5 py-1 text-[0.5rem] font-semibold uppercase tracking-wide text-text-primary shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-widest lg:px-4 lg:py-1.5 lg:text-[0.65rem] lg:tracking-widest";

const walletButtonDisabledClassName =
  "rounded-badge border border-glass-border bg-glass-bg px-1.5 py-1 text-[0.5rem] font-semibold uppercase tracking-wide text-text-muted opacity-70 whitespace-nowrap sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-widest lg:px-4 lg:py-1.5 lg:text-[0.65rem] lg:tracking-widest";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Header() {
  const { address, status } = useAccount();
  const isConnected = status === "connected";

  return (
    <header className="sticky top-0 z-10 w-full px-4 pt-5 pb-2 sm:px-6">
      <div className="mx-auto flex w-full max-w-lg items-center gap-1.5 rounded-card border border-glass-border bg-glass-bg px-3 py-3 shadow-lg shadow-black/10 backdrop-blur-xl sm:max-w-xl sm:gap-4 sm:px-6 sm:py-4 lg:grid lg:max-w-4xl lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-6 lg:px-6 lg:py-4">
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3 lg:min-w-0 lg:shrink-0">
          <div
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-card bg-base-blue shadow-md"
          >
            <span className="text-sm font-bold tracking-tight text-text-primary">
              BQ
            </span>
          </div>
          <span className="hidden truncate font-sans text-base font-bold tracking-tight text-text-primary sm:inline sm:text-lg lg:whitespace-nowrap">
            BaseQuest Rewards
          </span>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-hidden sm:gap-2 lg:col-start-2 lg:flex-none lg:justify-center lg:gap-3 lg:overflow-visible"
        >
          <Link href="/" className={navLinkClassName}>
            Dashboard
          </Link>
          <Link href="/leaderboard" className={navLinkClassName}>
            Leaderboard
          </Link>
          <Link href="/profile" className={navLinkClassName}>
            Profile
          </Link>
          <span className="hidden shrink-0 rounded-badge border border-glass-border bg-base-blue px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-text-primary shadow-sm sm:inline-flex">
            Base
          </span>
        </nav>

        <div className="flex shrink-0 items-center border-l border-glass-border pl-1.5 sm:pl-2 lg:col-start-3 lg:justify-self-end lg:border-l lg:pl-4">
          {isConnected && address ? (
            <span
              className="rounded-badge border border-glass-border bg-glass-bg px-2 py-1 font-mono text-[0.55rem] font-semibold text-text-primary whitespace-nowrap sm:px-3 sm:py-1 sm:text-[0.65rem] lg:px-3 lg:py-1.5 lg:text-[0.65rem]"
              title={address}
            >
              {shortenAddress(address)}
            </span>
          ) : (
            <ConnectWalletButton
              connectLabel="Connect Wallet"
              connectingLabel="Connecting..."
              buttonClassName={walletButtonClassName}
              disabledClassName={walletButtonDisabledClassName}
            />
          )}
        </div>
      </div>
    </header>
  );
}
