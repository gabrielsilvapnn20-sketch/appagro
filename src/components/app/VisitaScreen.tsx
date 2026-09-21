"use client";

import { useEffect, useRef, useState } from "react";
import {
  FASES_LAVOURA,
  TIPOS_MONITORAMENTO,
  UNIDADES_DOSE,
  UNIDADES_MONITORAMENTO,
  type Client,
  type MonitTipo,
  type Monitoramento,
  type Recomendacao,
  type Talhao,
  type Visit,
} from "@/lib/domain";
import { fmtDate, todayStr } from "@/lib/format";
import { IconCamera, IconVisitEmpty } from "./icons";

function tipoLabel(tipo: MonitTipo): string {
  return (TIPOS_MONITORAMENTO.find((t) => t.key === tipo) || {}).label || tipo;
}

type Pending = { file: File; previewUrl: string };

export function VisitaScreen({
  clients,
  visits,
  talhoes,
  presetClientId,
  onSave,
  onOpenReport,
  toast,
}: {
  clients: Client[];
  visits: Visit[];
  talhoes: Talhao[];
  presetClientId: string;
  onSave: (
    data: {
      clientId: string;
      talhaoId: string;
      date: string;
      nextReturnDate: string;
      fase: string;
      notas: string;
      recomendacoes: string;
    },
    files: File[],
    monitoramentos: Monitoramento[],
    receituario: Recomendacao[]
  ) => Promise<boolean>;
  onOpenReport: (v: Visit) => void;
  toast: (m: string) => void;
}) {
  const [clientId, setClientId] = useState(presetClientId || "");
  const [talhaoId, setTalhaoId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [nextReturnDate, setNextReturnDate] = useState("");
  const [fase, setFase] = useState("");
  const [notas, setNotas] = useState("");
  const [recomendacoes, setRecomendacoes] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // monitoramento (sub-formulário)
  const [monits, setMonits] = useState<Monitoramento[]>([]);
  const [mTipo, setMTipo] = useState<MonitTipo>("praga");
  const [mAlvo, setMAlvo] = useState("");
  const [mNivel, setMNivel] = useState("");
  const [mUnidade, setMUnidade] = useState(UNIDADES_MONITORAMENTO[0]);

  function addMonit() {
    if (!mAlvo.trim()) {
      toast("Informe o alvo do monitoramento");
      return;
    }
    setMonits((prev) => [
      ...prev,
      {
        id: "m" + Date.now() + Math.random().toString(36).slice(2, 6),
        tipo: mTipo,
        alvo: mAlvo.trim(),
        nivel: mNivel,
        unidade: mUnidade,
        obs: "",
      },
    ]);
    setMAlvo("");
    setMNivel("");
  }

  function removeMonit(id: string) {
    setMonits((prev) => prev.filter((m) => m.id !== id));
  }

  // receituário (produtos recomendados)
  const [recs, setRecs] = useState<Recomendacao[]>([]);
  const [rProduto, setRProduto] = useState("");
  const [rDose, setRDose] = useState("");
  const [rUnidade, setRUnidade] = useState(UNIDADES_DOSE[0]);
  const [rAlvo, setRAlvo] = useState("");

  function addRec() {
    if (!rProduto.trim()) {
      toast("Informe o produto");
      return;
    }
    setRecs((prev) => [
      ...prev,
      {
        id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
        produto: rProduto.trim(),
        dose: rDose,
        unidade: rUnidade,
        alvo: rAlvo.trim(),
        obs: "",
      },
    ]);
    setRProduto("");
    setRDose("");
    setRAlvo("");
  }

  function removeRec(id: string) {
    setRecs((prev) => prev.filter((r) => r.id !== id));
  }

  useEffect(() => {
    if (presetClientId) setClientId(presetClientId);
  }, [presetClientId]);

  const clientOptions = clients
    .slice()
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

  const talhaoOptions = talhoes
    .filter((t) => t.clientId === clientId)
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

  const recent = visits
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 8);

  const clientById = (id: string) => clients.find((c) => c.id === id);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPending((prev) => [
          ...prev,
          { file: f, previewUrl: String(reader.result) },
        ]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }

  function removePhoto(i: number) {
    setPending((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!clientId) {
      toast("Selecione um cliente");
      return;
    }
    setSaving(true);
    const ok = await onSave(
      {
        clientId,
        talhaoId,
        date: date || todayStr(),
        nextReturnDate,
        fase,
        notas: notas.trim(),
        recomendacoes: recomendacoes.trim(),
      },
      pending.map((p) => p.file),
      monits,
      recs
    );
    setSaving(false);
    if (ok) {
      setClientId("");
      setTalhaoId("");
      setDate(todayStr());
      setNextReturnDate("");
      setFase("");
      setNotas("");
      setRecomendacoes("");
      setPending([]);
      setMonits([]);
      setRecs([]);
    }
  }

  return (
    <>
      <h1 className="title">Registrar visita</h1>
      <p className="subtitle">O relatório é gerado automaticamente ao salvar</p>
      <div className="card">
        <label htmlFor="visitClient">Produtor / fazenda</label>
        <select
          className="select"
          id="visitClient"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setTalhaoId("");
          }}
        >
          <option value="">Selecione um cliente</option>
          {clientOptions.map((c) => (
            <option value={c.id} key={c.id}>
              {c.nome}
              {c.fazenda ? " — " + c.fazenda : ""}
            </option>
          ))}
        </select>
        {clientId && talhaoOptions.length > 0 && (
          <>
            <label htmlFor="visitTalhao">Talhão (opcional)</label>
            <select
              className="select"
              id="visitTalhao"
              value={talhaoId}
              onChange={(e) => setTalhaoId(e.target.value)}
            >
              <option value="">Fazenda toda / não informar</option>
              {talhaoOptions.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.nome}
                  {t.cultura ? " — " + t.cultura : ""}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="row2">
          <div>
            <label htmlFor="visitDate">Data</label>
            <input
              className="input"
              type="date"
              id="visitDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="visitReturn">Próximo retorno</label>
            <input
              className="input"
              type="date"
              id="visitReturn"
              value={nextReturnDate}
              onChange={(e) => setNextReturnDate(e.target.value)}
            />
          </div>
        </div>
        <label htmlFor="visitFase">Fase da lavoura</label>
        <select
          className="select"
          id="visitFase"
          value={fase}
          onChange={(e) => setFase(e.target.value)}
        >
          <option value="">Não informar</option>
          {FASES_LAVOURA.map((f) => (
            <option value={f.key} key={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        <label htmlFor="visitNotas">O que foi conversado</label>
        <textarea
          className="textarea"
          id="visitNotas"
          placeholder="Assunto da visita, dúvidas do produtor, pedidos, negociações..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
        <label htmlFor="visitRecs">Recomendações técnicas</label>
        <textarea
          className="textarea"
          id="visitRecs"
          placeholder="Produtos, dosagens, manejo recomendado..."
          value={recomendacoes}
          onChange={(e) => setRecomendacoes(e.target.value)}
        />
        <label>Monitoramento (pragas, doenças, daninhas)</label>
        {monits.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {monits.map((m) => (
              <div
                key={m.id}
                className="oppcard"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  <b style={{ fontWeight: 700 }}>{tipoLabel(m.tipo)}</b> ·{" "}
                  {m.alvo}
                  {m.nivel
                    ? " — " + m.nivel + (m.unidade ? " " + m.unidade : "")
                    : ""}
                </div>
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={() => removeMonit(m.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    fontSize: 20,
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <select
            className="select"
            value={mTipo}
            onChange={(e) => setMTipo(e.target.value as MonitTipo)}
          >
            {TIPOS_MONITORAMENTO.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Alvo (ex: percevejo, ferrugem, buva)"
            value={mAlvo}
            onChange={(e) => setMAlvo(e.target.value)}
          />
          <div className="row2">
            <input
              className="input"
              type="number"
              placeholder="Nível"
              value={mNivel}
              onChange={(e) => setMNivel(e.target.value)}
            />
            <select
              className="select"
              value={mUnidade}
              onChange={(e) => setMUnidade(e.target.value)}
            >
              {UNIDADES_MONITORAMENTO.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-block" onClick={addMonit}>
            + Adicionar ocorrência
          </button>
        </div>

        <label>Produtos recomendados (receituário)</label>
        {recs.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {recs.map((r) => (
              <div
                key={r.id}
                className="oppcard"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  <b style={{ fontWeight: 700 }}>{r.produto}</b>
                  {r.dose
                    ? " — " + r.dose + (r.unidade ? " " + r.unidade : "")
                    : ""}
                  {r.alvo ? " · alvo: " + r.alvo : ""}
                </div>
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={() => removeRec(r.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    fontSize: 20,
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            className="input"
            placeholder="Produto (ex: Fungicida triazol)"
            value={rProduto}
            onChange={(e) => setRProduto(e.target.value)}
          />
          <div className="row2">
            <input
              className="input"
              type="number"
              placeholder="Dose"
              value={rDose}
              onChange={(e) => setRDose(e.target.value)}
            />
            <select
              className="select"
              value={rUnidade}
              onChange={(e) => setRUnidade(e.target.value)}
            >
              {UNIDADES_DOSE.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <input
            className="input"
            placeholder="Alvo (opcional)"
            value={rAlvo}
            onChange={(e) => setRAlvo(e.target.value)}
          />
          <button type="button" className="btn btn-block" onClick={addRec}>
            + Adicionar produto
          </button>
        </div>

        <label>Fotos</label>
        <div className="file-btn" onClick={() => fileRef.current?.click()}>
          <IconCamera />
          Adicionar fotos da lavoura
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          style={{ display: "none" }}
          onChange={onFiles}
        />
        <div className="thumbrow">
          {pending.map((p, i) => (
            <div className="th" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="prévia" />
              <button className="rm" onClick={() => removePhoto(i)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar visita"}
        </button>
      </div>

      <div className="section-head">
        <h2>Visitas recentes</h2>
      </div>
      {!recent.length ? (
        <div className="empty">
          <IconVisitEmpty />
          <p>Nenhuma visita registrada ainda.</p>
        </div>
      ) : (
        recent.map((v) => {
          const c = clientById(v.clientId);
          return (
            <div
              className="card"
              key={v.id}
              style={{ cursor: "pointer" }}
              onClick={() => onOpenReport(v)}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b style={{ fontSize: "13.5px" }}>
                  {c ? c.nome : "Cliente removido"}
                </b>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {fmtDate(v.date)}
                </span>
              </div>
              {v.notas && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-soft)",
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v.notas}
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
