# Sulco — CRM de campo (SaaS multiempresa)

CRM de campo para RTVs (representantes técnicos de vendas) de grãos (soja/milho).
Versão comercial multiempresa do protótipo `sulco.html`, mantendo o visual idêntico
e adicionando login/cadastro, escopo por organização (RLS) e painel de administrador.

## Stack

- **Next.js** (App Router) + **TypeScript**, mobile-first
- **Tailwind** configurado com as variáveis de cor/fonte exatas do protótipo
- **Supabase**: Auth (email/senha), Postgres com Row Level Security, Storage (fotos)
- Deploy em **Vercel**

## Rodando localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um projeto no [Supabase](https://supabase.com) e rode as migrations em
   `supabase/migrations/` na ordem (`0001` → `0004`), pelo SQL Editor ou pela
   Supabase CLI.
3. Em **Authentication → Providers → Email**, deixe *Confirm email* **desligado**
   (padrão deste projeto; se ligar, o fluxo de confirmação em `/auth/confirm` já
   está pronto).
4. Copie `.env.example` para `.env.local` e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Suba o servidor:
   ```bash
   npm run dev
   ```

## Modelo de dados

- `organizations` (nome, plano, status, criado_em)
- `users` (organization_id, nome, email, papel: dono/rtv, ultimo_acesso)
- `platform_admins` (super_admins do painel)
- `clients`, `visits`, `opportunities` — todos com `organization_id`
- `org_settings` (metas do mês por organização)
- Storage: bucket privado `visit-photos` (`<organization_id>/<visit_id>/<arquivo>`)

Toda tabela tem **RLS**: o usuário só acessa linhas da própria `organization_id`.
Um super_admin (linha em `platform_admins`) tem leitura global para o painel.

## Cadastro

Ao criar a conta, o trigger `handle_new_user()` cria a **organização** e o perfil
do usuário como `dono`, automaticamente.

## Equipe (dono + RTVs)

O dono vê os membros da organização e adiciona RTVs (tocando na pílula
"online" → **Equipe**). Adicionar RTV cria o usuário via service role e o
vincula à mesma organização, retornando uma senha temporária para compartilhar.
Requer `SUPABASE_SERVICE_ROLE_KEY` configurada no servidor (nunca exposta ao
browser).

## Painel super_admin

Acesse `/admin`. Para promover um usuário:

```sql
insert into public.platform_admins (user_id)
values ('<uuid-do-usuario-em-auth.users>');
```

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e `SUPABASE_SERVICE_ROLE_KEY` se for usar).
3. Em **Authentication → URL Configuration** do Supabase, adicione a URL da Vercel
   nas *Redirect URLs*.

## Cobrança (Stripe)

Planejada para depois da validação com clientes reais (não implementada ainda).
