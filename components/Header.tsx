"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import { formatWalletAddress } from "@/lib/ui-styles";
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
  "rounded-badge border border-glass-border bg-base-blue px-1.5 py-1 min-h-9 text-[0.5rem] font-semibold uppercase tracking-tighter text-text-primary shadow-sm transition-all hover:opacity-90 hover:shadow-md whitespace-nowrap sm:min-h-9 sm:px-2.5 sm:py-1 sm:text-[0.65rem] sm:tracking-wide";

const connectButtonDisabledClassName =
  "rounded-badge border border-glass-border bg-glass-bg px-1.5 py-1 min-h-9 text-[0.5rem] font-semibold uppercase tracking-tighter text-text-muted opacity-70 whitespace-nowrap sm:min-h-9 sm:px-2.5 sm:py-1 sm:text-[0.65rem] sm:tracking-wide";

function shortenAddress(address: string) {
  return formatWalletAddress(address);
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

function getNavLinkClassName(isActive: boolean) {
  return `shrink-0 rounded-badge border px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide transition-all sm:px-2.5 sm:py-1 sm:text-[0.65rem] sm:tracking-widest ${
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
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1 rounded-badge border border-glass-border bg-glass-bg px-1.5 py-0.5 font-mono text-[0.55rem] font-semibold text-text-primary shadow-sm transition-all hover:border-white/30 hover:bg-white/10 min-h-9 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.65rem]"
      >
        <span className="whitespace-nowrap">{shortenAddress(address)}</span>
        <span
          aria-hidden
          className={`text-[0.5rem] text-text-muted transition-transform sm:text-[0.6rem] ${
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
    <header className="sticky top-0 z-10 w-full px-4 pt-5 pb-2 sm:px-6">
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 rounded-card border border-glass-border bg-glass-bg px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-xl sm:max-w-xl sm:gap-3 sm:px-5 sm:py-2.5 lg:grid lg:max-w-4xl lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:px-6 lg:py-3">
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
          className="flex min-w-0 flex-1 items-center justify-evenly gap-1.5 pl-1 sm:gap-2 sm:pl-0 lg:col-start-2 lg:w-auto lg:flex-none lg:justify-self-center lg:justify-center lg:gap-3"
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
            <ConnectWalletButton
              connectLabel="Connect Wallet"
              connectingLabel="Connecting..."
              buttonClassName={connectButtonClassName}
              disabledClassName={connectButtonDisabledClassName}
            />
          )}
        </div>
      </div>
    </header>
  );
}
