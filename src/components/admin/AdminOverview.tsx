import Link from "next/link";
import { SulcoMark } from "@/components/SulcoMark";

export type OrgOverview = {
  organization_id: string;
  nome: string;
  plano: string;
  status: string;
  criado_em: string;
  ultimo_acesso: string | null;
  total_usuarios: number;
  total_clientes: number;
  total_oportunidades: number;
  total_visitas: number;
  visitas_mes: number;
};

function fmtDateTime(v: string | null): string {
  if (!v) return "nunca";
  const d = new Date(v);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusChipClass(status: string): string {
  if (status === "ativo") return "chip";
  if (status === "suspenso") return "chip gold";
  return "chip bad";
}

export function AdminOverview({ orgs }: { orgs: OrgOverview[] }) {
  const totalOrgs = orgs.length;
  const ativos = orgs.filter((o) => o.status === "ativo").length;
  const totalClientes = orgs.reduce((s, o) => s + Number(o.total_clientes), 0);
  const visitasMes = orgs.reduce((s, o) => s + Number(o.visitas_mes), 0);

  return (
    <div id="app">
      <div className="topbar">
        <div>
          <div className="brand">
            <SulcoMark />
            Sulco · Admin
          </div>
          <div className="topbar-sub">Painel do super administrador</div>
        </div>
        <div className="admin-topbar-actions">
          <Link href="/">← app</Link>
        </div>
      </div>

      <div className="content admin">
        <h1 className="title">Organizações</h1>
        <p className="subtitle">
          Contas cadastradas, plano, status e uso mensal por empresa
        </p>

        <div className="stat-grid">
          <div className="stat">
            <div className="num">{totalOrgs}</div>
            <div className="lbl">organizações</div>
          </div>
          <div className="stat">
            <div className="num">{ativos}</div>
            <div className="lbl">contas ativas</div>
          </div>
          <div className="stat">
            <div className="num">{totalClientes}</div>
            <div className="lbl">clientes no total</div>
          </div>
          <div className="stat">
            <div className="num">{visitasMes}</div>
            <div className="lbl">visitas este mês</div>
          </div>
        </div>

        <div className="section-head">
          <h2>Contas</h2>
        </div>

        {!orgs.length ? (
          <p className="subtitle" style={{ margin: 0 }}>
            Nenhuma organização cadastrada ainda.
          </p>
        ) : (
          orgs.map((o) => (
            <div className="card" key={o.organization_id}>
              <div className="org-card-head">
                <div>
                  <div className="nm">{o.nome}</div>
                  <div className="meta">
                    Cadastro em {fmtDateTime(o.criado_em)} · último acesso{" "}
                    {fmtDateTime(o.ultimo_acesso)} · {o.total_usuarios} usuário
                    {Number(o.total_usuarios) === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="chips" style={{ justifyContent: "flex-end" }}>
                  <span className="chip gold">{o.plano}</span>
                  <span className={statusChipClass(o.status)}>{o.status}</span>
                </div>
              </div>
              <div className="admin-stats">
                <div className="admin-stat">
                  <div className="n">{o.total_clientes}</div>
                  <div className="l">clientes</div>
                </div>
                <div className="admin-stat">
                  <div className="n">{o.visitas_mes}</div>
                  <div className="l">visitas/mês</div>
                </div>
                <div className="admin-stat">
                  <div className="n">{o.total_visitas}</div>
                  <div className="l">visitas total</div>
                </div>
                <div className="admin-stat">
                  <div className="n">{o.total_oportunidades}</div>
                  <div className="l">oportunidades</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
