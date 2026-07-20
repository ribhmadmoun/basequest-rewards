"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
] as const;

const connectButtonClassName =
  "flex h-9 items-center rounded-badge border border-glass-border bg-base-blue px-2 text-[0.5rem] font-semibold uppercase tracking-tight text-text-primary shadow-sm transition-all hover:opacity-90 hover:shadow-md whitespace-nowrap lg:min-h-9 lg:px-2.5 lg:py-1 lg:text-[0.65rem] lg:tracking-wide";

const connectButtonDisabledClassName =
  "flex h-9 items-center rounded-badge border border-glass-border bg-glass-bg px-2 text-[0.5rem] font-semibold uppercase tracking-tight text-text-muted opacity-70 whitespace-nowrap lg:min-h-9 lg:px-2.5 lg:py-1 lg:text-[0.65rem] lg:tracking-wide";

function formatHeaderWalletAddress(address: string) {
  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

function getNavLinkClassName(isActive: boolean) {
  return `flex min-w-0 flex-1 items-center justify-center rounded-badge border px-1 py-0.5 text-center text-[0.5rem] font-semibold uppercase leading-none tracking-tight transition-all sm:px-1.5 sm:text-[0.55rem] sm:tracking-wide lg:flex-none lg:shrink-0 lg:px-2.5 lg:py-1 lg:text-[0.65rem] lg:tracking-widest ${
    isActive
      ? "border-base-blue/80 bg-base-blue text-text-primary shadow-[0_0_14px_rgba(0,82,255,0.55)] ring-1 ring-base-blue/50"
      : "border-glass-border bg-glass-bg text-text-secondary hover:border-white/30 hover:bg-white/10 hover:text-text-primary"
  }`;
}

function WalletMenu() {
  const { address } = useAccount();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!address) {
    return null;
  }

  return (
    <div className="relative max-w-[5.75rem] shrink-0 lg:max-w-none" ref={menuRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-9 max-w-full items-center gap-0.5 rounded-badge border border-glass-border bg-glass-bg px-1.5 font-mono text-[0.5rem] font-semibold leading-none text-text-primary shadow-sm transition-all hover:border-white/30 hover:bg-white/10 lg:min-h-9 lg:gap-1.5 lg:px-2.5 lg:py-1 lg:text-[0.65rem]"
      >
        <span className="truncate">{formatHeaderWalletAddress(address)}</span>
        <span
          aria-hidden
          className={`shrink-0 text-[0.45rem] text-text-muted transition-transform lg:text-[0.6rem] ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[11rem] overflow-hidden rounded-card border border-glass-border bg-glass-bg py-1 shadow-lg shadow-black/25 backdrop-blur-xl"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-white/10"
          >
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={isDisconnecting}
            onClick={() => {
              disconnect();
              setIsOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect Wallet"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { status } = useAccount();
  const isConnected = status === "connected";

  return (
    <header className="sticky top-0 z-10 w-full min-w-0 px-4 pt-5 pb-2 sm:px-6">
      <div className="mx-auto flex w-full min-w-0 max-w-lg items-center gap-1.5 overflow-hidden rounded-card border border-glass-border bg-glass-bg px-2 py-2 shadow-lg shadow-black/10 backdrop-blur-xl sm:max-w-xl sm:gap-3 sm:px-5 sm:py-2.5 lg:grid lg:max-w-4xl lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:overflow-visible lg:px-6 lg:py-3">
        <Link
          href="/"
          aria-label="Home"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-base-blue shadow-md transition-opacity hover:opacity-90 sm:size-9 lg:col-start-1"
        >
          <span className="text-sm font-bold tracking-tight text-text-primary">
            BQ
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5 lg:col-start-2 lg:w-auto lg:flex-none lg:justify-self-center lg:justify-center lg:gap-3"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActiveRoute(pathname, item.href) ? "page" : undefined
              }
              className={getNavLinkClassName(isActiveRoute(pathname, item.href))}
            >
              {item.label}
            </Link>
          ))}
          <span className="hidden shrink-0 rounded-badge border border-glass-border bg-base-blue px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-text-primary shadow-sm lg:inline-flex">
            Base
          </span>
        </nav>

        <div className="flex shrink-0 items-center lg:col-start-3 lg:justify-self-end">
          {isConnected ? (
            <WalletMenu />
          ) : (
            <>
              <ConnectWalletButton
                connectLabel="Connect"
                connectingLabel="Connecting..."
                buttonClassName={connectButtonClassName}
                disabledClassName={connectButtonDisabledClassName}
                className="lg:hidden"
              />
              <ConnectWalletButton
                connectLabel="Connect Wallet"
                connectingLabel="Connecting..."
                buttonClassName={connectButtonClassName}
                disabledClassName={connectButtonDisabledClassName}
                className="hidden lg:inline-flex"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
