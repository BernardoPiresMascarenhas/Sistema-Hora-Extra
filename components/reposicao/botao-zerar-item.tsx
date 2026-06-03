// components/reposicao/botao-zerar-item.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marcarItemComoReposto } from "@/actions/reposicao.actions";

interface BotaoZerarItemProps {
  produtoId: string;
  nomeProduto: string;
  inicio: string;
  fim: string;
}

export function BotaoZerarItem({ produtoId, nomeProduto, inicio, fim }: BotaoZerarItemProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleZerar() {
    const confirmar = window.confirm(
      `Deseja dar baixa na reposição de "${nomeProduto}"? Isso removerá o item da lista.`
    );
    if (!confirmar) return;

    setLoading(true);
    const res = await marcarItemComoReposto(produtoId, inicio, fim);
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      alert("Erro ao atualizar reposição: " + res.erro);
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleZerar}
      disabled={loading}
      className="bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-zinc-950 transition-colors h-8 w-8 p-0 flex items-center justify-center rounded-lg"
      title="Marcar como reposto"
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
    </Button>
  );
}