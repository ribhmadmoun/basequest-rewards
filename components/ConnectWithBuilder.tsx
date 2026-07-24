import GlassPanel from "@/components/GlassPanel";

const X_URL = "https://x.com/bqrbase";
const FARCASTER_URL = "https://farcaster.xyz/hqc";

type ConnectWithBuilderProps = {
  variant: "mobile" | "desktop";
};

/** Official X (Twitter) mark */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

/** Official Farcaster mark */
function FarcasterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1000 1000"
      fill="currentColor"
      aria-hidden
    >
      <path d="M257.778 155.556H742.222V844.445H671.111V528.889H670.426C662.327 441.677 589.53 373.333 500 373.333C410.47 373.333 337.673 441.677 329.574 528.889H328.889V844.445H257.778V155.556Z" />
      <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" />
      <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z" />
    </svg>
  );
}

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
