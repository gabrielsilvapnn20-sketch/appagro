"use server";

import { createClient } from "@/lib/supabase/server";

export type PushSub = { endpoint: string; p256dh: string; auth: string };

/** Salva (ou atualiza) a inscrição de push do usuário autenticado. */
export async function savePushSubscription(
  sub: PushSub
): Promise<{ ok?: boolean; error?: string }> {
  if (!sub?.endpoint || !sub.p256dh || !sub.auth)
    return { error: "inscrição inválida" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "não autenticado" };

  const { data: me } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!me) return { error: "perfil não encontrado" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      organization_id: me.organization_id,
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { error: error.message };
  return { ok: true };
}

/** Remove a inscrição (quando o usuário desativa as notificações). */
export async function deletePushSubscription(
  endpoint: string
): Promise<{ ok?: boolean; error?: string }> {
  if (!endpoint) return { error: "endpoint vazio" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "não autenticado" };
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) return { error: error.message };
  return { ok: true };
}
