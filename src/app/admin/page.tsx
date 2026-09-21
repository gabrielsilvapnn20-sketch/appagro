import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AdminOverview,
  type OrgOverview,
} from "@/components/admin/AdminOverview";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_super_admin");
  if (!isAdmin) redirect("/");

  const { data, error } = await supabase.rpc("admin_org_overview");
  const orgs = (error ? [] : (data as OrgOverview[])) ?? [];

  return <AdminOverview orgs={orgs} />;
}
