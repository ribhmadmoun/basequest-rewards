"use client";

import DailyCheckInQuestButton from "@/components/DailyCheckInQuestButton";
import GlassPanel from "@/components/GlassPanel";
import { ui } from "@/lib/ui-styles";

export type QuestStatus = "available" | "completed" | "locked";

type QuestCardProps = {
  questId?: string;
  title: string;
  description: string;
  reward: string;
  status: QuestStatus;
  ctaLabel: string;
  onAction?: () => void;
};

const statusLabels: Record<QuestStatus, string> = {
  available: "Available",
  completed: "Completed",
  locked: "Locked",
};

const statusBadgeStyles: Record<QuestStatus, string> = {
  available:
    "border-cyan-300/40 bg-cyan-500/15 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.25)]",
  completed: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100",
  locked: "border-white/10 bg-white/[0.04] text-white/45",
};

function getCtaButtonClassName(isActionable: boolean) {
  return isActionable
    ? ui.primaryButton
    : `${ui.secondaryButton} opacity-70 cursor-not-allowed`;
}

export default function QuestCard({
  questId,
  title,
  description,
  reward,
  status,
  ctaLabel,
  onAction,
}: QuestCardProps) {
  const isActionable = status === "available";
  const isDailyCheckInQuest = questId === "daily-check-in";

  return (
    <GlassPanel interactive className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-badge border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-widest sm:px-3 sm:text-[0.65rem] ${statusBadgeStyles[status]}`}
        >
          {statusLabels[status]}
        </span>
        <span className="shrink-0 rounded-badge border border-base-blue/40 bg-gradient-to-r from-base-blue/80 to-indigo-600/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white sm:px-3 sm:text-xs">
          {reward}
        </span>
      </div>

      <h3 className="mt-3.5 font-sans text-base font-semibold tracking-tight text-white sm:mt-4 sm:text-lg">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-white/55 sm:leading-7">
        {description}
      </p>

      <div className="pt-4 sm:pt-5">
        {isDailyCheckInQuest ? (
          <DailyCheckInQuestButton
            ctaLabel={ctaLabel}
            disabled={!isActionable}
            buttonClassName={getCtaButtonClassName(true)}
            disabledClassName={getCtaButtonClassName(false)}
            onSuccess={onAction}
          />
        ) : (
          <button
            type="button"
            disabled={!isActionable}
            onClick={onAction}
            className={`${getCtaButtonClassName(isActionable)} w-full`}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </GlassPanel>
  );
}
