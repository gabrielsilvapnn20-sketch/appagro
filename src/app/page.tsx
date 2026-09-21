import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/profile";
import { loadAppData } from "@/lib/load";
import { AppRoot } from "@/components/app/AppRoot";

export default async function Home() {
  const data = await ensureProfile();
  if (!data) redirect("/login");
  const { profile, organization } = data;

  const initial = await loadAppData();

  return (
    <AppRoot
      orgId={profile.organization_id}
      userId={profile.id}
      orgNome={organization.nome}
      userNome={profile.nome}
      email={profile.email}
      papel={profile.papel}
      initial={initial}
    />
  );
}
