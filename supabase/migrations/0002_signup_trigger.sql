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
