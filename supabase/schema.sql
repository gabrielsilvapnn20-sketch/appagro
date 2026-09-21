-- ==============================================================
-- Sulco — schema completo (todas as migrations 0001–0008)
-- Cole no SQL Editor do Supabase e execute uma vez.
-- ==============================================================


-- >>> 0001_init.sql
-- =====================================================================
-- Sulco SaaS — schema inicial (multiempresa) + Row Level Security
-- Cada registro pertence a uma organization_id. Usuário só acessa
-- linhas da própria organização. super_admin acessa o painel global.
-- =====================================================================

-- gen_random_uuid() disponível no Supabase via pgcrypto
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

-- organizations (id, nome, plano, status, criado_em)
create table if not exists public.organizations (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  plano        text not null default 'trial'
                 check (plano in ('trial', 'basico', 'pro', 'enterprise')),
  status       text not null default 'ativo'
                 check (status in ('ativo', 'suspenso', 'cancelado')),
  criado_em    timestamptz not null default now()
);

-- users (id, organization_id, nome, email, papel: dono/rtv)
-- id casa com auth.users.id (o perfil de aplicação do usuário autenticado)
create table if not exists public.users (
  id               uuid primary key references auth.users (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  nome             text not null default '',
  email            text not null,
  papel            text not null default 'rtv' check (papel in ('dono', 'rtv')),
  ultimo_acesso    timestamptz,
  criado_em        timestamptz not null default now()
);
create index if not exists users_organization_id_idx on public.users (organization_id);

-- platform_admins: super_admins (acesso global ao painel). Fora do escopo
-- de organização de propósito.
create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  criado_em  timestamptz not null default now()
);

-- clients
create table if not exists public.clients (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  nome             text not null,
  fazenda          text,
  regiao           text,
  area_ha          numeric,
  culturas         text[] not null default '{}',
  telefone         text,
  lat              double precision,
  lng              double precision,
  observacoes      text,
  criado_em        timestamptz not null default now()
);
create index if not exists clients_organization_id_idx on public.clients (organization_id);

-- visits
create table if not exists public.visits (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  client_id         uuid not null references public.clients (id) on delete cascade,
  user_id           uuid references public.users (id) on delete set null,
  data              date not null default current_date,
  fase_lavoura      text,
  notas             text,
  recomendacoes     text,
  fotos             jsonb not null default '[]',
  proximo_retorno   date,
  criado_em         timestamptz not null default now()
);
create index if not exists visits_organization_id_idx on public.visits (organization_id);
create index if not exists visits_client_id_idx on public.visits (client_id);

