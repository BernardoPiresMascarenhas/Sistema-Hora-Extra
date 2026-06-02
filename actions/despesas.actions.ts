// lib/actions/despesas.ts
"use server";
 
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
 
const despesaSchema = z.object({
  descricao: z.string().trim().min(1, "Informe a descrição."),
  valor: z.number().positive("O valor deve ser maior que zero."),
});
 
export type ActionResult = { ok: true } | { ok: false; erro: string };
 
/** Registra uma nova saída/despesa operacional. */
export async function registrarDespesa(
  descricao: string,
  valor: number
): Promise<ActionResult> {
  const supabase = await createClient();
 
  const parsed = despesaSchema.safeParse({ descricao, valor });
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
 
  const { error } = await supabase.from("despesas").insert(parsed.data);
  if (error) return { ok: false, erro: error.message };
 
  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  return { ok: true };
}
 
/** Exclui uma despesa pelo id. */
export async function excluirDespesa(id: string): Promise<ActionResult> {
  const supabase = await createClient();
 
  const { error } = await supabase.from("despesas").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };
 
  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  return { ok: true };
}
