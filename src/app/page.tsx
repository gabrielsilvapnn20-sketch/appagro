import { redirect } from "next/navigation";
import { SulcoMark } from "@/components/SulcoMark";
import { ensureProfile } from "@/lib/profile";
import { logout } from "@/app/auth/actions";

export default async function Home() {
  const data = await ensureProfile();
  if (!data) redirect("/login");
  const { profile, organization } = data;

  return (
    <div id="app">
      <div className="topbar">
        <div>
          <div className="brand">
            <SulcoMark />
            Sulco
          </div>
          <div className="topbar-sub">{organization.nome}</div>
        </div>
        <form action={logout}>
          <button className="offline-pill" type="submit">
            Sair
          </button>
        </form>
      </div>

      <div className="content">
        <h1 className="title">Olá, {profile.nome || "RTV"}</h1>
        <p className="subtitle">
          Autenticação e cadastro prontos (etapa 2). Sua empresa{" "}
          <b>{organization.nome}</b> foi criada e você é o{" "}
          {profile.papel === "dono" ? "dono" : "RTV"} da conta.
        </p>

        <div className="card">
          <div className="field-view">
            <div className="k">EMPRESA</div>
            {organization.nome}
          </div>
          <div className="field-view">
            <div className="k">PLANO</div>
            {organization.plano}
          </div>
          <div className="field-view">
            <div className="k">SEU EMAIL</div>
            {profile.email}
          </div>
        </div>

        <p className="subtitle" style={{ marginTop: 16 }}>
          As 5 telas do protótipo (Início, Clientes, Visita, Funil, Agenda)
          entram na etapa 3, já escopadas por organização.
        </p>
      </div>
    </div>
  );
}
