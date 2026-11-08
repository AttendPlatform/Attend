import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <Header />

      <main className="pb-20 md:pb-0">
        {children}
      </main>

      <MobileNav />
    </div>
  );
}