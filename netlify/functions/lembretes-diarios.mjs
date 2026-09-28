// Função agendada da Netlify — envia lembretes de retorno (Web Push) uma vez
// por dia, mesmo com o app fechado. Roda no servidor com a service role.
//
// Variáveis necessárias na Netlify:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (opcional)
//
// O horário é UTC. "0 11 * * *" ≈ 08:00 no horário de Brasília (UTC-3).
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const config = { schedule: "0 11 * * *" };

export default async () => {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PUB = process.env.VAPID_PUBLIC_KEY;
  const PRIV = process.env.VAPID_PRIVATE_KEY;

  if (!URL || !SRK || !PUB || !PRIV) {
    return new Response(
      "Configuração incompleta (Supabase URL/Service Role e VAPID).",
      { status: 200 }
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contato@agrogiro.app",
    PUB,
    PRIV
  );
  const sb = createClient(URL, SRK, { auth: { persistSession: false } });
  const today = new Date().toISOString().slice(0, 10);

  // Visitas com retorno para hoje ou atrasado
  const { data: visits } = await sb
    .from("visits")
    .select("organization_id, client_id, proximo_retorno")
    .not("proximo_retorno", "is", null)
    .lte("proximo_retorno", today);

  if (!visits || !visits.length) {
    return new Response("Sem retornos pendentes hoje.", { status: 200 });
  }

  // Nomes dos clientes
  const clientIds = [...new Set(visits.map((v) => v.client_id))];
  const { data: clients } = await sb
    .from("clients")
    .select("id, nome")
    .in("id", clientIds);
  const nomeCliente = new Map((clients || []).map((c) => [c.id, c.nome]));

  // Agrupa nomes por organização
  const byOrg = new Map();
  for (const v of visits) {
    const arr = byOrg.get(v.organization_id) || [];
    arr.push(nomeCliente.get(v.client_id) || "Cliente");
    byOrg.set(v.organization_id, arr);
  }

  let sent = 0;
  let removed = 0;
  for (const [orgId, nomes] of byOrg) {
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("*")
      .eq("organization_id", orgId);
    if (!subs || !subs.length) continue;

    const uniq = [...new Set(nomes)];
    const title =
      uniq.length === 1
        ? `Retorno hoje: ${uniq[0]}`
        : `${uniq.length} retornos pendentes`;
    const body = uniq.slice(0, 3).join(", ") + (uniq.length > 3 ? "…" : "");
    const payload = JSON.stringify({ title, body });

    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err) {
        // 404/410 = inscrição expirada: remove
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          removed++;
        }
      }
    }
  }

  return new Response(`Enviadas: ${sent}. Inscrições expiradas removidas: ${removed}.`, {
    status: 200,
  });
};
