"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { login } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleLogin(formData: FormData) {
    setCarregando(true);
    setErro(null);
    
    const res = await login(formData);
    
    if (res?.erro) {
      setErro(res.erro);
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-800/60 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md sm:rounded-2xl">
        <div className="mb-8 flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={200} 
            height={60} 
            className="mb-6 h-16 w-auto object-contain" 
          />
          <h1 className="text-2xl font-bold text-zinc-100">Acesso Restrito</h1>
          <p className="mt-2 text-sm text-zinc-400">Entre com suas credenciais para continuar</p>
        </div>

        <form action={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="ml-1 text-[13px] font-medium text-zinc-400">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input
                name="email"
                type="email"
                required
                placeholder="admin@espeto.com"
                className="h-12 border-zinc-800 bg-zinc-950 pl-10 text-zinc-200 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[13px] font-medium text-zinc-400">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input
                name="password"
                type={mostrarSenha ? "text" : "password"}
                required
                placeholder="••••••••"
                className="h-12 border-zinc-800 bg-zinc-950 pl-10 pr-10 text-zinc-200 focus-visible:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1} // Evita que o Tab pare no ícone do olho
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm font-medium text-rose-400">
              {erro}
            </div>
          )}

          <Button
            type="submit"
            disabled={carregando}
            className="h-12 w-full rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 mt-2"
          >
            {carregando ? <Loader2 className="animate-spin" size={20} /> : "Entrar no Sistema"}
          </Button>
        </form>
      </Card>
    </div>
  );
}