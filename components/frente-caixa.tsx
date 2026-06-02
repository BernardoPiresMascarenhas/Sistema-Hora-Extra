"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { finalizarVenda } from "@/actions/pdv.actions";
import type { Produto, MetodoPagamento, ItemCarrinho } from "@/types/Types";

const METODOS: MetodoPagamento[] = ["Pix", "Débito", "Crédito", "Dinheiro"];
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function precoUnitario(produto: Produto, quantidade: number): number {
  if (produto.is_promo && quantidade >= produto.qtd_minima_promo) {
    return produto.preco_promo;
  }
  return produto.preco_venda_normal;
}

interface Props {
  produtos: Produto[];
}

export function FrenteCaixa({ produtos }: Props) {
  const router = useRouter();
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState(""); // <--- Novo state da barra de pesquisa
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null
  );

  // ---- Filtro de Produtos ----
  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return produtos;
    const termo = busca.toLowerCase();
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo));
  }, [produtos, busca]);

  // ---- Carrinho ----
  function adicionar(produto: Produto) {
    setMsg(null);
    setCarrinho((atual) => {
      const existe = atual.find((i) => i.produto.id === produto.id);
      if (existe) {
        return atual.map((i) =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...atual, { produto, quantidade: 1 }];
    });
  }

  function alterarQtd(produtoId: string, delta: number) {
    setCarrinho((atual) =>
      atual
        .map((i) =>
          i.produto.id === produtoId
            ? { ...i, quantidade: i.quantidade + delta }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  }

  function remover(produtoId: string) {
    setCarrinho((atual) => atual.filter((i) => i.produto.id !== produtoId));
  }

  // ---- Total recalculado a cada mudança ----
  const total = useMemo(
    () =>
      carrinho.reduce(
        (acc, item) =>
          acc + precoUnitario(item.produto, item.quantidade) * item.quantidade,
        0
      ),
    [carrinho]
  );

  // ---- Finalizar ----
  async function finalizar() {
    if (!metodo || carrinho.length === 0 || enviando) return;
    setEnviando(true);
    setMsg(null);

    const itens = carrinho.map((i) => ({
      produto_id: i.produto.id,
      quantidade: i.quantidade,
    }));

    const res = await finalizarVenda(metodo, itens);
    setEnviando(false);

    if (res.ok) {
      setCarrinho([]);
      setMetodo(null);
      setBusca(""); // Limpa a busca após a venda
      setMsg({ tipo: "ok", texto: "Venda registrada com sucesso ✓" });
      router.refresh(); 
    } else {
      setMsg({ tipo: "erro", texto: res.erro });
    }
  }

  return (
    <div className="grid h-[calc(100vh-2rem)] grid-cols-1 gap-5 lg:grid-cols-3">
      {/* ================= LADO ESQUERDO: GRADE DE PRODUTOS ================= */}
      <div className="lg:col-span-2 flex flex-col">
        {/* Cabeçalho com Pesquisa */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-zinc-100">Frente de Caixa</h1>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <Input
              type="text"
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 h-10 bg-zinc-950/50 border-zinc-800/60 text-zinc-200 focus-visible:ring-emerald-500 shadow-sm"
            />
          </div>
        </div>

        {/* Grade de Produtos */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 overflow-y-auto pb-4 custom-scrollbar">
          {produtosFiltrados.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-zinc-500">
              Nenhum produto encontrado para "{busca}".
            </div>
          ) : (
            produtosFiltrados.map((p) => {
              const semEstoque = p.estoque_atual <= 0;
              return (
                <button
                  key={p.id}
                  disabled={semEstoque}
                  onClick={() => adicionar(p)}
                  className="group relative flex flex-col items-start rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-4 text-left transition-all hover:border-emerald-500/50 hover:bg-zinc-900/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                >
                  {p.is_promo && (
                    <span className="absolute right-2 top-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {p.qtd_minima_promo}+ {brl(p.preco_promo)}
                    </span>
                  )}
                  <span className="line-clamp-2 text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                    {p.nome}
                  </span>
                  <span className="mt-1.5 font-semibold text-emerald-400">
                    {brl(p.preco_venda_normal)}
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    {semEstoque ? "Sem estoque" : `Estoque: ${p.estoque_atual}`}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ================= LADO DIREITO: RESUMO DA VENDA ================= */}
      <Card className="flex flex-col border-zinc-800/50 bg-zinc-950/80 p-5 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2 text-zinc-100">
          <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-500">
            <ShoppingCart size={18} />
          </div>
          <h2 className="font-semibold text-lg">Resumo da Venda</h2>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
          {carrinho.length === 0 && (
            <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-zinc-500">
              <ShoppingCart size={32} className="mb-3 opacity-20" />
              <p>O carrinho está vazio.<br/>Toque nos produtos para adicionar.</p>
            </div>
          )}

          {carrinho.map((item) => {
            const unit = precoUnitario(item.produto, item.quantidade);
            const emPromo =
              item.produto.is_promo &&
              item.quantidade >= item.produto.qtd_minima_promo;
            return (
              <div
                key={item.produto.id}
                className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {item.produto.nome}
                  </span>
                  <button
                    onClick={() => remover(item.produto.id)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                    aria-label="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
                    <button
                      onClick={() => alterarQtd(item.produto.id, -1)}
                      className="rounded bg-zinc-900 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      aria-label="Diminuir"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-zinc-200">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => alterarQtd(item.produto.id, 1)}
                      className="rounded bg-zinc-900 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      aria-label="Aumentar"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-emerald-400">
                      {brl(unit * item.quantidade)}
                    </p>
                    {emPromo && (
                      <p className="text-[10px] font-semibold text-emerald-500/80">
                        promo aplicada ({brl(unit)}/un)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- Total + Pagamento ---- */}
        <div className="mt-5 border-t border-zinc-800/60 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Subtotal</span>
            <span className="text-3xl font-black text-emerald-400 tracking-tight">
              {brl(total)}
            </span>
          </div>

          <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Método de pagamento
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            {METODOS.map((m) => (
              <button
                key={m}
                onClick={() => setMetodo(m)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200 ${
                  metodo === m
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {msg && (
            <p
              className={`mb-3 text-center text-sm font-medium ${
                msg.tipo === "ok" ? "text-emerald-500" : "text-rose-400"
              }`}
            >
              {msg.texto}
            </p>
          )}

          <Button
            onClick={finalizar}
            disabled={!metodo || carrinho.length === 0 || enviando}
            className="h-14 w-full text-base font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 transition-colors rounded-xl shadow-lg shadow-emerald-500/20"
          >
            {enviando ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              `Cobrar ${brl(total)}`
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}