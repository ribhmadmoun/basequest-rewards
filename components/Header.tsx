export default function Header() {
  return (
    <header className="sticky top-0 z-10 w-full px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md sm:px-6 sm:py-4">
        <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
          BaseQuest Rewards
        </span>
        <span className="rounded-full bg-[#0052FF] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
          Base
        </span>
      </div>
    </header>
  );
}
