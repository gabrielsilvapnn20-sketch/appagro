-- =====================================================================
-- Talhões — divisão da fazenda (unidade central do trabalho agronômico).
-- Cada talhão pertence a um cliente e a uma organização. As visitas podem,
-- opcionalmente, apontar para um talhão.
-- =====================================================================

create table if not exists public.talhoes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  nome             text not null,
  cultura          text,
  variedade        text,
  area_ha          numeric,
  data_plantio     date,
  safra            text,
  lat              double precision,
  lng              double precision,
  observacoes      text,
  criado_em        timestamptz not null default now()
);
create index if not exists talhoes_organization_id_idx on public.talhoes (organization_id);
create index if not exists talhoes_client_id_idx on public.talhoes (client_id);

-- visitas podem referenciar um talhão
alter table public.visits
  add column if not exists talhao_id uuid references public.talhoes (id) on delete set null;
create index if not exists visits_talhao_id_idx on public.visits (talhao_id);

alter table public.talhoes enable row level security;

create policy talhoes_all on public.talhoes
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy talhoes_super_admin_select on public.talhoes
  for select using (public.is_super_admin());
