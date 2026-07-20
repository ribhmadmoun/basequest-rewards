export const ui = {
  pageMain:
    "relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 pb-10 pt-4 sm:gap-10 sm:px-6 sm:pb-12 sm:pt-5",

  sectionHeading:
    "text-xs font-semibold uppercase tracking-widest text-text-secondary",

  sectionTitle:
    "mt-1.5 font-sans text-xl font-bold tracking-tight text-text-primary sm:mt-2 sm:text-2xl lg:text-3xl",

  pageTitle:
    "mt-1.5 font-sans text-[1.75rem] font-bold leading-tight tracking-tight text-text-primary sm:mt-2 sm:text-4xl sm:leading-tight",

  pageSubtitle:
    "mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:mx-0 sm:mt-3 sm:text-base sm:leading-7",

  sectionHeaderWrap: "mb-4 sm:mb-5",

  sectionDescription:
    "mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:mt-3 sm:text-base sm:leading-7",

  glassCard:
    "rounded-card border border-glass-border bg-glass-bg shadow-lg shadow-black/10 backdrop-blur-xl",

  glassCardInteractive:
    "rounded-card border border-glass-border bg-glass-bg shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-base-blue/10",

  statCard:
    "flex h-full min-h-[8.5rem] flex-col rounded-card border border-glass-border bg-glass-bg p-5 text-center shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-base-blue/10 sm:p-6 sm:text-left",

  statLabel:
    "text-xs font-semibold uppercase tracking-widest text-text-secondary",

  statValue:
    "mt-auto pt-3 font-sans text-2xl font-bold tabular-nums tracking-tight text-text-primary sm:text-3xl",

  messageCard:
    "rounded-card border border-glass-border bg-glass-bg p-6 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-8",

  messageTitle:
    "font-sans text-base font-semibold text-text-primary sm:text-lg",

  primaryButton:
    "rounded-card border border-glass-border bg-base-blue px-4 py-3 min-h-11 text-sm font-semibold text-text-primary transition-all duration-200 hover:opacity-90 hover:shadow-md hover:shadow-base-blue/20",

  secondaryButton:
    "rounded-card border border-glass-border bg-glass-bg px-4 py-3 min-h-11 text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-text-primary",

  badgeYou:
    "inline-flex shrink-0 rounded-badge border border-base-blue/70 bg-base-blue px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-widest text-text-primary shadow-[0_0_12px_rgba(0,82,255,0.55)] ring-1 ring-base-blue/40 sm:px-2 sm:text-[0.55rem]",

  gridStats: "grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4",

  gridCards: "grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4",
} as const;

export function formatWalletAddress(address: string) {
  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}···${address.slice(-4)}`;
}
