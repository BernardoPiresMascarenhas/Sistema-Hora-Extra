// lib/actions/produtos.ts
"use server";
 
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
 
// Validação do produto. preco_promo já chega calculado (o form converte % -> R$).
const produtoSchema = z.object({
  id: z.string().uuid().optional(), // ausente = criar, presente = editar
  nome: z.string().trim().min(1, "Informe o nome."),
  custo_reposicao: z.number().min(0),
  preco_venda_normal: z.number().min(0),
  estoque_atual: z.number().int().min(0),
  estoque_minimo: z.number().int().min(0),
  is_promo: z.boolean(),
  qtd_minima_promo: z.number().int().min(0),
  preco_promo: z.number().min(0),
});
 
export type ProdutoInput = z.infer<typeof produtoSchema>;
export type ActionResult = { ok: true } | { ok: false; erro: string };
 
async function getSupabaseAutenticado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return supabase;
}
 
/**
 * Cria ou atualiza um produto.
 * - Sem id -> insert.
 * - Com id -> update.
 * Se a promo estiver desligada, zera os campos de promo por segurança.
 */
export async function salvarProduto(input: ProdutoInput): Promise<ActionResult> {
  // Inicializando a conexão com o banco sem pedir senha:
  const supabase = await createClient();
 
  const parsed = produtoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
 
  const { id, ...dados } = parsed.data;
 
  // Coerência: promo desligada não guarda lixo nos campos de promo.
  if (!dados.is_promo) {
    dados.qtd_minima_promo = 0;
    dados.preco_promo = 0;
  }
 
  const { error } = id
    ? await supabase.from("produtos").update(dados).eq("id", id)
    : await supabase.from("produtos").insert(dados);
 
  if (error) return { ok: false, erro: error.message };
 
  revalidatePath("/produtos");
  revalidatePath("/pdv"); // a grade do PDV mostra estes produtos
  return { ok: true };
}
 
/**
 * Exclui um produto.
 * O banco bloqueia (FK restrict) se já houver vendas. Capturamos o código
 * 23503 (foreign_key_violation) e devolvemos uma mensagem amigável.
 */
export async function excluirProduto(id: string): Promise<ActionResult> {
  // Inicializando a conexão com o banco aqui também:
  const supabase = await createClient();
 
  const { error } = await supabase.from("produtos").delete().eq("id", id);
 
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        erro: "Este produto já tem vendas registradas e não pode ser excluído (o histórico seria perdido).",
      };
    }
    return { ok: false, erro: error.message };
  }
 
  revalidatePath("/produtos");
  revalidatePath("/pdv");
  return { ok: true };
}