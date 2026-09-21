// Utilitários — portados verbatim do protótipo sulco.html.
import { FASES_LAVOURA, type Client, type Visit } from "./domain";

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(d?: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length < 3) return d;
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

export function fmtMoney(v: number | string): string {
  const n = Number(v) || 0;
  return (
    "R$ " +
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

export function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
}

export function currentMonthKey(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export function waLink(text: string, phone?: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits && digits.length <= 11) digits = "55" + digits;
  const base = digits ? "https://wa.me/" + digits : "https://wa.me/";
  return base + "?text=" + encodeURIComponent(text);
}

export function buildClientCard(c: Client, lastVisit?: Visit): string {
  const lines: string[] = [];
  lines.push("FICHA DO CLIENTE — " + (c.nome || ""));
  if (c.fazenda) lines.push("Fazenda: " + c.fazenda);
  if (c.regiao) lines.push("Região: " + c.regiao);
  if (c.areaHa) lines.push("Área: " + c.areaHa + " ha");
  if (c.culturas && c.culturas.length)
    lines.push("Culturas: " + c.culturas.join(", "));
  if (c.lat && c.lng)
    lines.push(
      "Localização: https://www.google.com/maps?q=" + c.lat + "," + c.lng
    );
  if (lastVisit) lines.push("Última visita: " + fmtDate(lastVisit.date));
  if (c.obs) {
    lines.push("");
    lines.push("Obs: " + c.obs);
  }
  return lines.join("\n");
}

export function buildReport(v: Visit, c?: Client, talhaoNome?: string): string {
  const lines: string[] = [];
  lines.push("RELATÓRIO DE VISITA TÉCNICA");
  lines.push("Data: " + fmtDate(v.date));
  lines.push("Produtor: " + (c ? c.nome : "—"));
  if (c && c.fazenda) lines.push("Fazenda: " + c.fazenda);
  if (talhaoNome) lines.push("Talhão: " + talhaoNome);
  if (c && c.regiao) lines.push("Região: " + c.regiao);
  if (c && c.culturas && c.culturas.length)
    lines.push("Culturas: " + c.culturas.join(", "));
  if (c && c.areaHa) lines.push("Área: " + c.areaHa + " ha");
  if (v.fase) {
    const fLbl = (FASES_LAVOURA.find((f) => f.key === v.fase) || {}).label;
    if (fLbl) lines.push("Fase da lavoura: " + fLbl);
  }
  lines.push("");
  if (v.notas) {
    lines.push("Assunto tratado:");
    lines.push(v.notas);
    lines.push("");
  }
  if (v.recomendacoes) {
    lines.push("Recomendação técnica:");
    lines.push(v.recomendacoes);
    lines.push("");
  }
  if (v.nextReturnDate) lines.push("Próximo retorno: " + fmtDate(v.nextReturnDate));
  if (v.photos && v.photos.length)
    lines.push("Fotos anexadas: " + v.photos.length);
  return lines.join("\n");
}
