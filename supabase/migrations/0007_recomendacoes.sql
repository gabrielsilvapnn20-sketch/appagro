-- =====================================================================
-- Recomendação estruturada (receituário) — produtos recomendados numa
-- visita, com dose e alvo. Base para um receituário agronômico.
-- =====================================================================

create table if not exists public.recomendacoes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  visit_id         uuid references public.visits (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  talhao_id        uuid references public.talhoes (id) on delete set null,
  produto          text not null,
  dose             numeric,
  unidade          text,
  alvo             text,
  observacoes      text,
  data             date not null default current_date,
  criado_em        timestamptz not null default now()
);
create index if not exists recomendacoes_organization_id_idx on public.recomendacoes (organization_id);
create index if not exists recomendacoes_visit_id_idx on public.recomendacoes (visit_id);
create index if not exists recomendacoes_talhao_id_idx on public.recomendacoes (talhao_id);

alter table public.recomendacoes enable row level security;

create policy recomendacoes_all on public.recomendacoes
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy recomendacoes_super_admin_select on public.recomendacoes
  for select using (public.is_super_admin());
