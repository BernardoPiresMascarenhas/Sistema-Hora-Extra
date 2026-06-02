"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Repeat2,
  LogOut // Ícone novo
} from "lucide-react";
import Image from "next/image";
import { getEmailUsuario, deslogar } from "@/actions/auth.actions";

const ITENS_COMPLETOS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/pdv", label: "Caixa", icon: ShoppingCart },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/reposicao", label: "Reposicao", icon: Repeat2 },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  // Busca o email assim que o menu carrega
  useEffect(() => {
    getEmailUsuario().then((res) => setEmail(res));
  }, []);

  const ehAtivo = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // O SEGREDO DO ACESSO: Se for a conta do caixa, mostra só o PDV!
  const isCaixa = email === "caixa@horaextra.com";
  const itensMenu = isCaixa 
    ? ITENS_COMPLETOS.filter((item) => item.href === "/pdv") 
    : ITENS_COMPLETOS;

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

        <nav className="flex flex-col gap-1.5 flex-1">
          {itensMenu.map(({ href, label, icon: Icon }) => {
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
                <Icon size={18} className={on ? "text-emerald-500" : "text-zinc-500"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* BOTÃO DE SAIR - DESKTOP */}
        <button 
          onClick={() => deslogar()}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
        >
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </aside>

      {/* ============ BOTTOM BAR (mobile) ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-md pb-2 pt-1 lg:hidden">
        {itensMenu.map(({ href, label, icon: Icon }) => {
          const on = ehAtivo(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-all ${
                on ? "text-zinc-100" : "text-zinc-500"
              }`}
            >
              <Icon size={22} className={on ? "text-emerald-500" : "text-zinc-500"} />
              {label}
            </Link>
          );
        })}
        
        {/* BOTÃO DE SAIR - MOBILE */}
        <button 
          onClick={() => deslogar()}
          className="flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-rose-400 transition-all"
        >
          <LogOut size={22} />
          Sair
        </button>
      </nav>
    </>
  );
}