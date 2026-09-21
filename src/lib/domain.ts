// Constantes de domínio — extraídas verbatim do protótipo sulco.html.

export type StageKey =
  | "prospect"
  | "visita"
  | "proposta"
  | "negociacao"
  | "pedido"
  | "posvenda";

export const STAGES: { key: StageKey; label: string }[] = [
  { key: "prospect", label: "Prospecção" },
  { key: "visita", label: "Visita" },
  { key: "proposta", label: "Proposta" },
  { key: "negociacao", label: "Negociação" },
  { key: "pedido", label: "Pedido" },
  { key: "posvenda", label: "Pós-venda" },
];

export const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export const FASES_LAVOURA: { key: string; label: string }[] = [
  { key: "pre_plantio", label: "Pré-plantio / preparo" },
  { key: "plantio", label: "Plantio" },
  { key: "vegetativo", label: "Vegetativo / manejo" },
  { key: "floracao", label: "Floração" },
  { key: "enchimento", label: "Enchimento de grãos" },
  { key: "colheita", label: "Colheita" },
  { key: "pos_colheita", label: "Pós-colheita / entressafra" },
];

// Calendário de referência para grãos no Centro-Oeste (safra normal + safrinha)
// — orienta o roteiro, não é regra fixa
export const CALENDARIO_SAFRA: {
  cultura: string;
  fase: string;
  periodo: string;
}[] = [
  { cultura: "Soja (safra)", fase: "Plantio", periodo: "meados de setembro a novembro" },
  { cultura: "Soja (safra)", fase: "Manejo / floração", periodo: "dezembro a janeiro" },
  { cultura: "Soja (safra)", fase: "Colheita", periodo: "janeiro a março" },
  { cultura: "Milho (safrinha)", fase: "Plantio", periodo: "fevereiro a março, logo após a soja" },
  { cultura: "Milho (safrinha)", fase: "Manejo", periodo: "março a maio" },
  { cultura: "Milho (safrinha)", fase: "Colheita", periodo: "junho a agosto" },
];

// ---- Tipos de aplicação (forma normalizada usada nas telas) ----

export type VisitPhoto = { path: string; url?: string };

export type MonitTipo = "praga" | "doenca" | "daninha";

export const TIPOS_MONITORAMENTO: { key: MonitTipo; label: string }[] = [
  { key: "praga", label: "Praga" },
  { key: "doenca", label: "Doença" },
  { key: "daninha", label: "Planta daninha" },
];

export const UNIDADES_MONITORAMENTO = [
  "%",
  "indiv./m",
  "indiv./planta",
  "pontos/m",
  "nota (0-5)",
];

export type Monitoramento = {
  id: string;
  tipo: MonitTipo;
  alvo: string;
  nivel: string;
  unidade: string;
  obs: string;
};

export const UNIDADES_DOSE = [
  "L/ha",
  "kg/ha",
  "mL/ha",
  "g/ha",
  "L/100L",
  "dose/ha",
];

export type Recomendacao = {
  id: string;
  produto: string;
  dose: string;
  unidade: string;
  alvo: string;
  obs: string;
};

export type Client = {
  id: string;
  nome: string;
  fazenda: string;
  regiao: string;
  areaHa: string;
  culturas: string[];
  telefone: string;
  lat: number | null;
  lng: number | null;
  obs: string;
  createdAt: string;
};

export type Talhao = {
  id: string;
  clientId: string;
  nome: string;
  cultura: string;
  variedade: string;
  areaHa: string;
  dataPlantio: string;
  safra: string;
  lat: number | null;
  lng: number | null;
  obs: string;
  createdAt: string;
};

export type Visit = {
  id: string;
  clientId: string;
  talhaoId: string | null;
  userId: string | null;
  date: string;
  nextReturnDate: string;
  fase: string;
  notas: string;
  recomendacoes: string;
  photos: VisitPhoto[];
  monitoramentos: Monitoramento[];
  receituario: Recomendacao[];
  createdAt: string;
};

export type Opportunity = {
  id: string;
  clientId: string;
  clientName: string;
  produto: string;
  valor: number;
  estagio: StageKey;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  metaVisitasMes: number;
  metaVendasMes: number;
};

export type TabKey = "dashboard" | "clientes" | "visita" | "funil" | "agenda";
