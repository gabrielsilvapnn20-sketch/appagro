// Gera um PDF do relatório de visita, com a marca Sulco. Client-only:
// o jsPDF é importado dinamicamente para não entrar no bundle do servidor.
import { FASES_LAVOURA, TIPOS_MONITORAMENTO } from "./domain";
import type { Client, Settings, Visit } from "./domain";
import { fmtDate, fmtMoney } from "./format";

function slug(s: string): string {
  return (s || "doc")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-")
    .toLowerCase();
}

const PRIMARY: [number, number, number] = [47, 74, 52];
const INK: [number, number, number] = [27, 42, 31];
const INK_SOFT: [number, number, number] = [85, 96, 79];
const ACCENT: [number, number, number] = [178, 127, 44];

export async function downloadVisitPdf(
  visit: Visit,
  client?: Client,
  talhaoNome?: string,
  signature?: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  let y = 0;

  function footer() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK_SOFT);
    doc.text(
      "Gerado pelo AgroGiro em " + fmtDate(new Date().toISOString().slice(0, 10)),
      M,
      H - 24
    );
  }

  function header() {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, W, 96, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("AgroGiro", M, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Relatório de Visita Técnica", M, 68);
    y = 128;
  }

  function ensure(h: number) {
    if (y + h > H - 48) {
      footer();
      doc.addPage();
      y = M + 8;
    }
  }

  function heading(t: string) {
    ensure(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY);
    doc.text(t, M, y);
    y += 6;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1.2);
    doc.line(M, y, M + 40, y);
    y += 14;
  }

  function kv(k: string, v: string) {
    if (!v) return;
    ensure(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK_SOFT);
    doc.text(k.toUpperCase(), M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(v, CW - 130) as string[];
    doc.text(lines, M + 130, y);
    y += Math.max(16, lines.length * 14);
  }

  function paragraph(t: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(t, CW) as string[];
    lines.forEach((ln) => {
      ensure(15);
      doc.text(ln, M, y);
      y += 15;
    });
    y += 6;
  }

  function bullet(t: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(t, CW - 14) as string[];
    ensure(15);
    doc.setTextColor(...ACCENT);
    doc.text("•", M, y);
    doc.setTextColor(...INK);
    lines.forEach((ln, i) => {
      if (i > 0) ensure(15);
      doc.text(ln, M + 14, y);
      y += 15;
    });
    y += 2;
  }

  header();

  kv("Data", fmtDate(visit.date));
  kv("Produtor", client ? client.nome : "—");
  if (client?.fazenda) kv("Fazenda", client.fazenda);
  if (talhaoNome) kv("Talhão", talhaoNome);
  if (client?.regiao) kv("Região", client.regiao);
  if (client?.culturas?.length) kv("Culturas", client.culturas.join(", "));
  if (client?.areaHa) kv("Área", client.areaHa + " ha");
  if (visit.fase) {
    const fLbl = (FASES_LAVOURA.find((f) => f.key === visit.fase) || {}).label;
    if (fLbl) kv("Fase da lavoura", fLbl);
  }
  y += 8;

  if (visit.notas) {
    heading("Assunto tratado");
    paragraph(visit.notas);
  }

  if (visit.monitoramentos.length) {
    heading("Monitoramento");
    visit.monitoramentos.forEach((m) => {
      const label =
        (TIPOS_MONITORAMENTO.find((t) => t.key === m.tipo) || {}).label ||
        m.tipo;
      const nivel = m.nivel
        ? " — " + m.nivel + (m.unidade ? " " + m.unidade : "")
        : "";
      bullet("[" + label + "] " + m.alvo + nivel);
    });
    y += 4;
  }

  if (visit.receituario.length) {
    heading("Receituário (produtos recomendados)");
    visit.receituario.forEach((r) => {
      const dose = r.dose
        ? " — " + r.dose + (r.unidade ? " " + r.unidade : "")
        : "";
      const alvo = r.alvo ? " (alvo: " + r.alvo + ")" : "";
      bullet(r.produto + dose + alvo);
    });
    y += 4;
  }

  if (visit.recomendacoes) {
    heading("Recomendação técnica");
    paragraph(visit.recomendacoes);
  }

  if (visit.nextReturnDate) {
    heading("Próximo retorno");
    paragraph(fmtDate(visit.nextReturnDate));
  }

  if (signature) {
    if (y > H - 150) {
      doc.addPage();
      y = M + 20;
    } else {
      y += 20;
    }
    try {
      doc.addImage(signature, "PNG", M, y, 180, 60);
    } catch {
      /* ignore */
    }
    y += 66;
    doc.setDrawColor(...INK_SOFT);
    doc.setLineWidth(0.6);
    doc.line(M, y, M + 200, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK_SOFT);
    doc.text("Ciente do produtor: " + (client?.nome || ""), M, y);
  }

  footer();

  const nome = (client?.nome || "visita")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-")
    .toLowerCase();
  doc.save("relatorio-" + nome + "-" + visit.date + ".pdf");
}

