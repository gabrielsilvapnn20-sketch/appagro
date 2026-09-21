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
