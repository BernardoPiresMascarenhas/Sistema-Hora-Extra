"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { erro: "E-mail ou senha incorretos." };
  }

  // 🧹 Limpa o cache do Next.js inteiro para forçar a troca de layout
  revalidatePath("/", "layout");
  
  // 🚀 Redirecionamento inteligente!
  // Se for a conta do caixa, joga direto para a tela de vendas.
  if (email === "caixa@horaextra.com") {
    redirect("/pdv");
  }

  // Se for o dono (ou qualquer outro), vai pro painel financeiro.
  redirect("/dashboard");
}

// 🔍 Função nova: Busca o e-mail para a Sidebar esconder os menus
export async function getEmailUsuario() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email;
}

// 🚪 Função única para sair limpando o cache
export async function deslogar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // 🧹 Limpa o cache ao sair também para não vazar tela
  revalidatePath("/", "layout");
  redirect("/login");
}