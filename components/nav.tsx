"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Repeat2
} from "lucide-react";
import Image from "next/image";


const ITENS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/pdv", label: "Caixa", icon: ShoppingCart },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/reposicao", label: "Reposicao", icon: Repeat2 },
] as const;

export function Nav() {
  const pathname = usePathname();

  // Ativo na rota exata OU em sub-rotas (ex: /produtos/[id]).
  const ehAtivo = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ============ SIDEBAR (desktop) ============ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-zinc-800/50 bg-zinc-950/95 backdrop-blur-md p-4 lg:flex">
        <div className="mb-8 mt-2 px-2">
          <Image 
            src="/logo.png" 
            alt="Logo da Espetiçaria" 
            width={200} 
            height={60} 
            className="h-42 w-auto object-contain" 
          />
        </div>

        <nav className="flex flex-col gap-1.5">
          {ITENS.map(({ href, label, icon: Icon }) => {
            const on = ehAtivo(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  on
                    ? "bg-zinc-800/40 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-200"
                }`}
              >
                <Icon 
                  size={18} 
                  className={on ? "text-emerald-500" : "text-zinc-500"} 
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ============ BOTTOM BAR (mobile) ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-md pb-2 pt-1 lg:hidden">
        {ITENS.map(({ href, label, icon: Icon }) => {
          const on = ehAtivo(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-all ${
                on ? "text-zinc-100" : "text-zinc-500"
              }`}
            >
              <Icon 
                size={22} 
                className={on ? "text-emerald-500" : "text-zinc-500"} 
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}