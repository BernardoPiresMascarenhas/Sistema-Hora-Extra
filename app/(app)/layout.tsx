// app/(app)/layout.tsx
import { Nav } from "@/components/nav";

// Layout compartilhado pelas três telas. O route group (app) NÃO altera as URLs.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <Nav />

      {/* lg:pl-60  -> abre espaço para a sidebar fixa no desktop
          pb-20     -> abre espaço para a bottom bar no mobile (some no lg) */}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl pb-20 lg:pb-6">{children}</div>
      </main>
    </div>
  );
}
