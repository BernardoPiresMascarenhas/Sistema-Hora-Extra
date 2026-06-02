import { createClient } from "@/lib/supabase/server";
import { PackageOpen, Repeat2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FiltroData } from "@/components/dashboard/filtro-data"; 

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ymdSP(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

interface ItemReposicao {
  nome: string;
  quantidadeVendida: number;
  custoTotal: number;
}

// Usamos 'props: any' para evitar conflitos de tipagem entre versões do Next
export default async function ReposicaoPage(props: any) {
  const supabase = await createClient();

  // O SEGREDO ESTÁ AQUI: Extraímos e esperamos os parâmetros da URL
  const searchParams = await props.searchParams;

  const agora = new Date();
  const hojeStr = ymdSP(agora);
  
  const inicioFiltro = searchParams?.inicio ? new Date(`${searchParams.inicio}T00:00:00-03:00`) : new Date(`${hojeStr}T00:00:00-03:00`);
  const fimFiltro = searchParams?.fim ? new Date(`${searchParams.fim}T23:59:59-03:00`) : new Date(`${hojeStr}T23:59:59-03:00`);

  const { data: itensRaw, error } = await supabase
    .from("itens_venda")
    .select(`
      quantidade,
      custo_unitario_vendido,
      produtos (nome),
      vendas!inner (criado_em)
    `)
    .gte("vendas.criado_em", inicioFiltro.toISOString())
    .lte("vendas.criado_em", fimFiltro.toISOString());

  const mapaReposicao = new Map<string, ItemReposicao>();
  let custoTotalGeral = 0;

  if (itensRaw) {
    for (const row of itensRaw as any[]) {
      const nomeProduto = row.produtos?.nome || "Produto Excluído";
      const qtd = Number(row.quantidade);
      const custoLinha = qtd * Number(row.custo_unitario_vendido);

      if (mapaReposicao.has(nomeProduto)) {
        const item = mapaReposicao.get(nomeProduto)!;
        item.quantidadeVendida += qtd;
        item.custoTotal += custoLinha;
      } else {
        mapaReposicao.set(nomeProduto, {
          nome: nomeProduto,
          quantidadeVendida: qtd,
          custoTotal: custoLinha,
        });
      }
      custoTotalGeral += custoLinha;
    }
  }

  const listaCompras = Array.from(mapaReposicao.values()).sort((a, b) => b.custoTotal - a.custoTotal);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Repeat2 className="text-orange-500" size={24} />
            Lista de Reposição
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Itens que saíram no período e o valor reservado para repor.
          </p>
        </div>
        <FiltroData />
      </div>

      <Card className="border-orange-900/50 bg-orange-950/20 p-5 rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-500/80 mb-1">
            Total a ser Recomprado
          </h3>
          <p className="text-3xl font-bold text-orange-400">{brl(custoTotalGeral)}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
          <PackageOpen size={24} className="text-orange-500" />
        </div>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
        {listaCompras.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-3">
            <Info size={24} className="text-zinc-600" />
            <p>Nenhum produto foi vendido neste período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium text-center">Unidades Saídas</th>
                  <th className="px-6 py-4 font-medium text-right">Custo de Reposição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {listaCompras.map((item) => (
                  <tr key={item.nome} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-100">{item.nome}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-300 font-bold">
                        {item.quantidadeVendida}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-orange-400/90">
                      {brl(item.custoTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}