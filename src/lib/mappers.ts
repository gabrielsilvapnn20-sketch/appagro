// Conversão entre linhas do Postgres (snake_case) e os tipos de aplicação.
import type { Client, Opportunity, Visit, VisitPhoto } from "./domain";

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

export function visitFromRow(r: Record<string, unknown>): Visit {
  const fotos = (r.fotos as VisitPhoto[] | null) ?? [];
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    userId: (r.user_id as string) ?? null,
    date: (r.data as string) ?? "",
    nextReturnDate: (r.proximo_retorno as string) ?? "",
    fase: (r.fase_lavoura as string) ?? "",
    notas: (r.notas as string) ?? "",
    recomendacoes: (r.recomendacoes as string) ?? "",
    photos: Array.isArray(fotos) ? fotos : [],
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
