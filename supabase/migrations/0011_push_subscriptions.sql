-- =====================================================================
-- Web Push — inscrições de notificação por usuário (lembretes de retorno)
-- =====================================================================

create table if not exists public.push_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.users (id) on delete cascade,
  endpoint         text not null unique,
  p256dh           text not null,
  auth             text not null,
  criado_em        timestamptz not null default now()
);
create index if not exists push_subscriptions_org_idx
  on public.push_subscriptions (organization_id);

alter table public.push_subscriptions enable row level security;

-- Cada usuário gerencia apenas as próprias inscrições.
-- O envio das notificações é feito pela função agendada com a service role,
-- que ignora o RLS.
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and organization_id = public.current_org_id());
