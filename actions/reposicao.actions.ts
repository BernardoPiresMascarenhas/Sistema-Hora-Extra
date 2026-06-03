// actions/reposicao.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResponse = { ok: true } | { ok: false; erro: string };

export async function marcarItemComoReposto(
  produtoId: string,
  inicioStr: string,
  fimStr: string
): Promise<ActionResponse> {
  const supabase = await createClient();

  const inicioDate = new Date(`${inicioStr}T00:00:00-03:00`);
  const fimDate = new Date(`${fimStr}T23:59:59-03:00`);

  // 1. Pega os IDs das vendas desse período
  const { data: vendas } = await supabase
    .from("vendas")
    .select("id")
    .gte("criado_em", inicioDate.toISOString())
    .lte("criado_em", fimDate.toISOString());

  if (!vendas || vendas.length === 0) return { ok: true };

  const vendaIds = vendas.map((v) => v.id);

  // 2. Atualiza APENAS o produto específico dentro dessas vendas
  const { error } = await supabase
    .from("itens_venda")
    .update({ reposto: true })
    .eq("produto_id", produtoId) // <--- Garante que só afeta a Heineken, por exemplo
    .in("venda_id", vendaIds)
    .eq("reposto", false);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/reposicao");
  
  return { ok: true };
}