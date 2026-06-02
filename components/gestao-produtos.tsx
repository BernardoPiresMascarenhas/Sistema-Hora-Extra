"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Loader2, Tag, Box } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { salvarProduto, excluirProduto } from "@/actions/produtos.actions";
import type { Produto } from "@/types/Types";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface FormState {
  id?: string;
  nome: string;
  custo_reposicao: string;
  preco_venda_normal: string;
  estoque_atual: string;
  estoque_minimo: string;
  is_promo: boolean;
  qtd_minima_promo: string;
  percentual_desconto: string; 
}

const FORM_VAZIO: FormState = {
  nome: "",
  custo_reposicao: "",
  preco_venda_normal: "",
  estoque_atual: "",
  estoque_minimo: "",
  is_promo: false,
  qtd_minima_promo: "",
  percentual_desconto: "",
};

const num = (s: string) => Number(s.replace(",", ".")) || 0;

function produtoParaForm(p: Produto): FormState {
  const pct =
    p.is_promo && p.preco_venda_normal > 0
      ? Math.round((1 - p.preco_promo / p.preco_venda_normal) * 10000) / 100
      : 0;
  return {
    id: p.id,
    nome: p.nome,
    custo_reposicao: String(p.custo_reposicao),
    preco_venda_normal: String(p.preco_venda_normal),
    estoque_atual: String(p.estoque_atual),
    estoque_minimo: String(p.estoque_minimo),
    is_promo: p.is_promo,
    qtd_minima_promo: String(p.qtd_minima_promo),
    percentual_desconto: pct ? String(pct) : "",
  };
}

interface Props {
  produtos: Produto[];
}

