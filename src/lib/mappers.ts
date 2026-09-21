// Conversão entre linhas do Postgres (snake_case) e os tipos de aplicação.
import type {
  Client,
  MonitTipo,
  Monitoramento,
  Opportunity,
  Talhao,
  Visit,
  VisitPhoto,
} from "./domain";

export function monitoramentoFromRow(
  r: Record<string, unknown>
): Monitoramento {
  return {
    id: r.id as string,
    tipo: (r.tipo as MonitTipo) ?? "praga",
    alvo: (r.alvo as string) ?? "",
    nivel: r.nivel == null ? "" : String(r.nivel),
    unidade: (r.unidade as string) ?? "",
    obs: (r.observacoes as string) ?? "",
  };
}

export function clientFromRow(r: Record<string, unknown>): Client {
  return {
    id: r.id as string,
    nome: (r.nome as string) ?? "",
    fazenda: (r.fazenda as string) ?? "",
    regiao: (r.regiao as string) ?? "",
    areaHa: r.area_ha == null ? "" : String(r.area_ha),
    culturas: (r.culturas as string[]) ?? [],
    telefone: (r.telefone as string) ?? "",
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
    obs: (r.observacoes as string) ?? "",
    createdAt: (r.criado_em as string) ?? "",
  };
}

export function clientToRow(
  c: Partial<Client>,
  organizationId: string
): Record<string, unknown> {
  return {
    organization_id: organizationId,
    nome: c.nome ?? "",
    fazenda: c.fazenda || null,
    regiao: c.regiao || null,
    area_ha: c.areaHa ? Number(c.areaHa) : null,
    culturas: c.culturas ?? [],
    telefone: c.telefone || null,
    lat: c.lat ?? null,
    lng: c.lng ?? null,
    observacoes: c.obs || null,
  };
}

export function talhaoFromRow(r: Record<string, unknown>): Talhao {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    nome: (r.nome as string) ?? "",
    cultura: (r.cultura as string) ?? "",
    variedade: (r.variedade as string) ?? "",
    areaHa: r.area_ha == null ? "" : String(r.area_ha),
    dataPlantio: (r.data_plantio as string) ?? "",
    safra: (r.safra as string) ?? "",
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
    obs: (r.observacoes as string) ?? "",
    createdAt: (r.criado_em as string) ?? "",
  };
}

export function talhaoToRow(
  t: Partial<Talhao>,
  organizationId: string
): Record<string, unknown> {
  return {
    organization_id: organizationId,
    client_id: t.clientId,
    nome: t.nome ?? "",
    cultura: t.cultura || null,
    variedade: t.variedade || null,
    area_ha: t.areaHa ? Number(t.areaHa) : null,
    data_plantio: t.dataPlantio || null,
    safra: t.safra || null,
    lat: t.lat ?? null,
    lng: t.lng ?? null,
    observacoes: t.obs || null,
  };
}

export function visitFromRow(r: Record<string, unknown>): Visit {
  const fotos = (r.fotos as VisitPhoto[] | null) ?? [];
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    talhaoId: (r.talhao_id as string) ?? null,
    userId: (r.user_id as string) ?? null,
    date: (r.data as string) ?? "",
    nextReturnDate: (r.proximo_retorno as string) ?? "",
    fase: (r.fase_lavoura as string) ?? "",
    notas: (r.notas as string) ?? "",
    recomendacoes: (r.recomendacoes as string) ?? "",
    photos: Array.isArray(fotos) ? fotos : [],
    monitoramentos: [],
    createdAt: (r.criado_em as string) ?? "",
  };
}

export function oppFromRow(r: Record<string, unknown>): Opportunity {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    clientName: "",
    produto: (r.produto as string) ?? "",
    valor: Number(r.valor) || 0,
    estagio: (r.estagio as Opportunity["estagio"]) ?? "prospect",
    createdAt: (r.criado_em as string) ?? "",
    updatedAt: (r.atualizado_em as string) ?? "",
  };
}
