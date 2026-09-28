import { createClient } from "@/lib/supabase/server";
import { SulcoMark } from "@/components/SulcoMark";
import { FASES_LAVOURA } from "@/lib/domain";

export const dynamic = "force-dynamic";

function fmtDate(d?: string): string {
  if (!d) return "";
  const p = String(d).split("-");
  if (p.length < 3) return d;
  return p[2].slice(0, 2) + "/" + p[1] + "/" + p[0];
}
function faseLabel(k?: string): string {
  if (!k) return "";
  return (FASES_LAVOURA.find((f) => f.key === k) || {}).label || k;
}

type Talhao = { nome: string; cultura?: string; variedade?: string; area_ha?: number };
type Visita = { data?: string; fase?: string; notas?: string; recomendacoes?: string };
type Ficha = {
  nome: string;
  fazenda?: string;
  regiao?: string;
  area_ha?: number;
  culturas?: string[];
  org?: string;
  talhoes: Talhao[];
  visitas: Visita[];
};

export default async function PortalProdutor({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_client", { p_token: token });
  const c = data as Ficha | null;

  if (!c) {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        <p>Ficha não encontrada ou link expirado.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div
        className="topbar"
        style={{ justifyContent: "space-between" }}
      >
        <div className="brand">
          <SulcoMark />
          AgroGiro
        </div>
        {c.org && <div className="topbar-sub">{c.org}</div>}
      </div>

      <div
        className="content"
        style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}
      >
        <h1 className="title">{c.nome}</h1>
        <p className="subtitle">Ficha do produtor · acompanhamento técnico</p>

        <div className="chips" style={{ marginBottom: 12 }}>
          {c.regiao && <span className="chip">{c.regiao}</span>}
          {c.area_ha != null && (
            <span className="chip gold">{c.area_ha} ha</span>
          )}
          {(c.culturas || []).map((cu, i) => (
            <span className="chip" key={i}>
              {cu}
            </span>
          ))}
        </div>
        {c.fazenda && (
          <div className="field-view">
            <div className="k">FAZENDA</div>
            {c.fazenda}
          </div>
        )}

        <div className="section-head">
          <h2>Talhões</h2>
        </div>
        {c.talhoes.length ? (
          <div className="card" style={{ padding: "4px 10px" }}>
            {c.talhoes.map((t, i) => {
              const sub = [t.cultura, t.variedade, t.area_ha ? t.area_ha + " ha" : ""]
                .filter(Boolean)
                .join(" · ");
              return (
                <div className="client-item" key={i} style={{ cursor: "default" }}>
                  <div className="avatar">{(t.nome || "T")[0].toUpperCase()}</div>
                  <div className="meta">
                    <div className="name">{t.nome}</div>
                    <div className="sub">{sub || "sem detalhes"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="subtitle" style={{ margin: 0 }}>
            Nenhum talhão cadastrado.
          </p>
        )}

        <div className="section-head">
          <h2>Últimas visitas</h2>
        </div>
        {c.visitas.length ? (
          <div className="visit-log">
            {c.visitas.map((v, i) => (
              <div className="vl-item" key={i}>
                <div className="vl-date">{fmtDate(v.data)}</div>
                {v.fase && (
                  <span
                    className="chip gold"
                    style={{ marginTop: 4, display: "inline-block" }}
                  >
                    {faseLabel(v.fase)}
                  </span>
                )}
                {v.notas && <div className="vl-notes">{v.notas}</div>}
                {v.recomendacoes && (
                  <div className="vl-notes">
                    <b>Recomendação:</b> {v.recomendacoes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="subtitle" style={{ margin: 0 }}>
            Nenhuma visita registrada ainda.
          </p>
        )}

        <p
          className="subtitle"
          style={{ marginTop: 28, textAlign: "center", fontSize: 12 }}
        >
          Feito com AgroGiro · CRM de campo
        </p>
      </div>
    </div>
  );
}
