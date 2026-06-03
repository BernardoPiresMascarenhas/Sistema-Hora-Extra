// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getTaxas } from "@/actions/Taxas.actions";
import { Dashboard, type DashboardData } from "@/components/dashboard";
import type { MetodoPagamento } from "@/types/Types";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const round2 = (v: number) => Math.round(v * 100) / 100;

function ymdSP(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function rotuloDia(d: Date): string {
  const diaNum = String(d.getDate()).padStart(2, '0');
  const mesNum = String(d.getMonth() + 1).padStart(2, '0');
  return `${diaNum}/${mesNum}`;
}

interface VendaRow {
  criado_em: string;
  total_bruto: string | number;
  lucro_liquido: string | number;
  valor_taxa: string | number;
  metodo_pagamento: MetodoPagamento;
}

interface ProdutoRow {
  id: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
}

interface DespesaRow {
  criado_em: string;
  valor: string | number;
}

export default async function DashboardPage(props: any) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;

  const agora = new Date();
  const hojeStr = ymdSP(agora);
  const [ano, mes] = hojeStr.split("-");
  const inicioHoje = new Date(`${hojeStr}T00:00:00-03:00`);
  const inicioMes = new Date(`${ano}-${mes}-01T00:00:00-03:00`);

  const trintaDiasAtras = new Date(agora.getTime() - 29 * 86_400_000);
  const inicioStr = searchParams?.inicio || ymdSP(trintaDiasAtras);
  const fimStr = searchParams?.fim || hojeStr;

  const diasGrafico: { chave: string; dia: string }[] = [];
  let cursor = new Date(`${inicioStr}T12:00:00-03:00`);
  const fimCursor = new Date(`${fimStr}T12:00:00-03:00`);
  while (cursor <= fimCursor) {
    diasGrafico.push({ chave: ymdSP(cursor), dia: rotuloDia(cursor) });
    cursor.setDate(cursor.getDate() + 1);
  }

  const inicioFiltroDate = new Date(`${inicioStr}T00:00:00-03:00`);
  const fimFiltroDate = new Date(`${fimStr}T23:59:59-03:00`);
  const desde = inicioMes < inicioFiltroDate ? inicioMes : inicioFiltroDate;

  // Adicionamos a busca paralela de itens pendentes de reposição
  const [
    { data: vendasRaw },
    { data: produtosRaw },
    { data: despesasRaw },
    { data: itensReporRaw }, // <--- Nova Query!
    taxasIniciais,
  ] = await Promise.all([
    supabase
      .from("vendas")
      .select("criado_em,total_bruto,lucro_liquido,valor_taxa,metodo_pagamento")
      .gte("criado_em", desde.toISOString())
      .lte("criado_em", fimFiltroDate.toISOString()),
    supabase.from("produtos").select("id,nome,estoque_atual,estoque_minimo"),
    supabase
      .from("despesas")
      .select("criado_em,valor")
      .gte("criado_em", desde.toISOString())
      .lte("criado_em", fimFiltroDate.toISOString()),
    supabase
      .from("itens_venda")
      .select("quantidade, custo_unitario_vendido, vendas!inner(criado_em)")
      .eq("reposto", false) // Busca apenas o que não foi apagado/reposto
      .gte("vendas.criado_em", desde.toISOString())
      .lte("vendas.criado_em", fimFiltroDate.toISOString()),
    getTaxas(),
  ]);

  const vendas = ((vendasRaw ?? []) as VendaRow[]).map((v) => ({
    quando: new Date(v.criado_em),
    diaSP: ymdSP(new Date(v.criado_em)),
    total_bruto: Number(v.total_bruto),
    lucro_liquido: Number(v.lucro_liquido),
    valor_taxa: Number(v.valor_taxa),
    metodo: v.metodo_pagamento,
  }));

  const despesas = ((despesasRaw ?? []) as DespesaRow[]).map((d) => ({
    quando: new Date(d.criado_em),
    diaSP: ymdSP(new Date(d.criado_em)),
    valor: Number(d.valor),
  }));

  let faturamentoHoje = 0;
  let lucroVendasHoje = 0; 
  let faturamentoMes = 0;
  let lucroVendasMes = 0;
  let taxasPeriodo = 0; 
  
  const porMetodo: Record<string, number> = {};
  const lucroPorDia: Record<string, number> = Object.fromEntries(diasGrafico.map((d) => [d.chave, 0]));

  for (const v of vendas) {
    if (v.quando >= inicioMes) {
      faturamentoMes += v.total_bruto;
      lucroVendasMes += v.lucro_liquido;
    }
    if (v.quando >= inicioHoje) {
      faturamentoHoje += v.total_bruto;
      lucroVendasHoje += v.lucro_liquido;
    }
    if (v.diaSP >= inicioStr && v.diaSP <= fimStr) {
      if (v.diaSP in lucroPorDia) {
        lucroPorDia[v.diaSP] += v.lucro_liquido;
      }
      porMetodo[v.metodo] = (porMetodo[v.metodo] ?? 0) + v.total_bruto;
      taxasPeriodo += v.valor_taxa; 
    }
  }

  // CALCULO DINÂMICO DOS CARDS DE REPOSIÇÃO (Obedece ao botão de Apagar/Zerar)
  let custoReposicaoHoje = 0;
  let custoReposicaoMes = 0;

  if (itensReporRaw) {
    for (const item of itensReporRaw as any[]) {
      const quandoItem = new Date(item.vendas.criado_em);
      const custoTotalItem = Number(item.quantidade) * Number(item.custo_unitario_vendido);

      if (quandoItem >= inicioMes) {
        custoReposicaoMes += custoTotalItem;
      }
      if (quandoItem >= inicioHoje) {
        custoReposicaoHoje += custoTotalItem;
      }
    }
  }

  let despesasMesContador = 0;
  for (const d of despesas) {
    if (d.quando >= inicioMes) despesasMesContador += d.valor;
  }

  const lucroRealHoje = lucroVendasHoje; 
  const lucroRealMes = lucroVendasMes - despesasMesContador;

  const produtosBaixos = ((produtosRaw ?? []) as ProdutoRow[]).filter(
    (p) => p.estoque_atual <= p.estoque_minimo
  );

  const dados: DashboardData = {
    produtosBaixos,
    faturamentoHoje: round2(faturamentoHoje),
    lucroHoje: round2(lucroRealHoje),
    custoReposicaoHoje: round2(custoReposicaoHoje),
    faturamentoMes: round2(faturamentoMes),
    lucroMes: round2(lucroRealMes),
    custoReposicaoMes: round2(custoReposicaoMes),
    taxasPeriodo: round2(taxasPeriodo),
    despesasMes: round2(despesasMesContador),
    lucro7dias: diasGrafico.map((d) => ({
      dia: d.dia,
      lucro: round2((lucroPorDia[d.chave] || 0)),
    })),
    vendasPorMetodo: (["Pix", "Débito", "Crédito", "Dinheiro"] as const)
      .map((m) => ({ metodo: m, valor: round2(porMetodo[m] ?? 0) }))
      .filter((x) => x.valor > 0),
  };

  return (
    <div className="p-4">
      <Dashboard data={dados} taxasIniciais={taxasIniciais} />
    </div>
  );
}