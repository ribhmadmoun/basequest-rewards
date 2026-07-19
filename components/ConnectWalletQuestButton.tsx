"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";

type ConnectWalletQuestButtonProps = {
  ctaLabel: string;
  buttonClassName: string;
  disabledClassName: string;
  questCompleted?: boolean;
  onWalletConnected?: () => void;
};

export default function ConnectWalletQuestButton({
  ctaLabel,
  buttonClassName,
  disabledClassName,
  questCompleted = false,
  onWalletConnected,
}: ConnectWalletQuestButtonProps) {
  return (
    <ConnectWalletButton
      connectLabel="Connect Wallet"
      connectingLabel="Connecting..."
      completedLabel={ctaLabel}
      buttonClassName={buttonClassName}
      disabledClassName={disabledClassName}
      questCompleted={questCompleted}
      onWalletConnected={onWalletConnected}
    />
  );
}
