import {
  getCurrentLevelXP,
  getLevel,
  getNextLevelXP,
  getProgressPercent,
  MAX_LEVEL,
} from "@/lib/levels";

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
            <div className="flex size-16 shrink-0 items-center justify-center rounded-card border border-glass-border bg-base-blue shadow-md sm:size-20">
              <span className="font-sans text-2xl font-bold text-text-primary sm:text-3xl">
                {level}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Current Level
              </p>
              <p className="mt-1 font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Level {level}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showDetails && nextLevelXp !== null ? (
        <p className="mt-4 text-sm text-text-secondary sm:text-base">
          {progressInLevel} / {levelSpan} XP
        </p>
      ) : null}

      {showDetails && nextLevelXp === null ? (
        <p className="mt-4 text-sm text-text-secondary sm:text-base">
          {totalXp} XP · Max level reached
        </p>
      ) : null}

      <div
        className={`h-2.5 w-full overflow-hidden rounded-badge border border-glass-border bg-glass-bg ${
          showDetails ? "mt-3" : "mt-2"
        }`}
      >
        <div
          className="h-full rounded-badge bg-base-blue transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {showDetails && xpUntilNextLevel !== null ? (
        <p className="mt-3 text-sm text-text-muted">
          Next level in {xpUntilNextLevel} XP
        </p>
      ) : null}

      {!showDetails ? (
        <p className="mt-2 text-xs text-text-muted">
          {nextLevelXp !== null
            ? `${Math.round(progressPercent)}% to Level ${level + 1}`
            : `Level ${MAX_LEVEL} reached`}
        </p>
      ) : null}
    </div>
  );
}
