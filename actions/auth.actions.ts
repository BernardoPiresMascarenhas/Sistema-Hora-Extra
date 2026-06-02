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
  
  // Redireciona para o painel
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // 🧹 Limpa o cache ao sair também
  revalidatePath("/", "layout");
  redirect("/login");
}