export function GestaoProdutos({ produtos }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setErro(null);
    setAberto(true);
  }

  function abrirEdicao(p: Produto) {
    setForm(produtoParaForm(p));
    setErro(null);
    setAberto(true);
  }

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  const precoPromoPreview = useMemo(() => {
    const normal = num(form.preco_venda_normal);
    const pct = num(form.percentual_desconto);
    return Math.max(0, normal * (1 - pct / 100));
  }, [form.preco_venda_normal, form.percentual_desconto]);

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);

    const res = await salvarProduto({
      id: form.id,
      nome: form.nome,
      custo_reposicao: num(form.custo_reposicao),
      preco_venda_normal: num(form.preco_venda_normal),
      estoque_atual: Math.trunc(num(form.estoque_atual)),
      estoque_minimo: Math.trunc(num(form.estoque_minimo)),
      is_promo: form.is_promo,
      qtd_minima_promo: form.is_promo
        ? Math.trunc(num(form.qtd_minima_promo))
        : 0,
      preco_promo: form.is_promo ? precoPromoPreview : 0,
    });

    setSalvando(false);

    if (res.ok) {
      setAberto(false);
      router.refresh(); 
    } else {
      setErro(res.erro);
    }
  }

  async function handleExcluir(p: Produto) {
    if (!window.confirm(`Excluir "${p.nome}"? Esta ação não pode ser desfeita.`))
      return;
    setExcluindoId(p.id);
    const res = await excluirProduto(p.id);
    setExcluindoId(null);
    if (res.ok) router.refresh();
    else window.alert(res.erro); 
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Box className="text-blue-500" size={24} />
          Estoque e Produtos
        </h1>
        <Button
          onClick={abrirNovo}
          className="bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 rounded-xl"
        >
          <Plus size={18} className="mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* ---------- TABELA ---------- */}
      <div className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950/80 shadow-sm backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/50 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-medium">Produto</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">Custo</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">Preço</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">Estoque</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.length === 0 && (
              <TableRow className="border-zinc-800/50 hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                  <Box className="mx-auto mb-3 opacity-20" size={32} />
                  Nenhum produto cadastrado no sistema.
                </TableCell>
              </TableRow>
            )}

            {produtos.map((p) => {
              const baixo = p.estoque_atual <= p.estoque_minimo;
              return (
                <TableRow key={p.id} className="border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="font-medium text-zinc-200">{p.nome}</span>
                      {p.is_promo && (
                        <span className="flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                          <Tag size={10} /> {p.qtd_minima_promo}+ {brl(p.preco_promo)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-zinc-400">
                    {brl(p.custo_reposicao)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-zinc-200">
                    {brl(p.preco_venda_normal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${baixo ? "text-rose-400" : "text-zinc-300"}`}>
                      {p.estoque_atual}
                    </span>
                    <span className="text-zinc-600 text-xs ml-1">/ {p.estoque_minimo}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => abrirEdicao(p)}
                        className="text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleExcluir(p)}
                        disabled={excluindoId === p.id}
                        className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        {excluindoId === p.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ---------- SHEET: CRIAR / EDITAR ---------- */}
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent className="w-full sm:max-w-md border-l border-zinc-800 bg-zinc-950 p-6 text-zinc-100 overflow-y-auto custom-scrollbar">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Box className="text-blue-500" size={20} />
              {form.id ? "Editar Produto" : "Novo Produto"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-8 space-y-5">
            <Campo label="Nome do Produto">
              <Input
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                className="border-zinc-800 bg-zinc-900 focus-visible:ring-blue-500"
                placeholder="Ex: Espeto de Frango"
              />
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Custo Unitário (R$)">
                <Input
                  inputMode="decimal"
                  value={form.custo_reposicao}
                  onChange={(e) => set("custo_reposicao", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 focus-visible:ring-blue-500"
                  placeholder="0,00"
                />
              </Campo>
              <Campo label="Preço de Venda (R$)">
                <Input
                  inputMode="decimal"
                  value={form.preco_venda_normal}
                  onChange={(e) => set("preco_venda_normal", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 focus-visible:ring-blue-500 text-emerald-400 font-medium"
                  placeholder="0,00"
                />
              </Campo>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Estoque Atual">
                <Input
                  inputMode="numeric"
                  value={form.estoque_atual}
                  onChange={(e) => set("estoque_atual", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 focus-visible:ring-blue-500"
                  placeholder="0"
                />
              </Campo>
              <Campo label="Estoque Mínimo (Alerta)">
                <Input
                  inputMode="numeric"
                  value={form.estoque_minimo}
                  onChange={(e) => set("estoque_minimo", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 focus-visible:ring-blue-500"
                  placeholder="0"
                />
              </Campo>
            </div>

            {/* ---------- REGRA DE PROMOÇÃO ---------- */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5 mt-2">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={form.is_promo}
                  onCheckedChange={(c) => set("is_promo", c === true)}
                  className="border-zinc-600 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                />
                <span className="text-sm font-medium text-zinc-200">
                  Ativar Promoção por Volume (Atacado)
                </span>
              </label>

              {form.is_promo && (
                <div className="mt-5 space-y-4 border-t border-zinc-800/60 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Campo label="Quantidade Mínima">
                      <Input
                        inputMode="numeric"
                        value={form.qtd_minima_promo}
                        onChange={(e) => set("qtd_minima_promo", e.target.value)}
                        className="border-zinc-800 bg-zinc-950 focus-visible:ring-blue-500"
                        placeholder="Ex: 5"
                      />
                    </Campo>
                    <Campo label="Desconto (%)">
                      <Input
                        inputMode="decimal"
                        value={form.percentual_desconto}
                        onChange={(e) =>
                          set("percentual_desconto", e.target.value)
                        }
                        className="border-zinc-800 bg-zinc-950 focus-visible:ring-blue-500"
                        placeholder="Ex: 15"
                      />
                    </Campo>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
                    <p className="text-xs text-blue-300/80 leading-relaxed">
                      Comprando <span className="font-bold text-blue-400">{num(form.qtd_minima_promo) || "?"}</span> unidades ou mais, 
                      o sistema cobrará <span className="font-bold text-blue-400">{brl(precoPromoPreview)}</span> por cada espeto.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {erro && <p className="text-sm font-medium text-rose-400 mt-2">{erro}</p>}

            <Button
              onClick={handleSalvar}
              disabled={salvando}
              className="w-full h-12 mt-6 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
            >
              {salvando ? <Loader2 className="animate-spin" size={20} /> : "Salvar Produto"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <Label className="text-[13px] font-medium text-zinc-400 ml-1">{label}</Label>
      {children}
    </div>
  );
}