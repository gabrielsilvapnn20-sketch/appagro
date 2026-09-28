"use client";

import { useEffect, useRef, useState } from "react";
import {
  STAGES,
  type Client,
  type Opportunity,
  type Member,
  type Monitoramento,
  type Produto,
  type Recomendacao,
  type Settings,
  type TabKey,
  type Talhao,
  type Visit,
} from "@/lib/domain";
import {
  deleteClient,
  deleteOpportunity,
  deleteProduto,
  deleteTalhao,
  moveOpportunity,
  saveClient,
  saveOpportunity,
  saveProduto,
  saveSettings,
  saveTalhao,
  saveVisit,
} from "@/lib/data";
import { logout } from "@/app/auth/actions";
import { alertsList } from "@/lib/derive";
import {
  enqueueVisit,
  isOnline,
  loadQueue,
  pendingCount,
  removeFromQueue,
} from "@/lib/offline";
import { isStandalone } from "@/lib/pwa";
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
  BiSheet,
  CatalogoSheet,
  ClientDetailSheet,
  ClientFormSheet,
  EquipeSheet,
  GoalsSheet,
  InstallSheet,
  OppFormSheet,
  ReportSheet,
  TalhaoFormSheet,
} from "./Sheets";
import { IconMenu } from "./icons";

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
  | { kind: "equipe" }
  | { kind: "catalogo" }
  | { kind: "bi" }
  | { kind: "install" }
  | null;

