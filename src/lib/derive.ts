// Dados derivados — lógica portada verbatim do protótipo sulco.html.
import type { Client, Opportunity, Visit } from "./domain";
import { currentMonthKey, daysBetween, fmtDate, todayStr } from "./format";

export function visitsForClient(visits: Visit[], id: string): Visit[] {
  return visits
    .filter((v) => v.clientId === id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function visitsThisMonth(visits: Visit[]): Visit[] {
  const mk = currentMonthKey();
  return visits.filter((v) => (v.date || "").slice(0, 7) === mk);
}

export function pedidosThisMonthValue(opportunities: Opportunity[]): number {
  const mk = currentMonthKey();
  return opportunities
    .filter(
      (o) => o.estagio === "pedido" && (o.createdAt || "").slice(0, 7) === mk
    )
    .reduce((s, o) => s + (Number(o.valor) || 0), 0);
}

export type Alert = {
  kind: "atraso" | "retorno" | "semvisita";
  date: string;
  sortD: number;
  text: string;
};

export function alertsList(clients: Client[], visits: Visit[]): Alert[] {
  const out: Alert[] = [];
  const today = todayStr();
  const clientById = (id: string) => clients.find((c) => c.id === id);

  visits.forEach((v) => {
    if (v.nextReturnDate) {
      const d = daysBetween(today, v.nextReturnDate);
      if (d <= 7) {
        const c = clientById(v.clientId);
        out.push({
          kind: d < 0 ? "atraso" : "retorno",
          date: v.nextReturnDate,
          sortD: d,
          text:
            (c ? c.nome : "Cliente") +
            (d < 0
              ? " — retorno atrasado (" + fmtDate(v.nextReturnDate) + ")"
              : d === 0
              ? " — retorno hoje"
              : " — retorno em " + d + " dia" + (d > 1 ? "s" : "")),
        });
      }
    }
  });

  clients.forEach((c) => {
    const lastV = visitsForClient(visits, c.id)[0];
    const since = lastV
      ? daysBetween(lastV.date, today)
      : c.createdAt
      ? daysBetween(c.createdAt.slice(0, 10), today)
      : 999;
    if (since >= 30) {
      out.push({
        kind: "semvisita",
        date: today,
        sortD: 50,
        text: c.nome + " — sem visita há " + since + " dias",
      });
    }
  });

  out.sort((a, b) => a.sortD - b.sortD);
  return out;
}
