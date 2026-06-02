// lib/actions/pdv.ts
"use server";
 
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MetodoPagamento } from "@/types/Types";
 
// Validação de entrada: Server Action é um endpoint público disfarçado.
const itemSchema = z.object({
  produto_id: z.string().uuid(),
  quantidade: z.number().int().positive(),
});
 
const finalizarVendaSchema = z.object({
  metodo: z.enum(["Pix", "Débito", "Crédito", "Dinheiro"]),
  itens: z.array(itemSchema).min(1, "Carrinho vazio."),
});
 
export type FinalizarVendaResult =
  | { ok: true; vendaId: string }
  | { ok: false; erro: string };
 
/**
 * Finaliza a venda chamando a RPC `finalizar_venda` (transação no Postgres):
 * insere em `vendas`, insere os `itens_venda`, abate o `estoque_atual` e
 * congela a taxa — tudo atômico. Se qualquer item falhar, nada é gravado.
 *
 * Enviamos SOMENTE produto_id + quantidade. Preço, custo, promoção e taxa
 * são recalculados no servidor (o cliente não consegue forjar valores).
 */
export async function finalizarVenda(
  metodo: MetodoPagamento,
  itens: { produto_id: string; quantidade: number }[]
): Promise<FinalizarVendaResult> {
  const supabase = await createClient();
 
  // ⚠️ Trava de autenticação removida a seu pedido.
  // Para re-proteger depois (recomendado), descomente:
  //
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return { ok: false, erro: "Não autenticado." };
 
  const parsed = finalizarVendaSchema.safeParse({ metodo, itens });
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
 
  const { data, error } = await supabase.rpc("finalizar_venda", {
    p_metodo: parsed.data.metodo,
    p_itens: parsed.data.itens,
  });
 
  if (error) {
    // error.message traz o RAISE da função (ex: "Estoque insuficiente para...")
    return { ok: false, erro: error.message };
  }
 
  revalidatePath("/dashboard"); 
  revalidatePath("/produtos");
 
  return { ok: true, vendaId: data as string };
}