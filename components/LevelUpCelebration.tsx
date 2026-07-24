import GlassPanel from "@/components/GlassPanel";
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
    <GlassPanel
      role="status"
      aria-live="polite"
      className="border-cyan-300/30 p-5 text-center shadow-[0_0_28px_rgba(0,82,255,0.28)] sm:p-6"
    >
      <p className="font-sans text-xl font-bold text-white sm:text-2xl">
        Level Up!
      </p>
      <p className="mt-2 text-sm text-white/60 sm:text-base">
        You reached Level {level}!
      </p>
    </GlassPanel>
  );
}
