"use client";

import GlassPanel from "@/components/GlassPanel";
import PageShell from "@/components/PageShell";
import WalletStatusCard from "@/components/WalletStatusCard";
import { ui } from "@/lib/ui-styles";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <PageShell>
      <section className="text-center sm:text-left">
        <p className={ui.sectionHeading}>Settings</p>
        <h1 className={ui.pageTitle}>Account Settings</h1>
        <p className={ui.pageSubtitle}>
          Manage your wallet connection and BaseQuest preferences.
        </p>
      </section>

      <section>
        <div className={ui.sectionHeaderWrap}>
          <p className={ui.sectionHeading}>Wallet</p>
          <h2 className={ui.sectionTitle}>Connection</h2>
        </div>
        <WalletStatusCard />
      </section>

      <section>
        <div className={ui.sectionHeaderWrap}>
          <p className={ui.sectionHeading}>Network</p>
          <h2 className={ui.sectionTitle}>Base Network</h2>
        </div>
        <GlassPanel className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div>
              <p className={ui.statLabel}>Chain</p>
              <p className="mt-2 font-sans text-lg font-semibold text-white">
                Base
              </p>
            </div>
            <div>
              <p className={ui.statLabel}>Environment</p>
              <p className="mt-2 font-sans text-lg font-semibold text-white">
                Mainnet
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            BaseQuest rewards and Wallet Score analytics run on Base. Switch
            networks in your wallet if you need to reconnect.
          </p>
        </GlassPanel>
      </section>

      <section>
        <div className={ui.sectionHeaderWrap}>
          <p className={ui.sectionHeading}>Shortcuts</p>
          <h2 className={ui.sectionTitle}>Quick Links</h2>
        </div>
        <div className={ui.gridCards}>
          <Link href="/profile" className="block">
            <GlassPanel interactive className="p-5 sm:p-6">
              <p className={ui.statLabel}>Profile</p>
              <p className="mt-2 font-sans text-lg font-bold text-white">
                View your profile
              </p>
              <p className="mt-2 text-sm text-white/55">
                XP, streak, badges, and completed quests.
              </p>
            </GlassPanel>
          </Link>
          <Link href="/base-wallet-score" className="block">
            <GlassPanel interactive className="p-5 sm:p-6">
              <p className={ui.statLabel}>Analytics</p>
              <p className="mt-2 font-sans text-lg font-bold text-white">
                Base Wallet Score
              </p>
              <p className="mt-2 text-sm text-white/55">
                Open live wallet analytics and scoring.
              </p>
            </GlassPanel>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
