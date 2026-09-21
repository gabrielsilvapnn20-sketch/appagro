-- =====================================================================
-- Metas do mês por organização (no protótipo eram um "settings/app" único).
-- Qualquer membro da organização pode ler e ajustar as metas.
-- =====================================================================

create table if not exists public.org_settings (
  organization_id   uuid primary key references public.organizations (id) on delete cascade,
  meta_visitas_mes  integer not null default 20,
  meta_vendas_mes   numeric not null default 50000,
  atualizado_em     timestamptz not null default now()
);

alter table public.org_settings enable row level security;

create policy org_settings_all on public.org_settings
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy org_settings_super_admin_select on public.org_settings
  for select using (public.is_super_admin());
