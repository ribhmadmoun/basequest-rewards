import PageShell from "@/components/PageShell";
import WalletScoreDashboard from "@/components/wallet-score/WalletScoreDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base Wallet Score | BaseQuest Rewards",
  description:
    "Premium Base wallet analytics dashboard — score, portfolio, activity, and insights.",
};

export default function BaseWalletScorePage() {
  return (
    <PageShell>
      <WalletScoreDashboard />
    </PageShell>
  );
}
