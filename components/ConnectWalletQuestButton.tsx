"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";

type ConnectWalletQuestButtonProps = {
  ctaLabel: string;
  buttonClassName: string;
  disabledClassName: string;
  questCompleted?: boolean;
};

export default function ConnectWalletQuestButton({
  ctaLabel,
  buttonClassName,
  disabledClassName,
  questCompleted = false,
}: ConnectWalletQuestButtonProps) {
  return (
    <ConnectWalletButton
      connectLabel="Connect Wallet"
      connectingLabel="Connecting..."
      completedLabel={ctaLabel}
      buttonClassName={buttonClassName}
      disabledClassName={disabledClassName}
      questCompleted={questCompleted}
    />
  );
}
