// app/(app)/despesas/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  GestaoDespesas,
  type Despesa,
} from "@/components/gestao-despesas";

export const dynamic = "force-dynamic";

interface DespesaRow {
  id: string;
  descricao: string;
  valor: string | number;
  criado_em: string;
}

export default async function DespesasPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("despesas")
    .select("id,descricao,valor,criado_em")
    .order("criado_em", { ascending: false });

  // numeric vem como string -> normaliza
  const despesas: Despesa[] = ((data ?? []) as DespesaRow[]).map((d) => ({
    id: d.id,
    descricao: d.descricao,
    valor: Number(d.valor),
    criado_em: d.criado_em,
  }));

  return (
   <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
         <GestaoDespesas despesas={despesas} />
      </div>
   </div>
   );
}
