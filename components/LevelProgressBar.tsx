import {
  getCurrentLevelXP,
  getLevel,
  getNextLevelXP,
  getProgressPercent,
  MAX_LEVEL,
} from "@/lib/levels";
import { ui } from "@/lib/ui-styles";

type LevelProgressBarProps = {
  totalXp: number;
  showDetails?: boolean;
};

export default function LevelProgressBar({
  totalXp,
  showDetails = false,
}: LevelProgressBarProps) {
  const level = getLevel(totalXp);
  const currentLevelXp = getCurrentLevelXP(totalXp);
  const nextLevelXp = getNextLevelXP(totalXp);
  const progressPercent = getProgressPercent(totalXp);
  const progressInLevel = totalXp - currentLevelXp;
  const levelSpan =
    nextLevelXp !== null ? nextLevelXp - currentLevelXp : 0;
  const xpUntilNextLevel =
    nextLevelXp !== null ? nextLevelXp - totalXp : null;

  return (
    <div className="w-full">
      {showDetails ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-base-blue via-indigo-600 to-violet-700 shadow-[0_0_20px_rgba(0,82,255,0.35)] sm:size-20">
              <span className="font-sans text-2xl font-bold text-white sm:text-3xl">
                {level}
              </span>
            </div>
            <div>
              <p className={ui.statLabel}>Current Level</p>
              <p className="mt-1 font-sans text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Level {level}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showDetails && nextLevelXp !== null ? (
        <p className="mt-4 text-sm text-white/60 sm:text-base">
          {progressInLevel} / {levelSpan} XP
        </p>
      ) : null}

      {showDetails && nextLevelXp === null ? (
        <p className="mt-4 text-sm text-white/60 sm:text-base">
          {totalXp} XP · Max level reached
        </p>
      ) : null}

      <div
        className={`h-2 w-full overflow-hidden rounded-badge bg-white/10 ${
          showDetails ? "mt-3" : "mt-2"
        }`}
      >
        <div
          className="h-full rounded-badge bg-gradient-to-r from-base-blue to-cyan-400 transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {showDetails && xpUntilNextLevel !== null ? (
        <p className="mt-3 text-sm text-white/45">
          Next level in {xpUntilNextLevel} XP
        </p>
      ) : null}

      {!showDetails ? (
        <p className="mt-2 text-xs text-white/45">
          {nextLevelXp !== null
            ? `${Math.round(progressPercent)}% to Level ${level + 1}`
            : `Level ${MAX_LEVEL} reached`}
        </p>
      ) : null}
    </div>
  );
}