export type AppRootProps = {
  orgId: string;
  userId: string;
  orgNome: string;
  userNome: string;
  email: string;
  papel: string;
  members: Member[];
  initial: {
    clients: Client[];
    visits: Visit[];
    opportunities: Opportunity[];
    talhoes: Talhao[];
    produtos: Produto[];
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
  members: initialMembers,
  initial,
}: AppRootProps) {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [clients, setClients] = useState<Client[]>(initial.clients);
  const [visits, setVisits] = useState<Visit[]>(initial.visits);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    initial.opportunities
  );
  const [talhoes, setTalhoes] = useState<Talhao[]>(initial.talhoes);
  const [produtos, setProdutos] = useState<Produto[]>(initial.produtos);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [search, setSearch] = useState("");
  const [visitPreset, setVisitPreset] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    try {
      const dismissed =
        localStorage.getItem("agrogiro_install_dismiss") === "1";
      if (!dismissed && !isStandalone()) setShowInstall(true);
    } catch {
      /* ignore */
    }
  }, []);

  function dismissInstall() {
    setShowInstall(false);
    try {
      localStorage.setItem("agrogiro_install_dismiss", "1");
    } catch {
      /* ignore */
    }
  }

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

  // ------- catálogo de produtos
  async function submitProduto(id: string | null, data: Partial<Produto>) {
    try {
      const saved = await saveProduto(orgId, id, data);
      setProdutos((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        return exists
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [...prev, saved];
      });
      toast(id ? "Produto atualizado" : "Produto adicionado");
    } catch {
      toast("Não foi possível salvar o produto");
    }
  }

  async function removeProduto(id: string) {
    try {
      await deleteProduto(id);
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      toast("Produto removido");
    } catch {
      toast("Não foi possível remover");
    }
  }

  async function saveAgronomo(nome: string, crea: string, uf: string) {
    const s: Settings = {
      ...settings,
      agronomoNome: nome,
      agronomoCrea: crea,
      agronomoUf: uf,
    };
    setSettings(s);
    setSheet(null);
    toast("Agrônomo responsável salvo");
    try {
      await saveSettings(orgId, s);
    } catch {
      /* mantém localmente */
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
    // Sem conexão: guarda no aparelho e sincroniza quando a internet voltar.
    if (!isOnline()) {
      const item = enqueueVisit(data, monitoramentos, receituario);
      const localVisit: Visit = {
        id: item.id,
        clientId: data.clientId,
        talhaoId: data.talhaoId || null,
        userId,
        date: data.date,
        nextReturnDate: data.nextReturnDate,
        fase: data.fase,
        notas: data.notas,
        recomendacoes: data.recomendacoes,
        photos: [],
        monitoramentos,
        receituario,
        createdAt: new Date().toISOString(),
      };
      setVisits((prev) => [localVisit, ...prev]);
      setPending(pendingCount());
      toast(
        files.length
          ? "Sem sinal — visita salva no aparelho (adicione fotos ao sincronizar)"
          : "Sem sinal — visita salva no aparelho, sincroniza ao voltar"
      );
      return true;
    }
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

  // Sincroniza a fila offline de visitas
  async function flushQueue() {
    if (!isOnline()) return;
    const q = loadQueue();
    if (!q.length) return;
    let done = 0;
    for (const item of q) {
      try {
        const visit = await saveVisit(
          orgId,
          userId,
          item.data,
          [],
          item.monitoramentos,
          item.receituario
        );
        setVisits((prev) => [visit, ...prev.filter((v) => v.id !== item.id)]);
        removeFromQueue(item.id);
        done++;
      } catch {
        /* mantém na fila para a próxima tentativa */
      }
    }
    setPending(pendingCount());
    if (done) toast(done + " visita(s) sincronizada(s)");
  }

  // Estado de conexão + sincronização automática
  useEffect(() => {
    setOnline(isOnline());
    setPending(pendingCount());
    if (isOnline()) flushQueue();
    const goOnline = () => {
      setOnline(true);
      flushQueue();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- pull-to-refresh (gesto iOS)
  const pullStart = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const el = contentRef.current;
    if (el && el.scrollTop <= 0) pullStart.current = e.touches[0].clientY;
    else pullStart.current = null;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (pullStart.current == null || refreshing) return;
    const dy = e.touches[0].clientY - pullStart.current;
    if (dy > 0) setPullY(Math.min(90, dy * 0.5));
  }
  function onTouchEnd() {
    if (pullStart.current == null) return;
    if (pullY > 60) {
      setRefreshing(true);
      setTimeout(() => window.location.reload(), 300);
    } else {
      setPullY(0);
    }
    pullStart.current = null;
  }

  function startVisitForClient(clientId: string) {
    setSheet(null);
    switchTab("visita");
    setVisitPreset(clientId);
  }

  async function doLogout() {
    await logout();
  }

  // ------- notificações
  function notifyReturns() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const due = alertsList(clients, visits).filter(
      (a) => a.kind === "atraso" || a.kind === "retorno"
    );
    if (!due.length) return;
    const hoje = due.filter((a) => a.sortD <= 0);
    const title = hoje.length
      ? `${hoje.length} retorno(s) para hoje`
      : `${due.length} retorno(s) próximos`;
    const body = due.slice(0, 3).map((a) => a.text).join("\n");
    try {
      new Notification(title, { body, icon: "/icons/icon-192.png" });
    } catch {
      /* ignore */
    }
  }

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast("Notificações não suportadas neste aparelho");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setSheet(null);
        setTimeout(notifyReturns, 400);
        // Inscreve para push (lembretes com o app fechado), se configurado
        try {
          const { subscribeToPush } = await import("@/lib/push");
          const r = await subscribeToPush();
          toast(
            r === "ok"
              ? "Notificações ativadas (inclusive com o app fechado)"
              : "Notificações ativadas neste aparelho"
          );
        } catch {
          toast("Notificações ativadas neste aparelho");
        }
      } else {
        toast("Permissão de notificação negada");
      }
    } catch {
      toast("Não foi possível ativar as notificações");
    }
  }

  // ao abrir o app, se já autorizado, lembra dos retornos pendentes
  useEffect(() => {
    notifyReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detailClient =
    sheet?.kind === "clientDetail" ? clientById(sheet.clientId) : null;

  return (
    <div id="app">
      {(!online || pending > 0) && (
        <div className={"conn-bar" + (online ? " sync" : "")}>
          {online
            ? pending + " visita(s) aguardando sincronização…"
            : "Sem conexão — você pode registrar visitas e sincronizamos depois"}
        </div>
      )}

      <div
        className="content"
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {(pullY > 0 || refreshing) && (
          <div
            className="ptr"
            style={{ height: refreshing ? 40 : pullY, opacity: refreshing ? 1 : pullY / 60 }}
          >
            <span className={"ptr-spin" + (refreshing ? " on" : "")}>↻</span>
            {refreshing
              ? "Atualizando…"
              : pullY > 60
              ? "Solte para atualizar"
              : "Puxe para atualizar"}
          </div>
        )}

        <div className="apphead">
          <div className="brand">
            <SulcoMark />
            AgroGiro
          </div>
          <button
            className="menu-btn"
            aria-label="Abrir menu"
            onClick={() => setSheet({ kind: "account" })}
          >
            <IconMenu />
          </button>
        </div>

        {showInstall && (
          <div className="install-banner">
            <span className="ib-ico">📲</span>
            <button
              className="ib-txt"
              onClick={() => setSheet({ kind: "install" })}
            >
              Instale o AgroGiro no seu celular — toque para ver como
            </button>
            <button
              className="ib-x"
              aria-label="Dispensar"
              onClick={dismissInstall}
            >
              ✕
            </button>
          </div>
        )}

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
            onQuickVisit={startVisitForClient}
          />
        )}
        {tab === "visita" && (
          <VisitaScreen
            clients={clients}
            visits={visits}
            talhoes={talhoes}
            produtos={produtos}
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
          {sheet?.kind === "bi" && (
            <BiSheet
              clients={clients}
              visits={visits}
              opportunities={opportunities}
              members={members}
              orgNome={orgNome}
              onClose={() => setSheet(null)}
              toast={toast}
            />
          )}
          {sheet?.kind === "catalogo" && (
            <CatalogoSheet
              produtos={produtos}
              onClose={() => setSheet(null)}
              onSubmit={submitProduto}
              onDelete={removeProduto}
              toast={toast}
            />
          )}
          {sheet?.kind === "equipe" && (
            <EquipeSheet
              members={members}
              isOwner={papel === "dono"}
              onClose={() => setSheet(null)}
              onInvited={(m) =>
                setMembers((prev) =>
                  prev.some((x) => x.id === m.id) ? prev : [...prev, m]
                )
              }
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
              talhaoAreaHa={
                talhoes.find((t) => t.id === sheet.visit.talhaoId)?.areaHa
              }
              settings={settings}
              orgNome={orgNome}
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
              onEquipe={() => setSheet({ kind: "equipe" })}
              onCatalogo={() => setSheet({ kind: "catalogo" })}
              onRelatorios={() => setSheet({ kind: "bi" })}
              onNotifications={enableNotifications}
              onInstall={() => setSheet({ kind: "install" })}
              agronomoNome={settings.agronomoNome}
              agronomoCrea={settings.agronomoCrea}
              agronomoUf={settings.agronomoUf}
              onSaveAgronomo={saveAgronomo}
            />
          )}
          {sheet?.kind === "install" && (
            <InstallSheet onClose={() => setSheet(null)} />
          )}
        </div>
      </div>

      <div className={"toast" + (toastShow ? " show" : "")}>{toastMsg}</div>
    </div>
  );
}
