// Exportações client-side (CSV compatível com Excel/Google Sheets).
// Sem dependências: gera um Blob e dispara o download.
import type { Client, Opportunity, Visit } from "./domain";
import { STAGES } from "./domain";
import { fmtDate } from "./format";
import { visitsForClient } from "./derive";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Excel entende ; como separador em pt-BR; aspas duplicadas escapam aspas.
  return '"' + s.replace(/"/g, '""') + '"';
}

function download(filename: string, rows: string[][]) {
  const body = rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
  // BOM (﻿) faz o Excel abrir em UTF-8 com acentos corretos.
  const blob = new Blob(["﻿" + body], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadClientsCsv(clients: Client[], visits: Visit[]) {
  const rows: string[][] = [
    [
      "Nome",
      "Fazenda",
      "Região",
      "Área (ha)",
      "Culturas",
      "Telefone",
      "Visitas",
      "Última visita",
      "Latitude",
      "Longitude",
    ],
  ];
  clients
    .slice()
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))
    .forEach((c) => {
      const vs = visitsForClient(visits, c.id);
      rows.push([
        c.nome || "",
        c.fazenda || "",
        c.regiao || "",
        c.areaHa || "",
        (c.culturas || []).join(", "),
        c.telefone || "",
        String(vs.length),
        vs[0] ? fmtDate(vs[0].date) : "",
        c.lat != null ? String(c.lat) : "",
        c.lng != null ? String(c.lng) : "",
      ]);
    });
  const hoje = new Date().toISOString().slice(0, 10);
  download("carteira-clientes-" + hoje + ".csv", rows);
}

export function downloadOppsCsv(
  opportunities: Opportunity[],
  clients: Client[]
) {
  const nomeCliente = (id: string) =>
    clients.find((c) => c.id === id)?.nome || "";
  const stageLabel = (k: string) =>
    STAGES.find((s) => s.key === k)?.label || k;
  const rows: string[][] = [
    ["Cliente", "Produto", "Valor", "Estágio", "Criado em", "Atualizado em"],
  ];
  opportunities
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .forEach((o) => {
      rows.push([
        o.clientName || nomeCliente(o.clientId),
        o.produto || "",
        // vírgula decimal para o Excel pt-BR
        String(Number(o.valor) || 0).replace(".", ","),
        stageLabel(o.estagio),
        o.createdAt ? fmtDate(o.createdAt.slice(0, 10)) : "",
        o.updatedAt ? fmtDate(o.updatedAt.slice(0, 10)) : "",
      ]);
    });
  const hoje = new Date().toISOString().slice(0, 10);
  download("pedidos-" + hoje + ".csv", rows);
}
