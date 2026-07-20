import Header from "@/components/Header";
import { ui } from "@/lib/ui-styles";

type PageShellProps = {
  children: React.ReactNode;
};

export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/4 size-72 rounded-badge bg-base-blue/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-1/3 size-56 rounded-badge bg-glass-bg blur-2xl"
      />

      <Header />

      <main className={ui.pageMain}>{children}</main>
    </div>
  );
}
