// Camada de dados do lado do browser — grava no Supabase (RLS garante o
// escopo por organização). Substitui a coleção única do protótipo.
import { createClient } from "@/lib/supabase/client";
import {
  clientFromRow,
  clientToRow,
  oppFromRow,
  visitFromRow,
} from "@/lib/mappers";
import type {
  Client,
  Opportunity,
  Settings,
  StageKey,
  Visit,
  VisitPhoto,
} from "@/lib/domain";

const BUCKET = "visit-photos";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function saveClient(
  organizationId: string,
  id: string | null,
  data: Partial<Client>
): Promise<Client> {
  const supabase = createClient();
  const row = clientToRow(data, organizationId);
  if (id) {
    const { data: out, error } = await supabase
      .from("clients")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return clientFromRow(out);
  }
  const { data: out, error } = await supabase
    .from("clients")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return clientFromRow(out);
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function saveOpportunity(
  organizationId: string,
  id: string | null,
  data: Partial<Opportunity>
): Promise<Opportunity> {
  const supabase = createClient();
  const row = {
    organization_id: organizationId,
    client_id: data.clientId,
    produto: data.produto || null,
    valor: Number(data.valor) || 0,
    estagio: data.estagio,
    atualizado_em: new Date().toISOString(),
  };
  if (id) {
    const { data: out, error } = await supabase
      .from("opportunities")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return oppFromRow(out);
  }
  const { data: out, error } = await supabase
    .from("opportunities")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return oppFromRow(out);
}

export async function deleteOpportunity(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) throw error;
}

export async function moveOpportunity(
  id: string,
  estagio: StageKey
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ estagio, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

async function signedUrl(path: string): Promise<string | undefined> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl;
}

export async function saveVisit(
  organizationId: string,
  userId: string | null,
  data: {
    clientId: string;
    date: string;
    nextReturnDate: string;
    fase: string;
    notas: string;
    recomendacoes: string;
  },
  files: File[]
): Promise<Visit> {
  const supabase = createClient();
  const id = newId();

  const photos: VisitPhoto[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${organizationId}/${id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
    });
    if (!error) {
      photos.push({ path, url: await signedUrl(path) });
    }
  }

  const { data: out, error } = await supabase
    .from("visits")
    .insert({
      id,
      organization_id: organizationId,
      client_id: data.clientId,
      user_id: userId,
      data: data.date,
      proximo_retorno: data.nextReturnDate || null,
      fase_lavoura: data.fase || null,
      notas: data.notas || null,
      recomendacoes: data.recomendacoes || null,
      fotos: photos.map((p) => ({ path: p.path })),
    })
    .select()
    .single();
  if (error) throw error;

  const visit = visitFromRow(out);
  // devolve com as URLs assinadas já resolvidas para exibir na hora
  visit.photos = photos;
  return visit;
}

export async function saveSettings(
  organizationId: string,
  settings: Settings
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("org_settings").upsert({
    organization_id: organizationId,
    meta_visitas_mes: Number(settings.metaVisitasMes) || 0,
    meta_vendas_mes: Number(settings.metaVendasMes) || 0,
    atualizado_em: new Date().toISOString(),
  });
  if (error) throw error;
}