/* ------------------------------------------------ Receita Agronômica (ART) */
export async function downloadReceitaPdf(
  visit: Visit,
  client: Client | undefined,
  talhaoNome: string | undefined,
  orgNome: string,
  settings: Settings,
  signature?: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  let y = 0;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(orgNome || "AgroGiro", M, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Receita Agronômica", M, 66);
  y = 128;

  function kv(k: string, v?: string) {
    if (!v) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK_SOFT);
    doc.text(k.toUpperCase(), M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(v, CW - 130) as string[];
    doc.text(lines, M + 130, y);
    y += Math.max(16, lines.length * 14);
  }

  kv("Data", fmtDate(visit.date));
  kv("Produtor", client ? client.nome : "—");
  if (client?.fazenda) kv("Fazenda", client.fazenda);
  if (talhaoNome) kv("Talhão", talhaoNome);
  if (client?.culturas?.length) kv("Cultura", client.culturas.join(", "));
  if (client?.areaHa) kv("Área", client.areaHa + " ha");
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.text("Recomendação técnica", M, y);
  y += 6;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.2);
  doc.line(M, y, M + 40, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  visit.receituario.forEach((r) => {
    const dose = r.dose ? " — " + r.dose + (r.unidade ? " " + r.unidade : "") : "";
    const alvo = r.alvo ? " (alvo: " + r.alvo + ")" : "";
    const lines = doc.splitTextToSize("•  " + r.produto + dose + alvo, CW) as string[];
    lines.forEach((ln) => {
      if (y > H - 160) {
        doc.addPage();
        y = M + 8;
      }
      doc.text(ln, M, y);
      y += 15;
    });
  });

  y += 40;
  if (y > H - 130) {
    doc.addPage();
    y = M + 40;
  }
  doc.setDrawColor(...INK_SOFT);
  doc.setLineWidth(0.6);
  doc.line(M, y, M + 250, y);
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(settings.agronomoNome || "Responsável técnico", M, y);
  y += 14;
  const reg = [settings.agronomoCrea, settings.agronomoUf].filter(Boolean).join(" · ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK_SOFT);
  if (reg) {
    doc.text(reg, M, y);
    y += 14;
  }
  doc.text("Assinatura do engenheiro agrônomo responsável", M, y);

  if (signature) {
    y += 34;
    if (y > H - 110) {
      doc.addPage();
      y = M + 20;
    }
    try {
      doc.addImage(signature, "PNG", M, y, 180, 60);
    } catch {
      /* ignore */
    }
    y += 66;
    doc.setDrawColor(...INK_SOFT);
    doc.setLineWidth(0.6);
    doc.line(M, y, M + 200, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK_SOFT);
    doc.text("Ciente do produtor: " + (client?.nome || ""), M, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  doc.text(
    "Documento gerado pelo AgroGiro em " +
      fmtDate(new Date().toISOString().slice(0, 10)) +
      ". Verifique as exigências do órgão de defesa agropecuária do seu estado.",
    M,
    H - 24,
    { maxWidth: CW }
  );

  doc.save("receita-" + slug(client?.nome || "visita") + "-" + visit.date + ".pdf");
}

/* --------------------------------------------------------------- Orçamento */
export async function downloadOrcamentoPdf(
  visit: Visit,
  client: Client | undefined,
  orgNome: string,
  custoTotal: number,
  custoHa: number
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  let y = 0;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(orgNome || "AgroGiro", M, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Orçamento", M, 66);
  y = 128;

  function kv(k: string, v?: string) {
    if (!v) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK_SOFT);
    doc.text(k.toUpperCase(), M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(v, M + 130, y);
    y += 16;
  }
  kv("Data", fmtDate(visit.date));
  kv("Produtor", client ? client.nome : "—");
  if (client?.fazenda) kv("Fazenda", client.fazenda);
  y += 12;

  // cabeçalho da tabela
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK_SOFT);
  doc.text("PRODUTO", M, y);
  doc.text("VALOR", W - M, y, { align: "right" });
  y += 8;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(M, y, W - M, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  visit.receituario.forEach((r) => {
    if (y > H - 120) {
      doc.addPage();
      y = M + 8;
    }
    const dose = r.dose ? "  (" + r.dose + (r.unidade ? " " + r.unidade : "") + ")" : "";
    const nome = doc.splitTextToSize(r.produto + dose, CW - 120) as string[];
    doc.text(nome, M, y);
    doc.text(r.preco ? fmtMoney(Number(r.preco)) : "—", W - M, y, {
      align: "right",
    });
    y += Math.max(18, nome.length * 14);
  });

  y += 6;
  doc.setDrawColor(...INK_SOFT);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text("Total", M, y);
  doc.text(fmtMoney(custoTotal), W - M, y, { align: "right" });
  y += 18;
  if (custoHa > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT);
    doc.text("Custo por hectare", M, y);
    doc.text(fmtMoney(custoHa) + "/ha", W - M, y, { align: "right" });
    y += 16;
  }

  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  doc.text(
    "Orçamento sem valor fiscal · válido por 15 dias · gerado pelo AgroGiro em " +
      fmtDate(new Date().toISOString().slice(0, 10)) +
      ".",
    M,
    H - 24,
    { maxWidth: CW }
  );

  doc.save("orcamento-" + slug(client?.nome || "visita") + "-" + visit.date + ".pdf");
}
