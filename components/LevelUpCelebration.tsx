import { useEffect } from "react";
import { ui } from "@/lib/ui-styles";

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
      className={`${ui.glassCard} border-base-blue/40 p-5 text-center shadow-[0_0_24px_rgba(0,82,255,0.25)] sm:p-6`}
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
