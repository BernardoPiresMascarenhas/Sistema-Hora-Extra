// lib/actions/taxas.ts
"use server";
 
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ConfiguracaoTaxa } from "@/types/Types";
 
const taxaSchema = z.object({
  metodo: z.enum(["Pix", "Crédito", "Débito"]),
  // 0 a 100; até 2 casas. Bloqueia valores absurdos (ex: 300%).
  percentual: z.number().min(0).max(100),
});
 
const salvarTaxasSchema = z.array(taxaSchema).min(1);
 
export type SalvarTaxasResult = { ok: true } | { ok: false; erro: string };
 
/**
 * Lê as taxas atuais. Pode ser chamada de um Server Component para
 * popular o estado inicial do modal de Configurações.
 */
export async function getTaxas(): Promise<ConfiguracaoTaxa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracoes_taxas")
    .select("metodo, percentual");
 
  if (error || !data) return [];
  // numeric vem como string -> normaliza
  return data.map((t: any) => ({
    metodo: t.metodo as ConfiguracaoTaxa["metodo"],
    percentual: Number(t.percentual),
  }));
}
 
/**
 * Salva as porcentagens editadas no modal. upsert pela PK (metodo).
 * As vendas JÁ registradas não mudam — elas guardam valor_taxa congelado.
 */
export async function salvarTaxas(
  taxas: ConfiguracaoTaxa[]
): Promise<SalvarTaxasResult> {
  const supabase = await createClient();
 
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Não autenticado." };
 
  const parsed = salvarTaxasSchema.safeParse(taxas);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
 
  const { error } = await supabase
    .from("configuracoes_taxas")
    .upsert(
      parsed.data.map((t) => ({ metodo: t.metodo, percentual: t.percentual })),
      { onConflict: "metodo" }
    );
 
  if (error) return { ok: false, erro: error.message };
 
  revalidatePath("/"); // dashboard usa as taxas em projeções
  return { ok: true };
}