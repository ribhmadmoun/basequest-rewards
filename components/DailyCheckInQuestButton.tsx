"use client";

import {
  DAILY_CHECK_IN_ABI,
  DAILY_CHECK_IN_ADDRESS,
} from "@/lib/contracts/DailyCheckIn";
import { useState } from "react";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

type DailyCheckInQuestButtonProps = {
  ctaLabel: string;
  buttonClassName: string;
  disabledClassName: string;
  disabled?: boolean;
  onSuccess?: () => void;
};

export default function DailyCheckInQuestButton({
  ctaLabel,
  buttonClassName,
  disabledClassName,
  disabled = false,
  onSuccess,
}: DailyCheckInQuestButtonProps) {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCheckIn() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await writeContractAsync({
        address: DAILY_CHECK_IN_ADDRESS,
        abi: DAILY_CHECK_IN_ABI,
        functionName: "checkIn",
      });

      await waitForTransactionReceipt(config, { hash });
      console.log(hash);
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled = disabled || isSubmitting;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => {
        void handleCheckIn();
      }}
      className={`${isDisabled ? disabledClassName : buttonClassName} w-full`}
    >
      {isSubmitting ? "Checking in..." : ctaLabel}
    </button>
  );
}
