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
