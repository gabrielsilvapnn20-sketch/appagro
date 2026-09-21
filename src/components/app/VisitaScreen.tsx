"use client";

import { useEffect, useRef, useState } from "react";
import { FASES_LAVOURA, type Client, type Visit } from "@/lib/domain";
import { fmtDate, todayStr } from "@/lib/format";
import { IconCamera, IconVisitEmpty } from "./icons";

type Pending = { file: File; previewUrl: string };

export function VisitaScreen({
  clients,
  visits,
  presetClientId,
  onSave,
  onOpenReport,
  toast,
}: {
  clients: Client[];
  visits: Visit[];
  presetClientId: string;
  onSave: (
    data: {
      clientId: string;
      date: string;
      nextReturnDate: string;
      fase: string;
      notas: string;
      recomendacoes: string;
    },
    files: File[]
  ) => Promise<boolean>;
  onOpenReport: (v: Visit) => void;
  toast: (m: string) => void;
}) {
  const [clientId, setClientId] = useState(presetClientId || "");
  const [date, setDate] = useState(todayStr());
  const [nextReturnDate, setNextReturnDate] = useState("");
  const [fase, setFase] = useState("");
  const [notas, setNotas] = useState("");
  const [recomendacoes, setRecomendacoes] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (presetClientId) setClientId(presetClientId);
  }, [presetClientId]);

  const clientOptions = clients
    .slice()
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
        date: date || todayStr(),
        nextReturnDate,
        fase,
        notas: notas.trim(),
        recomendacoes: recomendacoes.trim(),
      },
      pending.map((p) => p.file)
    );
    setSaving(false);
    if (ok) {
      setClientId("");
      setDate(todayStr());
      setNextReturnDate("");
      setFase("");
      setNotas("");
      setRecomendacoes("");
      setPending([]);
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
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Selecione um cliente</option>
          {clientOptions.map((c) => (
            <option value={c.id} key={c.id}>
              {c.nome}
              {c.fazenda ? " — " + c.fazenda : ""}
            </option>
          ))}
        </select>
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
