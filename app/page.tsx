import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#0052FF] via-[#0047E0] to-[#0039B3]">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          BaseQuest Rewards
        </h1>
        <p className="mt-4 text-xl font-medium text-white/90 sm:text-2xl">
          Coming Soon
        </p>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75 sm:max-w-md sm:text-lg">
          Daily rewards and engagement for the Base ecosystem.
        </p>
      </main>
    </div>
  );
}
