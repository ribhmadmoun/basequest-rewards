export default function Header() {
  return (
    <header className="sticky top-0 z-10 w-full px-4 pt-5 pb-2 sm:px-6">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4 rounded-card border border-glass-border bg-glass-bg px-5 py-3.5 shadow-lg shadow-black/10 backdrop-blur-xl sm:max-w-xl sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-card bg-base-blue shadow-md"
          >
            <span className="text-sm font-bold tracking-tight text-text-primary">
              BQ
            </span>
          </div>
          <span className="truncate font-sans text-base font-bold tracking-tight text-text-primary sm:text-lg">
            BaseQuest Rewards
          </span>
        </div>
        <span className="shrink-0 rounded-badge border border-glass-border bg-base-blue px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-text-primary shadow-sm">
          Base
        </span>
      </div>
    </header>
  );
}
