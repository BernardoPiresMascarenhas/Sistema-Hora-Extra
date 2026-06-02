"use client";

import { useState } from "react";
import { Settings, Loader2, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarTaxas } from "@/actions/Taxas.actions";
import type { ConfiguracaoTaxa, MetodoPagamento } from "@/types/Types";

// Atualizado com o método Dinheiro
const METODOS: MetodoPagamento[] = ["Pix", "Débito", "Crédito", "Dinheiro"];

interface ModalTaxasProps {
  taxasIniciais: ConfiguracaoTaxa[]; 
}

export function ModalTaxas({ taxasIniciais }: ModalTaxasProps) {
  const [valores, setValores] = useState<Record<MetodoPagamento, string>>(() => {
    // Inicializa todos com zero, incluindo o Dinheiro
    const base = { Pix: "0", Débito: "0", Crédito: "0", Dinheiro: "0" } as Record<
      MetodoPagamento,
      string
    >;
    taxasIniciais.forEach((t) => {
      base[t.metodo] = String(t.percentual);
    });
    return base;
  });
  
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; tipo: "ok" | "erro" } | null>(null);
  const [aberto, setAberto] = useState(false);

  async function handleSalvar() {
    setSalvando(true);
    setMsg(null);

    const payload: ConfiguracaoTaxa[] = METODOS.map((m) => ({
      metodo: m,
      percentual: Number(valores[m].replace(",", ".")) || 0,
    }));

    const res = await salvarTaxas(payload);
    setSalvando(false);

    if (res.ok) {
      setMsg({ texto: "Taxas atualizadas com sucesso", tipo: "ok" });
      setTimeout(() => setAberto(false), 1200);
    } else {
      setMsg({ texto: res.erro, tipo: "erro" });
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-zinc-800/60 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100 transition-colors shadow-sm rounded-xl h-10 px-4"
        >
          <Settings size={16} className="mr-2" />
          Configurações
        </Button>
      </DialogTrigger>

      <DialogContent className="border-zinc-800/60 bg-zinc-950/95 text-zinc-100 sm:rounded-2xl backdrop-blur-md shadow-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
            <div className="rounded-lg bg-blue-500/20 p-1.5 text-blue-500">
              <Percent size={18} />
            </div>
            Taxas das Maquininhas
          </DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-zinc-400 leading-relaxed mb-2 mt-1">
          Defina o percentual descontado sobre o valor bruto de cada venda. 
          <span className="text-zinc-300 font-medium"> Vendas passadas não serão alteradas.</span>
        </p>

        <div className="space-y-2.5 py-4">
          {METODOS.map((m) => (
            <div 
              key={m} 
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 transition-colors hover:bg-zinc-900/50"
            >
              <Label className="text-sm font-medium text-zinc-300 ml-1">{m}</Label>
              <div className="relative w-32">
                <Input
                  inputMode="decimal"
                  value={valores[m]}
                  onChange={(e) =>
                    setValores((v) => ({ ...v, [m]: e.target.value }))
                  }
                  className="border-zinc-800 bg-zinc-950 pr-8 text-right font-medium focus-visible:ring-blue-500 h-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500 select-none">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`mb-2 rounded-lg p-3 text-center text-sm font-medium ${
            msg.tipo === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}>
            {msg.texto}
          </div>
        )}

        <Button
          onClick={handleSalvar}
          disabled={salvando}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl h-12 shadow-lg shadow-blue-500/20 transition-all mt-2"
        >
          {salvando ? <Loader2 className="animate-spin" size={20} /> : "Salvar Configurações"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}