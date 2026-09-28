// Web Push no cliente: inscreve o aparelho para receber lembretes de retorno
// mesmo com o app fechado. Precisa do NEXT_PUBLIC_VAPID_PUBLIC_KEY configurado.

export function vapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushResult =
  | "ok"
  | "nao-configurado"
  | "negado"
  | "sem-suporte"
  | "erro";

export async function subscribeToPush(): Promise<PushResult> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  )
    return "sem-suporte";

  const key = vapidPublicKey();
  if (!key) return "nao-configurado";

  try {
    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return "negado";
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
    }
    const json = sub.toJSON();
    const { savePushSubscription } = await import("@/app/push/actions");
    const res = await savePushSubscription({
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh || "",
      auth: json.keys?.auth || "",
    });
    return res?.ok ? "ok" : "erro";
  } catch {
    return "erro";
  }
}