-- opportunities
create table if not exists public.opportunities (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  client_id         uuid not null references public.clients (id) on delete cascade,
  produto           text,
  valor             numeric not null default 0,
  estagio           text not null default 'prospect'
                      check (estagio in ('prospect', 'visita', 'proposta',
                                         'negociacao', 'pedido', 'posvenda')),
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index if not exists opportunities_organization_id_idx on public.opportunities (organization_id);
create index if not exists opportunities_client_id_idx on public.opportunities (client_id);

-- ---------------------------------------------------------------------
-- Funções auxiliares (SECURITY DEFINER evita recursão de RLS na tabela users)
-- ---------------------------------------------------------------------

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- Cria a organização e o usuário-dono numa transação. Chamada logo após o
-- cadastro (etapa 2). SECURITY DEFINER porque insere antes de o perfil existir.
create or replace function public.create_org_and_owner(
  p_org_nome   text,
  p_user_nome  text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_uid    uuid := auth.uid();
  v_email  text;
begin
  if v_uid is null then
    raise exception 'não autenticado';
  end if;

  -- impede criar uma segunda organização para um usuário que já tem perfil
  if exists (select 1 from public.users where id = v_uid) then
    raise exception 'usuário já pertence a uma organização';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.organizations (nome)
  values (coalesce(nullif(p_org_nome, ''), 'Minha empresa'))
  returning id into v_org_id;

  insert into public.users (id, organization_id, nome, email, papel)
  values (v_uid, v_org_id, coalesce(p_user_nome, ''), coalesce(v_email, ''), 'dono');

  return v_org_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.organizations   enable row level security;
alter table public.users           enable row level security;
alter table public.platform_admins enable row level security;
alter table public.clients         enable row level security;
alter table public.visits          enable row level security;
alter table public.opportunities   enable row level security;

-- organizations: membros leem a própria; dono atualiza a própria; super_admin lê todas
create policy organizations_select on public.organizations
  for select using (id = public.current_org_id() or public.is_super_admin());

create policy organizations_update on public.organizations
  for update using (
    public.is_super_admin()
    or (id = public.current_org_id()
        and exists (select 1 from public.users u
                    where u.id = auth.uid() and u.papel = 'dono'))
  );

-- users: usuário lê/edita perfis da própria organização; super_admin lê todos
create policy users_select on public.users
  for select using (organization_id = public.current_org_id() or public.is_super_admin());

create policy users_update on public.users
  for update using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- platform_admins: apenas super_admin enxerga a lista
create policy platform_admins_select on public.platform_admins
  for select using (public.is_super_admin());

-- Macro de políticas por organização para as tabelas de dados.
-- clients
create policy clients_all on public.clients
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- visits
create policy visits_all on public.visits
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- opportunities
create policy opportunities_all on public.opportunities
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- Leitura global para o painel super_admin (somente SELECT).
create policy clients_super_admin_select on public.clients
  for select using (public.is_super_admin());
create policy visits_super_admin_select on public.visits
  for select using (public.is_super_admin());
create policy opportunities_super_admin_select on public.opportunities
  for select using (public.is_super_admin());

-- ---------------------------------------------------------------------
-- Storage — fotos das visitas (bucket privado, escopado por organização)
-- Caminho do arquivo: <organization_id>/<visit_id>/<arquivo>
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', false)
on conflict (id) do nothing;

create policy visit_photos_select on storage.objects
  for select using (
    bucket_id = 'visit-photos'
    and (
      (storage.foldername(name))[1] = public.current_org_id()::text
      or public.is_super_admin()
    )
  );

create policy visit_photos_insert on storage.objects
  for insert with check (
    bucket_id = 'visit-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy visit_photos_delete on storage.objects
  for delete using (
    bucket_id = 'visit-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );


-- >>> 0002_signup_trigger.sql
-- =====================================================================
-- Cadastro cria a organização automaticamente.
-- Trigger em auth.users: ao criar um novo usuário de autenticação, cria a
-- organização e o perfil-dono lendo os metadados enviados no signUp
-- (raw_user_meta_data: 'nome' e 'org_nome'). Robusto tanto com confirmação
-- de email ligada quanto desligada.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- idempotente: não recria se o perfil já existir
  if exists (select 1 from public.users where id = new.id) then
    return new;
  end if;

  insert into public.organizations (nome)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'org_nome', ''), 'Minha empresa'))
  returning id into v_org_id;

  insert into public.users (id, organization_id, nome, email, papel)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.email, ''),
    'dono'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- >>> 0003_org_settings.sql
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


-- >>> 0004_admin_overview.sql
-- =====================================================================
-- Painel super_admin: visão geral das organizações com uso por conta.
-- SECURITY DEFINER + checagem is_super_admin() para varrer todas as orgs.
-- =====================================================================

create or replace function public.admin_org_overview()
returns table (
  organization_id uuid,
  nome text,
  plano text,
  status text,
  criado_em timestamptz,
  ultimo_acesso timestamptz,
  total_usuarios bigint,
  total_clientes bigint,
  total_oportunidades bigint,
  total_visitas bigint,
  visitas_mes bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'acesso negado';
  end if;

  return query
  select
    o.id,
    o.nome,
    o.plano,
    o.status,
    o.criado_em,
    (select max(u.ultimo_acesso) from public.users u
       where u.organization_id = o.id),
    (select count(*) from public.users u
       where u.organization_id = o.id),
    (select count(*) from public.clients c
       where c.organization_id = o.id),
    (select count(*) from public.opportunities op
       where op.organization_id = o.id),
    (select count(*) from public.visits v
       where v.organization_id = o.id),
    (select count(*) from public.visits v
       where v.organization_id = o.id
         and to_char(v.data, 'YYYY-MM') = to_char(current_date, 'YYYY-MM'))
  from public.organizations o
  order by o.criado_em desc;
end;
$$;

-- Como promover alguém a super_admin (rodar manualmente, uma vez):
--   insert into public.platform_admins (user_id)
--   values ('<uuid-do-usuario-em-auth.users>');


-- >>> 0005_talhoes.sql
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


-- >>> 0006_monitoramentos.sql
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


-- >>> 0007_recomendacoes.sql
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


-- >>> 0008_team.sql
-- =====================================================================
-- Equipe: o dono pode adicionar RTVs à sua organização.
-- Usuários convidados (metadata invited=true) NÃO criam uma nova
-- organização — a action de convite (service role) insere o perfil na
-- organização do dono. Só o cadastro comum cria organização.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- idempotente
  if exists (select 1 from public.users where id = new.id) then
    return new;
  end if;

  -- usuário convidado para uma organização existente: não cria org aqui
  if coalesce(new.raw_user_meta_data ->> 'invited', '') = 'true' then
    return new;
  end if;

  insert into public.organizations (nome)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'org_nome', ''), 'Minha empresa'))
  returning id into v_org_id;

  insert into public.users (id, organization_id, nome, email, papel)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.email, ''),
    'dono'
  );

  return new;
end;
$$;

