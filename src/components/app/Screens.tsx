"use client";

import {
  CALENDARIO_SAFRA,
  STAGES,
  type Client,
  type Opportunity,
  type Visit,
} from "@/lib/domain";
import { fmtDate, fmtMoney, initials } from "@/lib/format";
import {
  alertsList,
  pedidosThisMonthValue,
  visitsForClient,
  visitsThisMonth,
} from "@/lib/derive";
import {
  IconCheckCircle,
  IconChevron,
  IconClock,
  IconPinSmall,
  IconSearch,
  IconUserEmpty,
} from "./icons";

const MESES_LONGOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// -------------------------------------------------------------- Dashboard
export function Dashboard({
  clients,
  visits,
  opportunities,
  settings,
  onEditGoals,
  onGoAgenda,
}: {
  clients: Client[];
  visits: Visit[];
  opportunities: Opportunity[];
  settings: { metaVisitasMes: number; metaVendasMes: number };
  onEditGoals: () => void;
  onGoAgenda: () => void;
}) {
  const vMonth = visitsThisMonth(visits).length;
  const metaV = Number(settings.metaVisitasMes) || 1;
  const pctV = Math.min(100, Math.round((vMonth / metaV) * 100));
  const vendas = pedidosThisMonthValue(opportunities);
  const metaS = Number(settings.metaVendasMes) || 1;
  const pctS = Math.min(100, Math.round((vendas / metaS) * 100));
  const openOpps = opportunities.filter(
    (o) => o.estagio !== "pedido" && o.estagio !== "posvenda"
  ).length;
  const alerts = alertsList(clients, visits).slice(0, 4);

  const now = new Date();
  const greet =
    now.getHours() < 12
      ? "Bom dia"
      : now.getHours() < 18
      ? "Boa tarde"
      : "Boa noite";

  return (
    <>
      <h1 className="title">{greet}</h1>
      <p className="subtitle">
        Panorama de hoje, {now.getDate()} de {MESES_LONGOS[now.getMonth()]}
      </p>
      <div className="stat-grid">
        <div className="stat">
          <div className="num">{clients.length}</div>
          <div className="lbl">clientes cadastrados</div>
        </div>
        <div className="stat">
          <div className="num">{vMonth}</div>
          <div className="lbl">visitas este mês</div>
        </div>
        <div className="stat">
          <div className="num">{openOpps}</div>
          <div className="lbl">oportunidades em aberto</div>
        </div>
        <div className="stat">
          <div className="num">{fmtMoney(vendas)}</div>
          <div className="lbl">fechado este mês</div>
        </div>
      </div>
      <div className="card">
        <div className="goal-row">
          <div className="goal-head">
            <span>Meta de visitas</span>
            <b>
              {vMonth} / {metaV}
            </b>
          </div>
          <div className="bar">
            <div style={{ width: pctV + "%" }} />
          </div>
        </div>
        <div className="goal-row" style={{ marginTop: 12 }}>
          <div className="goal-head">
            <span>Meta de vendas</span>
            <b>
              {fmtMoney(vendas)} / {fmtMoney(metaS)}
            </b>
          </div>
          <div className="bar">
            <div style={{ width: pctS + "%", background: "var(--accent)" }} />
          </div>
        </div>
        <button
          className="btn-ghost"
          style={{ marginTop: 6, paddingLeft: 0 }}
          onClick={onEditGoals}
        >
          Editar metas
        </button>
      </div>
      <div className="section-head">
        <h2>Alertas</h2>
        <button className="link" onClick={onGoAgenda}>
          ver agenda
        </button>
      </div>
      {alerts.length ? (
        alerts.map((a, i) => (
          <div
            className={"alert-item " + (a.kind === "atraso" ? "due" : "")}
            key={i}
          >
            <IconClock className="ic" />
            <div className="txt">{a.text}</div>
          </div>
        ))
      ) : (
        <div className="empty">
          <IconCheckCircle />
          <p>Nenhum alerta por enquanto.</p>
        </div>
      )}
    </>
  );
}

