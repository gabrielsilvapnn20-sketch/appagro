// Fila offline de visitas — quando não há sinal, a visita é guardada no
// aparelho (localStorage) e sincronizada assim que a conexão voltar.
// Fotos exigem upload, então não entram na fila offline (o usuário é avisado).
import type { Monitoramento, Recomendacao } from "./domain";

export type QueuedVisitData = {
  clientId: string;
  talhaoId: string;
  date: string;
  nextReturnDate: string;
  fase: string;
  notas: string;
  recomendacoes: string;
};

export type QueuedVisit = {
  id: string; // id temporário local
  data: QueuedVisitData;
  monitoramentos: Monitoramento[];
  receituario: Recomendacao[];
  queuedAt: string;
};

const KEY = "agrogiro_visit_queue";

export function loadQueue(): QueuedVisit[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedVisit[]) : [];
  } catch {
    return [];
  }
}

function persist(q: QueuedVisit[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

export function enqueueVisit(
  data: QueuedVisitData,
  monitoramentos: Monitoramento[],
  receituario: Recomendacao[]
): QueuedVisit {
  const item: QueuedVisit = {
    id: "local-" + Date.now().toString(36),
    data,
    monitoramentos,
    receituario,
    queuedAt: new Date().toISOString(),
  };
  const q = loadQueue();
  q.push(item);
  persist(q);
  return item;
}

export function removeFromQueue(id: string) {
  persist(loadQueue().filter((x) => x.id !== id));
}

export function pendingCount(): number {
  return loadQueue().length;
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}
