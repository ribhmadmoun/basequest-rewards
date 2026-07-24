import GlassPanel from "@/components/GlassPanel";
import { FarcasterIcon, XIcon } from "@/components/icons/SocialIcons";

const X_URL = "https://x.com/bqrbase";
const FARCASTER_URL = "https://farcaster.xyz/hqc";

type ConnectWithBuilderProps = {
  variant: "mobile" | "desktop";
};

const socialButtonClassName =
  "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[0.7rem] font-semibold text-cyan-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_12px_28px_rgba(0,82,255,0.14)]";

function SocialButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-full items-center gap-2.5 ${className}`}>
      <a
        href={X_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X — @bqrbase"
        className={socialButtonClassName}
      >
        <XIcon className="size-3.5 shrink-0" />
        <span className="truncate">@bqrbase</span>
      </a>
      <a
        href={FARCASTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Farcaster — @hqc"
        className={socialButtonClassName}
      >
        <FarcasterIcon className="size-3.5 shrink-0" />
        <span className="truncate">@hqc</span>
      </a>
    </div>
  );
}

/**
 * Builder community card — desktop beside hero; mobile under description.
 */
export default function ConnectWithBuilder({
  variant,
}: ConnectWithBuilderProps) {
  if (variant === "mobile") {
    return (
      <GlassPanel className="!p-0 px-3.5 pb-3 pt-3.5 sm:px-4 sm:pb-3 sm:pt-4">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-sans text-base font-bold tracking-tight text-white">
            Connect with the Builder
          </h2>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-white/55">
            Building BaseQuest Rewards in public.
          </p>
          <SocialButtons className="mt-3 max-w-sm" />
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="!p-0 w-full">
      <div className="flex min-h-[11.5rem] flex-col justify-center px-5 py-7 lg:min-h-[12.5rem] lg:px-6 lg:py-8">
        <h2 className="font-sans text-lg font-bold tracking-tight text-white sm:text-xl">
          Connect with the Builder
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-white/55">
          Building BaseQuest Rewards in public.
        </p>
        <SocialButtons className="mt-6" />
      </div>
    </GlassPanel>
  );
}
