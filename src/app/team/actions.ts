"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Member } from "@/lib/domain";

export type InviteResult = {
  error?: string;
  tempPassword?: string;
  member?: Member;
};

function genPassword(): string {
  return "Sulco" + Math.random().toString(36).slice(2, 8) + "!" + Math.floor(Math.random() * 90 + 10);
}

/**
 * Adiciona um RTV à organização do dono. Cria o usuário de autenticação com
 * a service role (metadata invited=true, então o trigger não cria outra
 * organização) e insere o perfil na organização do dono. Retorna uma senha
 * temporária para o dono compartilhar.
 */
export async function inviteRtv(
  nome: string,
  email: string
): Promise<InviteResult> {
  nome = nome.trim();
  email = email.trim().toLowerCase();
  if (!nome || !email) return { error: "Preencha nome e email." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase
    .from("users")
    .select("organization_id, papel")
    .eq("id", user.id)
    .maybeSingle();
  if (!me) return { error: "Perfil não encontrado." };
  if (me.papel !== "dono")
    return { error: "Apenas o dono pode adicionar RTVs." };

  const admin = createAdminClient();
  if (!admin)
    return {
      error:
        "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para adicionar RTVs.",
    };

  const tempPassword = genPassword();
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { nome, invited: "true" },
  });
  if (cErr || !created?.user) {
    if ((cErr?.message || "").toLowerCase().includes("already"))
      return { error: "Já existe um usuário com esse email." };
    return { error: "Não foi possível criar o usuário." };
  }

  const { error: iErr } = await admin.from("users").insert({
    id: created.user.id,
    organization_id: me.organization_id,
    nome,
    email,
    papel: "rtv",
  });
  if (iErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Não foi possível vincular o RTV à empresa." };
  }

  return {
    tempPassword,
    member: {
      id: created.user.id,
      nome,
      email,
      papel: "rtv",
      ultimoAcesso: null,
    },
  };
}
