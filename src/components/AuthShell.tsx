import { SulcoMark } from "./SulcoMark";

/** Casca das telas de auth: topo verde (marca Sulco) + card claro. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="brand">
          <SulcoMark />
          Sulco
        </div>
        <div className="tagline">CRM de campo para RTVs de grãos</div>
      </div>
      <div className="auth-body">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
