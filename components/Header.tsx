"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAccount, useDisconnect } from "wagmi";

/** Always visible in the mobile top bar */
const MOBILE_PRIMARY_NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/quests", label: "Quests" },
  { href: "/base-wallet-score", label: "Wallet Score" },
] as const;

/** First-level items in the mobile hamburger menu (exact order) */
const MOBILE_OVERFLOW_NAV = [
  { href: "/profile", label: "Profile" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
] as const;

/** Full desktop nav — unchanged */
const DESKTOP_NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/quests", label: "Quests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/base-wallet-score", label: "Wallet Score" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
] as const;

const connectButtonClassName =
  "flex h-9 items-center rounded-badge border border-cyan-300/30 bg-gradient-to-r from-base-blue to-indigo-600 px-2 text-[0.5rem] font-semibold uppercase tracking-tight text-white shadow-[0_0_14px_rgba(0,82,255,0.35)] transition-all hover:opacity-95 whitespace-nowrap lg:min-h-9 lg:px-2.5 lg:py-1 lg:text-[0.65rem] lg:tracking-wide";

const connectButtonDisabledClassName =
  "flex h-9 items-center rounded-badge border border-white/10 bg-white/[0.04] px-2 text-[0.5rem] font-semibold uppercase tracking-tight text-white/45 opacity-70 whitespace-nowrap lg:min-h-9 lg:px-2.5 lg:py-1 lg:text-[0.65rem] lg:tracking-wide";

const menuPanelClassName =
  "pointer-events-auto z-[9999] min-w-[11rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c142e]/95 via-[#12183a]/92 to-[#151040]/95 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl";

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

function getDesktopNavLinkClassName(isActive: boolean) {
  return `flex min-w-0 flex-none shrink-0 items-center justify-center rounded-badge border px-2 py-1 text-center text-[0.6rem] font-semibold uppercase leading-none tracking-widest transition-all ${
    isActive
      ? "border-cyan-300/40 bg-gradient-to-r from-base-blue to-indigo-600 text-white shadow-[0_0_14px_rgba(0,82,255,0.45)]"
      : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
  }`;
}

function getMobileNavLinkClassName(isActive: boolean) {
  return `flex shrink-0 items-center justify-center rounded-badge border px-1.5 py-1 text-center text-[0.55rem] font-semibold uppercase leading-none tracking-wide transition-all ${
    isActive
      ? "border-cyan-300/40 bg-gradient-to-r from-base-blue to-indigo-600 text-white shadow-[0_0_14px_rgba(0,82,255,0.45)]"
      : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
  }`;
}

function MobileOverflowMenu({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      setMenuPosition(null);
      return;
    }

    function updateMenuPosition() {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const overflowActive = MOBILE_OVERFLOW_NAV.some((item) =>
    isActiveRoute(pathname, item.href),
  );

  const dropdownMenu =
    isOpen && menuPosition && mounted
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="More pages"
            style={{
              position: "fixed",
              top: menuPosition.top,
              right: menuPosition.right,
            }}
            className={menuPanelClassName}
          >
            {MOBILE_OVERFLOW_NAV.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        aria-label="More pages"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex size-8 items-center justify-center rounded-badge border transition-all ${
          overflowActive || isOpen
            ? "border-cyan-300/40 bg-gradient-to-r from-base-blue to-indigo-600 text-white shadow-[0_0_14px_rgba(0,82,255,0.45)]"
            : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <span className="flex flex-col gap-[3px]" aria-hidden>
          <span className="block h-[1.5px] w-3.5 rounded-full bg-current" />
          <span className="block h-[1.5px] w-3.5 rounded-full bg-current" />
          <span className="block h-[1.5px] w-3.5 rounded-full bg-current" />
        </span>
      </button>
      {dropdownMenu}
    </div>
  );
}

function WalletMenu() {
  const { address } = useAccount();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      setMenuPosition(null);
      return;
    }

    function updateMenuPosition() {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!address) {
    return null;
  }

  const dropdownMenu =
    isOpen && menuPosition && mounted
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuPosition.top,
              right: menuPosition.right,
            }}
            className={menuPanelClassName}
          >
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Profile
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={isDisconnecting}
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect Wallet"}
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className="relative max-w-[5.75rem] shrink-0 lg:max-w-none"
      ref={containerRef}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-9 max-w-full items-center gap-0.5 rounded-badge border border-white/12 bg-white/[0.04] px-1.5 font-mono text-[0.5rem] font-semibold leading-none text-white shadow-sm transition-all hover:border-cyan-300/30 hover:bg-white/[0.08] lg:min-h-9 lg:gap-1.5 lg:px-2.5 lg:py-1 lg:text-[0.65rem]"
      >
        <span className="truncate">{formatHeaderWalletAddress(address)}</span>
        <span
          aria-hidden
          className={`shrink-0 text-[0.45rem] text-white/45 transition-transform lg:text-[0.6rem] ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {dropdownMenu}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { status } = useAccount();
  const isConnected = status === "connected";

  return (
    <header className="sticky top-0 z-10 w-full min-w-0 px-4 pt-5 pb-2 sm:px-6">
      <div className="relative mx-auto flex w-full min-w-0 max-w-lg items-center gap-1.5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c142e]/90 via-[#12183a]/85 to-[#151040]/90 px-2 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:max-w-xl sm:gap-2 sm:px-4 sm:py-2.5 lg:grid lg:max-w-5xl lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4 lg:px-5 lg:py-3">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent"
        />

        <Link
          href="/"
          aria-label="Home"
          className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-cyan-200/25 bg-gradient-to-br from-base-blue via-indigo-600 to-violet-700 text-sm font-bold tracking-tight text-white shadow-[0_0_18px_rgba(0,82,255,0.4)] transition-opacity hover:opacity-90 sm:size-9 lg:col-start-1"
        >
          BQ
        </Link>

        {/* Mobile: primary pages + hamburger for Settings */}
        <nav
          aria-label="Main navigation"
          className="flex min-w-0 flex-1 items-center gap-1 lg:hidden"
        >
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MOBILE_PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  isActiveRoute(pathname, item.href) ? "page" : undefined
                }
                className={getMobileNavLinkClassName(
                  isActiveRoute(pathname, item.href),
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <MobileOverflowMenu pathname={pathname} />
        </nav>

        {/* Desktop: full navigation unchanged */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:col-start-2 lg:flex lg:w-auto lg:flex-none lg:items-center lg:justify-center lg:justify-self-center lg:gap-1.5"
        >
          {DESKTOP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActiveRoute(pathname, item.href) ? "page" : undefined
              }
              className={getDesktopNavLinkClassName(
                isActiveRoute(pathname, item.href),
              )}
            >
              {item.label}
            </Link>
          ))}
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
