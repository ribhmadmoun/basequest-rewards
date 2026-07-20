import { useEffect } from "react";

type LevelUpCelebrationProps = {
  level: number;
  onDismiss: () => void;
};

export default function LevelUpCelebration({
  level,
  onDismiss,
}: LevelUpCelebrationProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [level, onDismiss]);

  return (
    <article
      role="status"
      aria-live="polite"
      className="rounded-card border border-glass-border bg-glass-bg p-5 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6"
    >
      <p className="font-sans text-xl font-bold text-text-primary sm:text-2xl">
        🎉 Level Up!
      </p>
      <p className="mt-2 text-sm text-text-secondary sm:text-base">
        You reached Level {level}!
      </p>
    </article>
  );
}
