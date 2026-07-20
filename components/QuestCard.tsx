"use client";

import ConnectWalletQuestButton from "@/components/ConnectWalletQuestButton";

export type QuestStatus = "available" | "completed" | "locked";

type QuestCardProps = {
  questId?: string;
  title: string;
  description: string;
  reward: string;
  status: QuestStatus;
  ctaLabel: string;
  questCompleted?: boolean;
  onAction?: () => void;
};

const statusLabels: Record<QuestStatus, string> = {
  available: "Available",
  completed: "Completed",
  locked: "Locked",
};

const statusBadgeStyles: Record<QuestStatus, string> = {
  available: "bg-base-blue text-text-primary",
  completed: "bg-glass-bg text-text-secondary",
  locked: "bg-glass-bg text-text-muted",
};

function getCtaButtonClassName(isActionable: boolean) {
  return `mt-5 w-full rounded-card border px-4 py-2.5 text-sm font-semibold transition-opacity sm:mt-6 ${
    isActionable
      ? "border-glass-border bg-base-blue text-text-primary hover:opacity-90"
      : "cursor-not-allowed border-glass-border bg-glass-bg text-text-muted opacity-70"
  }`;
}

export default function QuestCard({
  questId,
  title,
  description,
  reward,
  status,
  ctaLabel,
  questCompleted = false,
  onAction,
}: QuestCardProps) {
  const isActionable = status === "available";
  const isConnectWalletQuest = questId === "connect-wallet";

  return (
    <article className="flex h-full flex-col rounded-card border border-glass-border bg-glass-bg p-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-badge border border-glass-border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest ${statusBadgeStyles[status]}`}
        >
          {statusLabels[status]}
        </span>
        <span className="shrink-0 rounded-badge border border-glass-border bg-base-blue px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-primary">
          {reward}
        </span>
      </div>

      <h3 className="mt-4 font-sans text-base font-semibold tracking-tight text-text-primary sm:text-lg">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
        {description}
      </p>

      {isConnectWalletQuest ? (
        <ConnectWalletQuestButton
          ctaLabel={ctaLabel}
          questCompleted={questCompleted}
          buttonClassName={getCtaButtonClassName(true)}
          disabledClassName={getCtaButtonClassName(false)}
        />
      ) : (
        <button
          type="button"
          disabled={!isActionable}
          onClick={onAction}
          className={getCtaButtonClassName(isActionable)}
        >
          {ctaLabel}
        </button>
      )}
    </article>
  );
}