// --------------------------------------------------------------- Clientes
export function Clientes({
  clients,
  visits,
  search,
  onSearch,
  onOpenClient,
}: {
  clients: Client[];
  visits: Visit[];
  search: string;
  onSearch: (v: string) => void;
  onOpenClient: (id: string) => void;
}) {
  const q = (search || "").toLowerCase();
  const list = clients
    .filter((c) => {
      if (!q) return true;
      return (
        (c.nome || "").toLowerCase().indexOf(q) > -1 ||
        (c.fazenda || "").toLowerCase().indexOf(q) > -1 ||
        (c.regiao || "").toLowerCase().indexOf(q) > -1
      );
    })
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

  return (
    <>
      <h1 className="title">Clientes</h1>
      <p className="subtitle">Cadastro único de produtores e fazendas</p>
      <div className="searchbar">
        <IconSearch />
        <input
          placeholder="Buscar por produtor, fazenda ou região"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {!list.length ? (
        <div className="empty">
          <IconUserEmpty />
          <p>
            {clients.length
              ? "Nenhum cliente encontrado."
              : "Nenhum cliente cadastrado ainda. Toque em + para começar."}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: "4px 10px" }}>
          {list.map((c) => {
            const sub =
              (c.fazenda ? c.fazenda + " · " : "") + (c.regiao || "sem região");
            return (
              <div
                className="client-item"
                key={c.id}
                onClick={() => onOpenClient(c.id)}
              >
                <div className="avatar">
                  {initials(c.nome).toUpperCase()}
                </div>
                <div className="meta">
                  <div className="name">{c.nome || "Sem nome"}</div>
                  <div className="sub">{sub}</div>
                </div>
                <IconChevron className="chev" />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Funil
export function Funil({
  clients,
  opportunities,
  onMove,
}: {
  clients: Client[];
  opportunities: Opportunity[];
  onMove: (oppId: string, dir: number) => void;
}) {
  const clientById = (id: string) => clients.find((c) => c.id === id);
  return (
    <>
      <h1 className="title">Funil de vendas</h1>
      <p className="subtitle">Acompanhe cada oportunidade até o pedido</p>
      <div className="kanban">
        {STAGES.map((st, idx) => {
          const opps = opportunities.filter((o) => o.estagio === st.key);
          return (
            <div className="kcol" key={st.key}>
              <div className="kcol-head">
                <span className="t">{st.label}</span>
                <span className="c">{opps.length}</span>
              </div>
              {opps.length ? (
                opps.map((o) => {
                  const c = clientById(o.clientId);
                  return (
                    <div className="oppcard" key={o.id}>
                      <div className="cn">
                        {c ? c.nome : o.clientName || "Cliente"}
                      </div>
                      <div className="pd">{o.produto || ""}</div>
                      <div className="val">{fmtMoney(o.valor)}</div>
                      <div className="oppmove">
                        <button
                          onClick={() => onMove(o.id, -1)}
                          disabled={idx === 0}
                        >
                          ‹ voltar
                        </button>
                        <button
                          onClick={() => onMove(o.id, 1)}
                          disabled={idx === STAGES.length - 1}
                        >
                          avançar ›
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p
                  style={{
                    fontSize: "12.5px",
                    color: "var(--ink-soft)",
                    padding: "8px 2px",
                  }}
                >
                  Sem oportunidades
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ----------------------------------------------------------------- Agenda
export function Agenda({
  clients,
  visits,
  onOpenClient,
}: {
  clients: Client[];
  visits: Visit[];
  onOpenClient: (id: string) => void;
}) {
  const alerts = alertsList(clients, visits);

  const groups: Record<string, Client[]> = {};
  clients.forEach((c) => {
    const r = c.regiao || "Sem região definida";
    (groups[r] = groups[r] || []).push(c);
  });
  const regionNames = Object.keys(groups).sort();

  return (
    <>
      <h1 className="title">Agenda</h1>
      <p className="subtitle">Retornos, prioridades e roteiro por região</p>

      <div className="section-head">
        <h2>Prioridades</h2>
      </div>
      {alerts.length ? (
        alerts.map((a, i) => (
          <div
            className={"alert-item " + (a.kind === "atraso" ? "due" : "")}
            key={i}
          >
            <IconClock className="ic" />
            <div className="txt">{a.text}</div>
          </div>
        ))
      ) : (
        <div className="empty">
          <IconCheckCircle />
          <p>Tudo em dia por aqui.</p>
        </div>
      )}

      <div className="section-head">
        <h2>Calendário de referência — grãos</h2>
      </div>
      <div className="card" style={{ padding: "4px 4px" }}>
        {CALENDARIO_SAFRA.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              padding: "10px 12px",
              borderTop: i ? "1px solid var(--border)" : undefined,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{row.cultura}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {row.fase}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-soft)",
                textAlign: "right",
                maxWidth: "44%",
              }}
            >
              {row.periodo}
            </div>
          </div>
        ))}
      </div>
      <p className="subtitle" style={{ marginTop: 8 }}>
        Referência para a região Centro-Oeste — ajuste conforme a safra e a
        chuva de cada ano.
      </p>

      <div className="section-head">
        <h2>Clientes por região</h2>
      </div>
      {!regionNames.length ? (
        <p className="subtitle" style={{ margin: 0 }}>
          Cadastre clientes com região para organizar seu roteiro.
        </p>
      ) : (
        regionNames.map((r) => {
          const items = groups[r]
            .slice()
            .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
          return (
            <div className="region-group" key={r}>
              <div className="region-title">
                <IconPinSmall width={14} height={14} />
                {r} · {items.length} cliente{items.length > 1 ? "s" : ""}
              </div>
              <div className="card" style={{ padding: "4px 10px" }}>
                {items.map((c) => {
                  const lastV = visitsForClient(visits, c.id)[0];
                  return (
                    <div
                      className="client-item"
                      key={c.id}
                      onClick={() => onOpenClient(c.id)}
                    >
                      <div className="avatar">
                        {initials(c.nome).toUpperCase()}
                      </div>
                      <div className="meta">
                        <div className="name">{c.nome}</div>
                        <div className="sub">
                          {lastV
                            ? "última visita " + fmtDate(lastV.date)
                            : "sem visitas ainda"}
                        </div>
                      </div>
                      <IconChevron className="chev" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
