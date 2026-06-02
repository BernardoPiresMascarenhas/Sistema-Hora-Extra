"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Receipt,
  Wallet,
  PackageOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ModalTaxas } from "@/components/modal-taxas";
import { FiltroData } from "@/components/dashboard/filtro-data"; 
import type { ConfiguracaoTaxa } from "@/types/Types";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CORES_METODO: Record<string, string> = {
  Pix: "#10b981",      
  Crédito: "#3b82f6",  
  Débito: "#8b5cf6",   
  Dinheiro: "#f59e0b"
};

export interface DashboardData {
  produtosBaixos: {
    id: string;
    nome: string;
    estoque_atual: number;
    estoque_minimo: number;
  }[];
  faturamentoHoje: number;
  lucroHoje: number; 
  faturamentoMes: number;
  lucroMes: number; 
  taxasPeriodo: number; // <--- Renomeado aqui
  despesasMes: number;
  lucro7dias: { dia: string; lucro: number }[];
  vendasPorMetodo: { metodo: string; valor: number }[];
  custoReposicaoHoje: number;
  custoReposicaoMes: number;
}

interface DashboardProps {
  data: DashboardData;
  taxasIniciais: ConfiguracaoTaxa[];
}

function CardResumo({
  titulo,
  valor,
  subtitulo,
  cor = "neutro",
  icone,
}: {
  titulo: string;
  valor: number;
  subtitulo?: string;
  cor?: "neutro" | "azul" | "verde" | "vermelho" | "laranja";
  icone: React.ReactNode;
}) {
  const estilos = {
    neutro: { texto: "text-zinc-100", icone: "text-zinc-400", bg: "bg-zinc-800/20 border-zinc-800" },
    azul: { texto: "text-blue-400", icone: "text-blue-400", bg: "bg-blue-950/30 border-blue-900/50" },
    verde: { texto: "text-emerald-400", icone: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/50" },
    vermelho: { texto: "text-rose-400", icone: "text-rose-400", bg: "bg-rose-950/30 border-rose-900/50" },
    laranja: { texto: "text-orange-400", icone: "text-orange-400", bg: "bg-orange-950/30 border-orange-900/50" },
  };

  const selecionado = estilos[cor];

  return (
    <Card className={`p-4 border ${selecionado.bg} transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">{titulo}</span>
        <div className={`p-2 rounded-lg bg-zinc-950/50 ${selecionado.icone}`}>
          {icone}
        </div>
      </div>
      <p className={`mt-3 text-2xl font-bold ${selecionado.texto}`}>{brl(valor)}</p>
      {subtitulo && <p className="mt-1 text-xs text-zinc-500">{subtitulo}</p>}
    </Card>
  );
}

export function Dashboard({ data, taxasIniciais }: DashboardProps) {
  const {
    produtosBaixos,
    faturamentoHoje,
    lucroHoje,
    custoReposicaoHoje,
    faturamentoMes,
    lucroMes,
    custoReposicaoMes,
    taxasPeriodo, // <--- Destruturando a variável nova
    despesasMes,
    lucro7dias,
    vendasPorMetodo,
  } = data;

  return (
    <div className="space-y-6">
      {/* ---------- CABEÇALHO ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-zinc-100">Painel Financeiro</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <FiltroData />
          <ModalTaxas taxasIniciais={taxasIniciais} />
        </div>
      </div>

      {/* ---------- ALERTAS DE ESTOQUE ---------- */}
      {produtosBaixos.length > 0 && (
        <Card className="border-yellow-600/40 bg-yellow-600/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-yellow-500">
            <AlertTriangle size={18} />
            <h2 className="font-semibold">Reposição necessária</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {produtosBaixos.map((p) => (
              <span
                key={p.id}
                className="rounded-lg border border-yellow-600/40 bg-zinc-950 px-3 py-1.5 text-sm shadow-sm"
              >
                <span className="text-zinc-100">{p.nome}</span>{" "}
                <span className="font-bold text-yellow-500">
                  {p.estoque_atual}/{p.estoque_minimo}
                </span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ---------- BLOCO: HOJE ---------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Resumo de Hoje</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <CardResumo
            titulo="Faturamento"
            valor={faturamentoHoje}
            cor="azul"
            icone={<DollarSign size={18} />}
          />
          <CardResumo
            titulo="Lucro Real"
            valor={lucroHoje}
            cor="verde"
            icone={<TrendingUp size={18} />}
          />
          <CardResumo
            titulo="Repor Estoque"
            valor={custoReposicaoHoje}
            subtitulo="Separar no fechamento do caixa"
            cor="laranja"
            icone={<PackageOpen size={18} />}
          />
        </div>
      </section>

      {/* ---------- BLOCO: MÊS ---------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Acumulado do Mês</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <CardResumo
            titulo="Faturamento"
            valor={faturamentoMes}
            cor="azul"
            icone={<DollarSign size={18} />}
          />
          <CardResumo
            titulo="Lucro Real"
            valor={lucroMes}
            cor="verde"
            icone={<TrendingUp size={18} />}
          />
          <CardResumo
            titulo="CMV Total"
            valor={custoReposicaoMes}
            subtitulo="Custo de Mercadoria Vendida"
            cor="laranja"
            icone={<PackageOpen size={18} />}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-1">
          <CardResumo
            titulo="Taxas de Maquininha (Período)" 
            valor={taxasPeriodo}
            subtitulo="Baseado nas datas do filtro acima"
            cor="vermelho"
            icone={<Receipt size={18} />}
          />
          <CardResumo
            titulo="Despesas Adicionais"
            valor={despesasMes}
            cor="vermelho"
            icone={<Wallet size={18} />}
          />
        </div>
      </section>

      {/* ---------- GRÁFICOS ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 pt-2">
        <Card className="border-zinc-800 bg-zinc-950 p-5 lg:col-span-2 shadow-sm">
          <h2 className="mb-6 font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={18} />
            Lucro Líquido — Período Selecionado
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={lucro7dias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="dia" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip
                cursor={{ fill: "#ffffff05" }}
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  color: "#fafafa",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.5)",
                }}
                formatter={(v: any) => [brl(Number(v)), "Lucro"]}
              />
              <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} minPointSize={2} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950 p-5 shadow-sm">
          <h2 className="mb-6 font-semibold text-zinc-100 flex items-center gap-2">
            <Wallet className="text-blue-500" size={18} />
            Vendas por Pagamento
          </h2>
          {vendasPorMetodo.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-zinc-600">
              Sem vendas neste período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={vendasPorMetodo}
                  dataKey="valor"
                  nameKey="metodo"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  stroke="none"
                >
                  {vendasPorMetodo.map((entry) => (
                    <Cell key={entry.metodo} fill={CORES_METODO[entry.metodo]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 8,
                    color: "#fafafa",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.5)",
                  }}
                  formatter={(v: any) => brl(Number(v))}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 13, color: "#e4e4e7" }} 
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}