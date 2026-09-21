import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  organization_id: string;
  nome: string;
  email: string;
  papel: "dono" | "rtv";
};

export type Organization = {
  id: string;
  nome: string;
  plano: string;
  status: string;
  criado_em: string;
};

/**
 * Garante que o usuário autenticado tenha organização + perfil.
 * O trigger handle_new_user() cuida disso no cadastro; esta função é um
 * fallback (ex.: se o trigger não estiver instalado) que chama a RPC
 * create_org_and_owner com os metadados do usuário.
 * Retorna null se não houver usuário autenticado.
 */
export async function ensureProfile(): Promise<{
  profile: Profile;
  organization: Organization;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile } = await supabase
    .from("users")
    .select("id, organization_id, nome, email, papel")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const meta = user.user_metadata ?? {};
    await supabase.rpc("create_org_and_owner", {
      p_org_nome: (meta.org_nome as string) || "Minha empresa",
      p_user_nome: (meta.nome as string) || "",
    });
    const refetch = await supabase
      .from("users")
      .select("id, organization_id, nome, email, papel")
      .eq("id", user.id)
      .maybeSingle();
    profile = refetch.data;
  }

  if (!profile) return null;

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, nome, plano, status, criado_em")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (!organization) return null;

  return {
    profile: profile as Profile,
    organization: organization as Organization,
  };
}
