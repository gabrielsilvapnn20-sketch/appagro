-- =====================================================================
-- Catálogo de produtos + Portal do produtor
-- =====================================================================

-- Catálogo de produtos da organização (dose padrão, unidade, alvo, preço)
create table if not exists public.produtos (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  nome             text not null,
  dose_padrao      numeric,
  unidade          text,
  alvo             text,
  preco            numeric,
  criado_em        timestamptz not null default now()
);
create index if not exists produtos_organization_id_idx on public.produtos (organization_id);

alter table public.produtos enable row level security;

create policy produtos_all on public.produtos
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy produtos_super_admin_select on public.produtos
  for select using (public.is_super_admin());

-- Portal do produtor: token de compartilhamento por cliente
alter table public.clients
  add column if not exists share_token uuid unique default gen_random_uuid();

-- Visão pública read-only da ficha do cliente (sem login), só via token.
create or replace function public.public_client(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when c.id is null then null else jsonb_build_object(
    'nome', c.nome,
    'fazenda', c.fazenda,
    'regiao', c.regiao,
    'area_ha', c.area_ha,
    'culturas', c.culturas,
    'org', (select o.nome from public.organizations o where o.id = c.organization_id),
    'talhoes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', t.nome, 'cultura', t.cultura, 'variedade', t.variedade, 'area_ha', t.area_ha
      ) order by t.nome)
      from public.talhoes t where t.client_id = c.id
    ), '[]'::jsonb),
    'visitas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'data', v.data, 'fase', v.fase_lavoura, 'notas', v.notas, 'recomendacoes', v.recomendacoes
      ) order by v.data desc)
      from public.visits v where v.client_id = c.id
    ), '[]'::jsonb)
  ) end
  from public.clients c
  where c.share_token = p_token;
$$;

grant execute on function public.public_client(uuid) to anon, authenticated;
