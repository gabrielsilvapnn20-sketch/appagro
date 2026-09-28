-- =====================================================================
-- Receituário Agronômico + ART e Orçamento
-- - Dados do agrônomo responsável na organização (nome, CREA, UF)
-- - Preço estimado por item do receituário (para orçamento e custo/ha)
-- =====================================================================

alter table public.org_settings
  add column if not exists agronomo_nome text,
  add column if not exists agronomo_crea text,
  add column if not exists agronomo_uf   text;

alter table public.recomendacoes
  add column if not exists preco numeric;
