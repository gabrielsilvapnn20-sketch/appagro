"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe email e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email ou senha inválidos." };
  }

  // registra o último acesso (usado no painel super_admin — etapa 4)
  if (data.user) {
    await supabase
      .from("users")
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const nome = String(formData.get("nome") || "").trim();
  const orgNome = String(formData.get("org_nome") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!nome || !orgNome || !email || !password) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // lidos pelo trigger handle_new_user() para criar a organização
      data: { nome, org_nome: orgNome },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "Já existe uma conta com esse email." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // Confirmação de email desligada -> sessão criada na hora, entra direto.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  // Confirmação de email ligada -> aguardar o clique no link enviado.
  return {
    message:
      "Conta criada. Enviamos um link de confirmação para o seu email — confirme para entrar.",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
