"use client";

import { useRef, useState } from "react";
import {
  STAGES,
  type Client,
  type Opportunity,
  type Monitoramento,
  type Recomendacao,
  type Settings,
  type TabKey,
  type Talhao,
  type Visit,
} from "@/lib/domain";
import {
  deleteClient,
  deleteOpportunity,
  deleteTalhao,
  moveOpportunity,
  saveClient,
  saveOpportunity,
  saveSettings,
  saveTalhao,
  saveVisit,
} from "@/lib/data";
import { logout } from "@/app/auth/actions";
import { SulcoMark } from "@/components/SulcoMark";
import {
  IconCalendar,
  IconFunnel,
  IconHome,
  IconPlus,
  IconUsers,
  IconVisit,
} from "./icons";
import { Agenda, Clientes, Dashboard, Funil } from "./Screens";
import { VisitaScreen } from "./VisitaScreen";
import {
  AccountSheet,
  ClientDetailSheet,
  ClientFormSheet,
  GoalsSheet,
  OppFormSheet,
  ReportSheet,
  TalhaoFormSheet,
} from "./Sheets";

type Sheet =
  | { kind: "clientForm"; client: Client | null; returnToDetail: boolean }
  | { kind: "clientDetail"; clientId: string }
  | { kind: "oppForm"; opp: Opportunity | null; presetClientId?: string }
  | {
      kind: "talhaoForm";
      talhao: Talhao | null;
      clientId: string;
      returnClientId: string;
    }
  | { kind: "goals" }
  | { kind: "report"; visit: Visit }
  | { kind: "account" }
  | null;

export type AppRootProps = {
  orgId: string;
  userId: string;
  orgNome: string;
  userNome: string;
  email: string;
  papel: string;
  initial: {
    clients: Client[];
    visits: Visit[];
    opportunities: Opportunity[];
    talhoes: Talhao[];
    settings: Settings;
  };
};

const NAV: { tab: TabKey; label: string; Icon: typeof IconHome }[] = [
  { tab: "dashboard", label: "Início", Icon: IconHome },
  { tab: "clientes", label: "Clientes", Icon: IconUsers },
  { tab: "visita", label: "Visita", Icon: IconVisit },
  { tab: "funil", label: "Funil", Icon: IconFunnel },
  { tab: "agenda", label: "Agenda", Icon: IconCalendar },
];

