"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import DailyCheckInQuestButton from "@/components/DailyCheckInQuestButton";
import FollowFarcasterQuestButton from "@/components/FollowFarcasterQuestButton";
import FollowXQuestButton from "@/components/FollowXQuestButton";
import GlassPanel from "@/components/GlassPanel";
import type { QuestProgress } from "@/lib/quest-engine";
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
  /** Apply verified server progress (e.g. X follow quest). */
  onServerProgress?: (progress: QuestProgress) => void;
  /** Optional leading icon (e.g. social marks for community quests). */
  icon?: ReactNode;
  /** Optional frequency badge, e.g. "One-Time". */
  frequencyLabel?: string;
  /** When set, CTA opens this URL in a new tab instead of calling onAction. */
  externalHref?: string;
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

function duplicateIcon(icon: ReactNode): ReactNode {
  if (isValidElement(icon)) {
    return cloneElement(icon as ReactElement);
  }

  return icon;
}

export default function QuestCard({
  questId,
  title,
  description,
  reward,
  status,
  ctaLabel,
  onAction,
  onServerProgress,
  icon,
  frequencyLabel,
  externalHref,
}: QuestCardProps) {
  const isActionable = status === "available";
  const isDailyCheckInQuest = questId === "daily-check-in";
  const isFollowXQuest = questId === "follow-x";
  const isFollowFarcasterQuest = questId === "follow-farcaster";

  return (
    <GlassPanel interactive className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-badge border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-widest sm:px-3 sm:text-[0.65rem] ${statusBadgeStyles[status]}`}
          >
            {statusLabels[status]}
          </span>
          {frequencyLabel ? (
            <span className="rounded-badge border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-widest text-white/55 sm:px-3 sm:text-[0.65rem]">
              {frequencyLabel}
            </span>
          ) : null}
        </div>
        <span className="shrink-0 rounded-badge border border-base-blue/40 bg-gradient-to-r from-base-blue/80 to-indigo-600/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white sm:px-3 sm:text-xs">
          {reward}
        </span>
      </div>

      <h3 className="mt-3.5 flex items-center gap-2.5 font-sans text-base font-semibold tracking-tight text-white sm:mt-4 sm:text-lg">
        {icon ? (
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-100/90">
            {icon}
          </span>
        ) : null}
        <span>{title}</span>
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
        ) : isFollowXQuest && onServerProgress ? (
          <FollowXQuestButton
            status={status}
            buttonClassName={getCtaButtonClassName(true)}
            disabledClassName={getCtaButtonClassName(false)}
            onCompleted={onServerProgress}
          />
        ) : isFollowFarcasterQuest && onServerProgress ? (
          <FollowFarcasterQuestButton
            status={status}
            buttonClassName={getCtaButtonClassName(true)}
            disabledClassName={getCtaButtonClassName(false)}
            onCompleted={onServerProgress}
          />
        ) : externalHref ? (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${getCtaButtonClassName(true)} inline-flex w-full items-center justify-center gap-2`}
          >
            {duplicateIcon(icon)}
            {ctaLabel}
          </a>
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
