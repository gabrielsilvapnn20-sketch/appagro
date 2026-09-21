import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/profile";
import { loadAppData } from "@/lib/load";
import { createClient } from "@/lib/supabase/server";
import { AppRoot } from "@/components/app/AppRoot";
import type { Member } from "@/lib/domain";

export default async function Home() {
  const data = await ensureProfile();
  if (!data) redirect("/login");
  const { profile, organization } = data;

  const initial = await loadAppData();

  const supabase = await createClient();
  const { data: membersData } = await supabase
    .from("users")
    .select("id, nome, email, papel, ultimo_acesso")
    .eq("organization_id", profile.organization_id)
    .order("criado_em", { ascending: true });
  const members: Member[] = (membersData ?? []).map((m) => ({
    id: m.id as string,
    nome: (m.nome as string) ?? "",
    email: (m.email as string) ?? "",
    papel: (m.papel as "dono" | "rtv") ?? "rtv",
    ultimoAcesso: (m.ultimo_acesso as string) ?? null,
  }));

  return (
    <AppRoot
      orgId={profile.organization_id}
      userId={profile.id}
      orgNome={organization.nome}
      userNome={profile.nome}
      email={profile.email}
      papel={profile.papel}
      members={members}
      initial={initial}
    />
  );
}
