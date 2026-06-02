"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export function FiltroData() {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  
  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje);
  trintaDiasAtras.setDate(hoje.getDate() - 30);

  const inicio = searchParams.get("inicio") || trintaDiasAtras.toISOString().split('T')[0];
  const fim = searchParams.get("fim") || hoje.toISOString().split('T')[0];

  function atualizarFiltro(novaInicio: string, novaFim: string) {
    router.push(`${pathname}?inicio=${novaInicio}&fim=${novaFim}`);
  }

  return (
    <div className="flex gap-2 bg-zinc-950/50 p-1.5 rounded-xl border border-zinc-800/60 shadow-sm backdrop-blur-sm">
      <Input 
        type="date" 
        value={inicio} 
        onChange={(e) => atualizarFiltro(e.target.value, fim)}
        className="h-9 w-36 bg-zinc-900 border-zinc-800 text-sm text-zinc-300 focus-visible:ring-blue-500 [color-scheme:dark]"
      />
      <span className="text-zinc-600 self-center font-medium">-</span>
      <Input 
        type="date" 
        value={fim} 
        onChange={(e) => atualizarFiltro(inicio, e.target.value)}
        className="h-9 w-36 bg-zinc-900 border-zinc-800 text-sm text-zinc-300 focus-visible:ring-blue-500 [color-scheme:dark]"
      />
    </div>
  );
}