export function AppRoot({
  orgId,
  userId,
  orgNome,
  userNome,
  email,
  papel,
  initial,
}: AppRootProps) {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [clients, setClients] = useState<Client[]>(initial.clients);
  const [visits, setVisits] = useState<Visit[]>(initial.visits);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    initial.opportunities
  );
  const [talhoes, setTalhoes] = useState<Talhao[]>(initial.talhoes);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [search, setSearch] = useState("");
  const [visitPreset, setVisitPreset] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toast(msg: string) {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 2200);
  }

  function switchTab(t: TabKey) {
    setTab(t);
    if (contentRef.current) contentRef.current.scrollTo(0, 0);
  }

  const clientById = (id: string) => clients.find((c) => c.id === id);

  // ------- clients
  async function submitClient(id: string | null, data: Partial<Client>) {
    const returnToDetail =
      sheet?.kind === "clientForm" ? sheet.returnToDetail : false;
    try {
      const saved = await saveClient(orgId, id, data);
      setClients((prev) => {
        const exists = prev.some((c) => c.id === saved.id);
        return exists
          ? prev.map((c) => (c.id === saved.id ? saved : c))
          : [...prev, saved];
      });
      toast(id ? "Cliente atualizado" : "Cliente cadastrado");
      if (id && returnToDetail) {
        setSheet({ kind: "clientDetail", clientId: saved.id });
      } else {
        setSheet(null);
      }
    } catch {
      toast("Não foi possível salvar o cliente");
    }
  }

  async function removeClient(id: string) {
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      setSheet(null);
      toast("Cliente excluído");
    } catch {
      toast("Não foi possível excluir");
    }
  }

  // ------- opportunities
  async function submitOpp(id: string | null, data: Partial<Opportunity>) {
    try {
      const saved = await saveOpportunity(orgId, id, data);
      saved.clientName = clientById(saved.clientId)?.nome ?? "";
      setOpportunities((prev) => {
        const exists = prev.some((o) => o.id === saved.id);
        return exists
          ? prev.map((o) => (o.id === saved.id ? saved : o))
          : [saved, ...prev];
      });
      setSheet(null);
      toast(id ? "Oportunidade atualizada" : "Oportunidade criada");
    } catch {
      toast("Não foi possível salvar a oportunidade");
    }
  }

  async function removeOpp(id: string) {
    try {
      await deleteOpportunity(id);
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      setSheet(null);
      toast("Oportunidade excluída");
    } catch {
      toast("Não foi possível excluir");
    }
  }

  async function moveOpp(oppId: string, dir: number) {
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return;
    const idx = STAGES.findIndex((s) => s.key === opp.estagio);
    const newIdx = Math.min(STAGES.length - 1, Math.max(0, idx + dir));
    const newStage = STAGES[newIdx].key;
    if (newStage === opp.estagio) return;
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, estagio: newStage } : o))
    );
    try {
      await moveOpportunity(oppId, newStage);
      toast("Movido para " + STAGES[newIdx].label);
    } catch {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, estagio: opp.estagio } : o))
      );
      toast("Não foi possível mover");
    }
  }

  // ------- talhões
  async function submitTalhao(id: string | null, data: Partial<Talhao>) {
    const returnClientId =
      sheet?.kind === "talhaoForm" ? sheet.returnClientId : "";
    try {
      const saved = await saveTalhao(orgId, id, data);
      setTalhoes((prev) => {
        const exists = prev.some((t) => t.id === saved.id);
        return exists
          ? prev.map((t) => (t.id === saved.id ? saved : t))
          : [...prev, saved];
      });
      toast(id ? "Talhão atualizado" : "Talhão cadastrado");
      if (returnClientId) {
        setSheet({ kind: "clientDetail", clientId: returnClientId });
      } else {
        setSheet(null);
      }
    } catch {
      toast("Não foi possível salvar o talhão");
    }
  }

  async function removeTalhao(id: string) {
    const returnClientId =
      sheet?.kind === "talhaoForm" ? sheet.returnClientId : "";
    try {
      await deleteTalhao(id);
      setTalhoes((prev) => prev.filter((t) => t.id !== id));
      if (returnClientId) {
        setSheet({ kind: "clientDetail", clientId: returnClientId });
      } else {
        setSheet(null);
      }
      toast("Talhão excluído");
    } catch {
      toast("Não foi possível excluir");
    }
  }

  // ------- goals
  async function submitGoals(s: Settings) {
    setSettings(s);
    setSheet(null);
    toast("Metas atualizadas");
    try {
      await saveSettings(orgId, s);
    } catch {
      /* mantém localmente */
    }
  }

  // ------- visits
  async function saveVisitH(
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
  ): Promise<boolean> {
    try {
      const visit = await saveVisit(
        orgId,
        userId,
        data,
        files,
        monitoramentos,
        receituario
      );
      setVisits((prev) => [visit, ...prev]);
      toast("Visita registrada");
      setTimeout(() => setSheet({ kind: "report", visit }), 150);
      return true;
    } catch {
      toast("Não foi possível registrar a visita");
      return false;
    }
  }

  function startVisitForClient(clientId: string) {
    setSheet(null);
    switchTab("visita");
    setVisitPreset(clientId);
  }

  async function doLogout() {
    await logout();
  }

  const detailClient =
    sheet?.kind === "clientDetail" ? clientById(sheet.clientId) : null;

  return (
    <div id="app">
      <div className="topbar">
        <div>
          <div className="brand">
            <SulcoMark />
            Sulco
          </div>
          <div className="topbar-sub">CRM de campo para RTVs de grãos</div>
        </div>
        <div
          className="offline-pill"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => setSheet({ kind: "account" })}
        >
          <span className="dot" />
          <span>online</span>
        </div>
      </div>

      <div className="content" ref={contentRef}>
        {tab === "dashboard" && (
          <Dashboard
            clients={clients}
            visits={visits}
            opportunities={opportunities}
            settings={settings}
            onEditGoals={() => setSheet({ kind: "goals" })}
            onGoAgenda={() => switchTab("agenda")}
          />
        )}
        {tab === "clientes" && (
          <Clientes
            clients={clients}
            visits={visits}
            search={search}
            onSearch={setSearch}
            onOpenClient={(id) => setSheet({ kind: "clientDetail", clientId: id })}
          />
        )}
        {tab === "visita" && (
          <VisitaScreen
            clients={clients}
            visits={visits}
            talhoes={talhoes}
            presetClientId={visitPreset}
            onSave={saveVisitH}
            onOpenReport={(v) => setSheet({ kind: "report", visit: v })}
            toast={toast}
          />
        )}
        {tab === "funil" && (
          <Funil
            clients={clients}
            opportunities={opportunities}
            onMove={moveOpp}
          />
        )}
        {tab === "agenda" && (
          <Agenda
            clients={clients}
            visits={visits}
            onOpenClient={(id) => setSheet({ kind: "clientDetail", clientId: id })}
          />
        )}
      </div>

      {(tab === "clientes" || tab === "funil") && (
        <button
          className="fab"
          onClick={() =>
            tab === "clientes"
              ? setSheet({ kind: "clientForm", client: null, returnToDetail: false })
              : setSheet({ kind: "oppForm", opp: null })
          }
        >
          <IconPlus />
        </button>
      )}

      <div className="bottomnav">
        {NAV.map(({ tab: t, label, Icon }) => (
          <button
            key={t}
            className={"navbtn" + (tab === t ? " active" : "")}
            onClick={() => switchTab(t)}
          >
            <Icon />
            <span className="navlabel">{label}</span>
          </button>
        ))}
      </div>

      <div
        className={"overlay" + (sheet ? " open" : "")}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSheet(null);
        }}
      >
        <div className="sheet">
          {sheet?.kind === "clientForm" && (
            <ClientFormSheet
              client={sheet.client}
              onClose={() => setSheet(null)}
              onSubmit={submitClient}
              onDelete={removeClient}
              toast={toast}
            />
          )}
          {sheet?.kind === "clientDetail" && detailClient && (
            <ClientDetailSheet
              client={detailClient}
              visits={visits}
              opportunities={opportunities}
              talhoes={talhoes}
              onClose={() => setSheet(null)}
              onEdit={() =>
                setSheet({
                  kind: "clientForm",
                  client: detailClient,
                  returnToDetail: true,
                })
              }
              onNewVisit={() => startVisitForClient(detailClient.id)}
              onAddOpp={() =>
                setSheet({
                  kind: "oppForm",
                  opp: null,
                  presetClientId: detailClient.id,
                })
              }
              onAddTalhao={() =>
                setSheet({
                  kind: "talhaoForm",
                  talhao: null,
                  clientId: detailClient.id,
                  returnClientId: detailClient.id,
                })
              }
              onOpenTalhao={(t) =>
                setSheet({
                  kind: "talhaoForm",
                  talhao: t,
                  clientId: detailClient.id,
                  returnClientId: detailClient.id,
                })
              }
              toast={toast}
            />
          )}
          {sheet?.kind === "oppForm" && (
            <OppFormSheet
              opp={sheet.opp}
              presetClientId={sheet.presetClientId}
              clients={clients}
              onClose={() => setSheet(null)}
              onSubmit={submitOpp}
              onDelete={removeOpp}
              toast={toast}
            />
          )}
          {sheet?.kind === "talhaoForm" && (
            <TalhaoFormSheet
              talhao={sheet.talhao}
              clientId={sheet.clientId}
              clientNome={clientById(sheet.clientId)?.nome ?? ""}
              onClose={() => setSheet(null)}
              onSubmit={submitTalhao}
              onDelete={removeTalhao}
              toast={toast}
            />
          )}
          {sheet?.kind === "goals" && (
            <GoalsSheet
              settings={settings}
              onClose={() => setSheet(null)}
              onSubmit={submitGoals}
            />
          )}
          {sheet?.kind === "report" && (
            <ReportSheet
              visit={sheet.visit}
              client={clientById(sheet.visit.clientId)}
              talhaoNome={
                talhoes.find((t) => t.id === sheet.visit.talhaoId)?.nome
              }
              onClose={() => setSheet(null)}
              toast={toast}
            />
          )}
          {sheet?.kind === "account" && (
            <AccountSheet
              orgNome={orgNome}
              userNome={userNome}
              email={email}
              papel={papel}
              onClose={() => setSheet(null)}
              onLogout={doLogout}
            />
          )}
        </div>
      </div>

      <div className={"toast" + (toastShow ? " show" : "")}>{toastMsg}</div>
    </div>
  );
}
