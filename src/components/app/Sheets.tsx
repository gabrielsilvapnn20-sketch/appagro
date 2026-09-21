"use client";

import { useEffect, useState } from "react";
import {
  FASES_LAVOURA,
  STAGES,
  type Client,
  type Opportunity,
  type Settings,
  type StageKey,
  type Visit,
} from "@/lib/domain";
import {
  buildClientCard,
  buildReport,
  fmtDate,
  fmtMoney,
  waLink,
} from "@/lib/format";
import { IconClose, IconPinCircle } from "./icons";

function SheetHead({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <h2>{title}</h2>
        <button className="sheet-close" onClick={onClose} aria-label="Fechar">
          <IconClose />
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Client form
export function ClientFormSheet({
  client,
  onClose,
  onSubmit,
  onDelete,
  toast,
}: {
  client: Client | null;
  onClose: () => void;
  onSubmit: (id: string | null, data: Partial<Client>) => void;
  onDelete: (id: string) => void;
  toast: (m: string) => void;
}) {
  const isEdit = !!client;
  const [nome, setNome] = useState(client?.nome ?? "");
  const [fazenda, setFazenda] = useState(client?.fazenda ?? "");
  const [regiao, setRegiao] = useState(client?.regiao ?? "");
  const [areaHa, setAreaHa] = useState(client?.areaHa ?? "");
  const [culturasRaw, setCulturasRaw] = useState(
    (client?.culturas ?? []).join(", ")
  );
  const [telefone, setTelefone] = useState(client?.telefone ?? "");
  const [obs, setObs] = useState(client?.obs ?? "");
  const [lat, setLat] = useState<number | null>(client?.lat ?? null);
  const [lng, setLng] = useState<number | null>(client?.lng ?? null);
  const [locLabel, setLocLabel] = useState(
    client?.lat
      ? "Localização salva · toque para atualizar"
      : "Usar minha localização atual"
  );

  function captureLoc() {
    if (!navigator.geolocation) {
      toast("Este dispositivo não suporta localização");
      return;
    }
    setLocLabel("Obtendo localização...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocLabel("Localização capturada agora");
        toast("Localização salva neste cadastro");
      },
      () => {
        setLocLabel(
          client?.lat
            ? "Localização salva · toque para atualizar"
            : "Usar minha localização atual"
        );
        toast("Não foi possível obter a localização");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function save() {
    if (!nome.trim()) {
      toast("Informe o nome do produtor");
      return;
    }
    onSubmit(client?.id ?? null, {
      nome: nome.trim(),
      fazenda: fazenda.trim(),
      regiao: regiao.trim(),
      areaHa: areaHa.trim(),
      culturas: culturasRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      lat,
      lng,
      telefone: telefone.trim(),
      obs: obs.trim(),
    });
  }

  return (
    <>
      <SheetHead
        title={isEdit ? "Editar cliente" : "Novo cliente"}
        onClose={onClose}
      />
      <label htmlFor="fNome">Nome do produtor</label>
      <input
        className="input"
        id="fNome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <label htmlFor="fFazenda">Fazenda / propriedade</label>
      <input
        className="input"
        id="fFazenda"
        value={fazenda}
        onChange={(e) => setFazenda(e.target.value)}
      />
      <div className="row2">
        <div>
          <label htmlFor="fRegiao">Região / cidade</label>
          <input
            className="input"
            id="fRegiao"
            value={regiao}
            onChange={(e) => setRegiao(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fArea">Área (ha)</label>
          <input
            className="input"
            type="number"
            id="fArea"
            value={areaHa}
            onChange={(e) => setAreaHa(e.target.value)}
          />
        </div>
      </div>
      <label htmlFor="fCulturas">Culturas (separadas por vírgula)</label>
      <input
        className="input"
        id="fCulturas"
        value={culturasRaw}
        onChange={(e) => setCulturasRaw(e.target.value)}
        placeholder="soja, milho, algodão"
      />
      <label>Localização da fazenda</label>
      <div className="file-btn" onClick={captureLoc}>
        <IconPinCircle />
        <span>{locLabel}</span>
      </div>
      <label htmlFor="fTel">Telefone</label>
      <input
        className="input"
        id="fTel"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />
      <label htmlFor="fObs">Observações</label>
      <textarea
        className="textarea"
        id="fObs"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
      />
      <div className="btn-row">
        {isEdit && (
          <button
            className="btn btn-danger"
            onClick={() => onDelete(client!.id)}
          >
            Excluir
          </button>
        )}
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
          Salvar
        </button>
      </div>
    </>
  );
}

// -------------------------------------------------------------- Client detail
export function ClientDetailSheet({
  client,
  visits,
  opportunities,
  onClose,
  onEdit,
  onNewVisit,
  onAddOpp,
  toast,
}: {
  client: Client;
  visits: Visit[];
  opportunities: Opportunity[];
  onClose: () => void;
  onEdit: () => void;
  onNewVisit: () => void;
  onAddOpp: () => void;
  toast: (m: string) => void;
}) {
  const clientVisits = visits
    .filter((v) => v.clientId === client.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const opps = opportunities.filter((o) => o.clientId === client.id);
  const lastV = clientVisits[0];

  function share() {
    window.open(waLink(buildClientCard(client, lastV), client.telefone), "_blank");
  }

  return (
    <>
      <SheetHead title={client.nome || "Cliente"} onClose={onClose} />
      <div className="chips" style={{ marginBottom: 12 }}>
        {client.regiao && <span className="chip">{client.regiao}</span>}
        {client.areaHa && (
          <span className="chip gold">{client.areaHa} ha</span>
        )}
        {(client.culturas || []).map((cu, i) => (
          <span className="chip" key={i}>
            {cu}
          </span>
        ))}
      </div>

      {client.fazenda && (
        <div className="field-view">
          <div className="k">FAZENDA</div>
          {client.fazenda}
        </div>
      )}
      {client.telefone && (
        <div className="field-view">
          <div className="k">TELEFONE</div>
          {client.telefone}
        </div>
      )}
      {client.lat && client.lng && (
        <div className="field-view">
          <div className="k">LOCALIZAÇÃO</div>
          <a
            href={`https://www.google.com/maps?q=${client.lat},${client.lng}`}
            target="_blank"
            rel="noopener"
            style={{ color: "var(--primary)", fontWeight: 600 }}
          >
            Ver no mapa →
          </a>
        </div>
      )}
      {client.obs && (
        <div className="field-view">
          <div className="k">OBSERVAÇÕES</div>
          {client.obs}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 10 }}>
        <button className="btn" style={{ flex: 1 }} onClick={onEdit}>
          Editar
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={onNewVisit}
        >
          Registrar visita
        </button>
      </div>
      <button
        className="btn-ghost"
        style={{ paddingLeft: 0, marginTop: 6 }}
        onClick={share}
      >
        Compartilhar ficha no WhatsApp
      </button>

      <div className="section-head">
        <h2>Oportunidades</h2>
        <button className="link" onClick={onAddOpp}>
          + nova
        </button>
      </div>
      {opps.length ? (
        opps.map((o) => {
          const st = STAGES.find((s) => s.key === o.estagio);
          return (
            <div className="oppcard" key={o.id}>
              <div className="cn">{o.produto || "Oportunidade"}</div>
              <div className="pd">{st ? st.label : ""}</div>
              <div className="val">{fmtMoney(o.valor)}</div>
            </div>
          );
        })
      ) : (
        <p className="subtitle" style={{ margin: "0 0 10px" }}>
          Nenhuma oportunidade registrada.
        </p>
      )}

      <div className="section-head">
        <h2>Histórico de visitas</h2>
      </div>
      {!clientVisits.length ? (
        <p className="subtitle" style={{ margin: 0 }}>
          Nenhuma visita registrada ainda.
        </p>
      ) : (
        <div className="visit-log">
          {clientVisits.map((v) => {
            const faseLbl = (
              FASES_LAVOURA.find((f) => f.key === v.fase) || {}
            ).label;
            return (
              <div className="vl-item" key={v.id}>
                <div className="vl-date">{fmtDate(v.date)}</div>
                {v.fase && (
                  <span
                    className="chip gold"
                    style={{ marginTop: 4, display: "inline-block" }}
                  >
                    {faseLbl || v.fase}
                  </span>
                )}
                {v.notas && <div className="vl-notes">{v.notas}</div>}
                {v.recomendacoes && (
                  <div className="vl-notes">
                    <b>Recomendação:</b> {v.recomendacoes}
                  </div>
                )}
                {v.nextReturnDate && (
                  <div className="vl-notes" style={{ color: "var(--clay)" }}>
                    Retorno: {fmtDate(v.nextReturnDate)}
                  </div>
                )}
                {v.photos.length > 0 && (
                  <div className="vl-thumbs">
                    {v.photos.map((p, i) =>
                      p.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={p.url} alt="foto da visita" />
                      ) : null
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------ Opportunity form
export function OppFormSheet({
  opp,
  presetClientId,
  clients,
  onClose,
  onSubmit,
  onDelete,
  toast,
}: {
  opp: Opportunity | null;
  presetClientId?: string;
  clients: Client[];
  onClose: () => void;
  onSubmit: (id: string | null, data: Partial<Opportunity>) => void;
  onDelete: (id: string) => void;
  toast: (m: string) => void;
}) {
  const isEdit = !!opp;
  const [clientId, setClientId] = useState(
    opp?.clientId ?? presetClientId ?? ""
  );
  const [produto, setProduto] = useState(opp?.produto ?? "");
  const [valor, setValor] = useState(opp ? String(opp.valor) : "");
  const [estagio, setEstagio] = useState<StageKey>(opp?.estagio ?? "prospect");

  const clientOptions = clients
    .slice()
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

  function save() {
    if (!clientId) {
      toast("Selecione um cliente");
      return;
    }
    onSubmit(opp?.id ?? null, {
      clientId,
      produto: produto.trim(),
      valor: Number(valor) || 0,
      estagio,
    });
  }

  return (
    <>
      <SheetHead
        title={isEdit ? "Editar oportunidade" : "Nova oportunidade"}
        onClose={onClose}
      />
      <label htmlFor="oClient">Cliente</label>
      <select
        className="select"
        id="oClient"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      >
        <option value="">Selecione</option>
        {clientOptions.map((c) => (
          <option value={c.id} key={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <label htmlFor="oProduto">Produto / interesse</label>
      <input
        className="input"
        id="oProduto"
        value={produto}
        onChange={(e) => setProduto(e.target.value)}
        placeholder="Ex: fungicida, sementes, adubo"
      />
      <label htmlFor="oValor">Valor estimado (R$)</label>
      <input
        className="input"
        type="number"
        id="oValor"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <label htmlFor="oEstagio">Estágio</label>
      <select
        className="select"
        id="oEstagio"
        value={estagio}
        onChange={(e) => setEstagio(e.target.value as StageKey)}
      >
        {STAGES.map((s) => (
          <option value={s.key} key={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <div className="btn-row">
        {isEdit && (
          <button className="btn btn-danger" onClick={() => onDelete(opp!.id)}>
            Excluir
          </button>
        )}
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
          Salvar
        </button>
      </div>
    </>
  );
}

// -------------------------------------------------------------------- Goals
export function GoalsSheet({
  settings,
  onClose,
  onSubmit,
}: {
  settings: Settings;
  onClose: () => void;
  onSubmit: (s: Settings) => void;
}) {
  const [visitas, setVisitas] = useState(String(settings.metaVisitasMes ?? 0));
  const [vendas, setVendas] = useState(String(settings.metaVendasMes ?? 0));

  return (
    <>
      <SheetHead title="Metas do mês" onClose={onClose} />
      <label htmlFor="gVisitas">Meta de visitas no mês</label>
      <input
        className="input"
        type="number"
        id="gVisitas"
        value={visitas}
        onChange={(e) => setVisitas(e.target.value)}
      />
      <label htmlFor="gVendas">Meta de vendas no mês (R$)</label>
      <input
        className="input"
        type="number"
        id="gVendas"
        value={vendas}
        onChange={(e) => setVendas(e.target.value)}
      />
      <div className="btn-row">
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={() =>
            onSubmit({
              metaVisitasMes: Number(visitas) || 0,
              metaVendasMes: Number(vendas) || 0,
            })
          }
        >
          Salvar metas
        </button>
      </div>
    </>
  );
}

// -------------------------------------------------------------------- Report
export function ReportSheet({
  visit,
  client,
  onClose,
  toast,
}: {
  visit: Visit;
  client?: Client;
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const report = buildReport(visit, client);

  function copy() {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(report)
        .then(() => toast("Relatório copiado"))
        .catch(() => toast("Não foi possível copiar"));
    } else {
      toast("Copiar não suportado neste dispositivo");
    }
  }

  return (
    <>
      <SheetHead title="Relatório da visita" onClose={onClose} />
      <div className="report-box">{report}</div>
      <div className="btn-row">
        <button className="btn" style={{ flex: 1 }} onClick={copy}>
          Copiar
        </button>
        <a
          className="btn btn-primary"
          style={{
            flex: 1,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          target="_blank"
          rel="noopener"
          href={waLink(report, client && client.telefone)}
        >
          Enviar no WhatsApp
        </a>
      </div>
    </>
  );
}

// ------------------------------------------------------------------- Account
export function AccountSheet({
  orgNome,
  userNome,
  email,
  papel,
  onClose,
  onLogout,
}: {
  orgNome: string;
  userNome: string;
  email: string;
  papel: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <SheetHead title="Sua conta" onClose={onClose} />
      <div className="field-view">
        <div className="k">EMPRESA</div>
        {orgNome}
      </div>
      <div className="field-view">
        <div className="k">USUÁRIO</div>
        {userNome || "—"} · {papel === "dono" ? "dono" : "RTV"}
      </div>
      <div className="field-view">
        <div className="k">EMAIL</div>
        {email}
      </div>
      <div className="btn-row">
        <button
          className="btn btn-danger btn-block"
          style={{ flex: 1 }}
          onClick={onLogout}
        >
          Sair da conta
        </button>
      </div>
    </>
  );
}

// util para fechar sheet ao clicar no overlay (usado pelo AppRoot)
export function useEscClose(onClose: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}
