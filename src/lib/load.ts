// Carga inicial dos dados no servidor (RLS aplica o escopo da organização).
import { createClient } from "@/lib/supabase/server";
import { clientFromRow, oppFromRow, visitFromRow } from "@/lib/mappers";
import type { Client, Opportunity, Settings, Visit } from "@/lib/domain";

const BUCKET = "visit-photos";

export async function loadAppData(): Promise<{
  clients: Client[];
  visits: Visit[];
  opportunities: Opportunity[];
  settings: Settings;
}> {
  const supabase = await createClient();

  const [clientsRes, visitsRes, oppsRes, settingsRes] = await Promise.all([
    supabase.from("clients").select("*").order("nome", { ascending: true }),
    supabase.from("visits").select("*").order("data", { ascending: false }),
    supabase
      .from("opportunities")
      .select("*")
      .order("criado_em", { ascending: false }),
    supabase.from("org_settings").select("*").maybeSingle(),
  ]);

  const clients = (clientsRes.data ?? []).map(clientFromRow);
  const visits = (visitsRes.data ?? []).map(visitFromRow);
  const opportunities = (oppsRes.data ?? []).map(oppFromRow);

  // resolve URLs assinadas das fotos em lote
  const allPaths = visits.flatMap((v) => v.photos.map((p) => p.path));
  if (allPaths.length) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(allPaths, 60 * 60);
    const urlByPath = new Map<string, string>();
    (signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    });
    visits.forEach((v) => {
      v.photos = v.photos.map((p) => ({
        ...p,
        url: urlByPath.get(p.path),
      }));
    });
  }

  const settings: Settings = settingsRes.data
    ? {
        metaVisitasMes: Number(settingsRes.data.meta_visitas_mes) || 20,
        metaVendasMes: Number(settingsRes.data.meta_vendas_mes) || 50000,
      }
    : { metaVisitasMes: 20, metaVendasMes: 50000 };

  return { clients, visits, opportunities, settings };
}
