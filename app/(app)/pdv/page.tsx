// app/pdv/page.tsx
import { createClient } from "@/lib/supabase/server";
import { FrenteCaixa } from "@/components/frente-caixa";
import type { Produto } from "@/types/Types";

// Server Component: busca os produtos e entrega prontos para a grade.
// Após cada venda, router.refresh() no client refaz este fetch (estoque novo).
export default async function PdvPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("produtos")
    .select("*")
    .order("nome", { ascending: true });

  const produtos = (data ?? []) as Produto[];

  return (
    <div className="p-4">
      <FrenteCaixa produtos={produtos} />
    </div>
  );
}
