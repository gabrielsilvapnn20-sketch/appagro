export default function Home() {
  return (
    <div id="app">
      <div className="topbar">
        <div>
          <div className="brand">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M12 2C12 2 6 6.5 6 12a6 6 0 0 0 12 0c0-5.5-6-10-6-10Z" />
              <path d="M12 22v-8" />
            </svg>
            Sulco
          </div>
          <div className="topbar-sub">CRM de campo para RTVs de grãos</div>
        </div>
      </div>
      <div className="content">
        <h1 className="title">Setup pronto</h1>
        <p className="subtitle">
          Etapa 1 concluída — projeto Next.js + Tailwind (tokens do protótipo) +
          schema Supabase com RLS. As 5 telas entram na etapa 3.
        </p>
      </div>
    </div>
  );
}
