-- =====================================================================
-- Monitoramento estruturado — ocorrências de praga/doença/daninha
-- registradas numa visita, opcionalmente ligadas a um talhão.
-- Vira histórico por talhão/cliente (base do trabalho agronômico).
-- =====================================================================

create table if not exists public.monitoramentos (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  visit_id         uuid references public.visits (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  talhao_id        uuid references public.talhoes (id) on delete set null,
  tipo             text not null default 'praga'
                     check (tipo in ('praga', 'doenca', 'daninha')),
  alvo             text not null,
  nivel            numeric,
  unidade          text,
  observacoes      text,
  data             date not null default current_date,
  criado_em        timestamptz not null default now()
);
create index if not exists monitoramentos_organization_id_idx on public.monitoramentos (organization_id);
create index if not exists monitoramentos_visit_id_idx on public.monitoramentos (visit_id);
create index if not exists monitoramentos_talhao_id_idx on public.monitoramentos (talhao_id);

alter table public.monitoramentos enable row level security;

create policy monitoramentos_all on public.monitoramentos
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy monitoramentos_super_admin_select on public.monitoramentos
  for select using (public.is_super_admin());
