"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { registrarDespesa, excluirDespesa } from "@/actions/despesas.actions";

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  criado_em: string;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const num = (s: string) => Number(s.replace(",", ".")) || 0;

interface Props {
  despesas: Despesa[]; 
}

export function GestaoDespesas({ despesas }: Props) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const totalListado = despesas.reduce((acc, d) => acc + d.valor, 0);

  async function adicionar() {
    setErro(null);
    const v = num(valor);
    if (!descricao.trim() || v <= 0) {
      setErro("Preencha a descrição e um valor maior que zero.");
      return;
    }

    setSalvando(true);
    const res = await registrarDespesa(descricao.trim(), v);
    setSalvando(false);

    if (res.ok) {
      setDescricao("");
      setValor("");
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  async function remover(d: Despesa) {
    if (!window.confirm(`Excluir a despesa "${d.descricao}"?`)) return;
    setExcluindoId(d.id);
    const res = await excluirDespesa(d.id);
    setExcluindoId(null);
    if (res.ok) router.refresh();
    else window.alert(res.erro);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
        <Receipt className="text-rose-500" size={24} />
        Despesas e Saídas
      </h1>

      {/* ---------- FORMULÁRIO (topo) ---------- */}
      <Card className="border-zinc-800/50 bg-zinc-950/80 p-5 rounded-xl shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-400 ml-1">Descrição da Despesa</label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Saco de gelo, conta de luz, diária do garçom"
              className="border-zinc-800 bg-zinc-900 focus-visible:ring-rose-500 h-11"
              onKeyDown={(e) => e.key === "Enter" && adicionar()}
            />
          </div>
          <div className="w-full space-y-1.5 sm:w-48">
            <label className="text-[13px] font-medium text-zinc-400 ml-1">Valor (R$)</label>
            <Input
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="border-zinc-800 bg-zinc-900 focus-visible:ring-rose-500 h-11 text-rose-400 font-medium placeholder:text-zinc-600"
              onKeyDown={(e) => e.key === "Enter" && adicionar()}
            />
          </div>
          <Button
            onClick={adicionar}
            disabled={salvando}
            className="h-11 bg-rose-600 text-white hover:bg-rose-700 sm:w-auto shadow-lg shadow-rose-500/20 font-semibold rounded-lg transition-all"
          >
            {salvando ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                Registrar
              </>
            )}
          </Button>
        </div>
        {erro && <p className="mt-3 text-sm font-medium text-rose-400">{erro}</p>}
      </Card>

      {/* ---------- LISTA (abaixo) ---------- */}
      <div className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950/80 shadow-sm backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/50 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-medium">Descrição</TableHead>
              <TableHead className="text-zinc-400 font-medium">Data e Hora</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">Valor</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.length === 0 && (
              <TableRow className="border-zinc-800/50 hover:bg-transparent">
                <TableCell colSpan={4} className="py-12 text-center text-zinc-500">
                  <Receipt className="mx-auto mb-3 opacity-20" size={32} />
                  Nenhuma despesa registrada neste mês.
                </TableCell>
              </TableRow>
            )}

            {despesas.map((d) => (
              <TableRow key={d.id} className="border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                <TableCell className="font-medium text-zinc-200">
                  {d.descricao}
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {dataHora(d.criado_em)}
                </TableCell>
                <TableCell className="text-right font-semibold text-rose-400">
                  - {brl(d.valor)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remover(d)}
                      disabled={excluindoId === d.id}
                      className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      {excluindoId === d.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {despesas.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-800/50 bg-zinc-950/50 px-5 py-4 text-sm">
            <span className="text-zinc-400 font-medium uppercase tracking-wider text-xs">Total listado</span>
            <span className="font-bold text-rose-400 text-base">- {brl(totalListado)}</span>
          </div>
        )}
      </div>
    </div>
  );
}