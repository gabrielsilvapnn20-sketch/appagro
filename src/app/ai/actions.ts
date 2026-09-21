"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export type AssistInput = {
  clienteNome: string;
  cultura: string;
  talhao: string;
  fase: string;
  notas: string;
  monitoramentos: { tipo: string; alvo: string; nivel: string; unidade: string }[];
};

export type AssistResult = {
  error?: string;
  resumo?: string;
  recomendacao?: string;
};

const TIPO_LABEL: Record<string, string> = {
  praga: "Praga",
  doenca: "Doença",
  daninha: "Planta daninha",
};

const SYSTEM = `Você é um assistente agronômico para RTVs (representantes técnicos de vendas) de grãos (soja/milho) no Brasil.
A partir das anotações de uma visita de campo, você:
1) escreve um "resumo" curto e objetivo do assunto tratado (2 a 4 frases, português do Brasil, tom técnico e profissional);
2) sugere uma "recomendação" técnica de manejo, prática e coerente com a fase da lavoura e o monitoramento informado.
Regras importantes:
- Não invente dados que não foram informados.
- Não prescreva marcas comerciais nem doses exatas de defensivos; fale em termos de grupo/estratégia de manejo e oriente seguir a recomendação de um engenheiro agrônomo responsável e a bula.
- Seja conciso. Responda SOMENTE com um objeto JSON válido, sem texto fora do JSON, no formato:
{"resumo": "...", "recomendacao": "..."}`;

function parseJson(text: string): { resumo?: string; recomendacao?: string } {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  try {
    const obj = JSON.parse(t);
    return {
      resumo: typeof obj.resumo === "string" ? obj.resumo : undefined,
      recomendacao:
        typeof obj.recomendacao === "string" ? obj.recomendacao : undefined,
    };
  } catch {
    return {};
  }
}

export async function assistirVisita(
  input: AssistInput
): Promise<AssistResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "Configure ANTHROPIC_API_KEY no servidor para usar o assistente de IA.",
    };
  }

  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";

  const linhas: string[] = [];
  if (input.clienteNome) linhas.push("Produtor: " + input.clienteNome);
  if (input.cultura) linhas.push("Culturas: " + input.cultura);
  if (input.talhao) linhas.push("Talhão: " + input.talhao);
  if (input.fase) linhas.push("Fase da lavoura: " + input.fase);
  if (input.notas) linhas.push("Anotações da visita: " + input.notas);
  if (input.monitoramentos.length) {
    linhas.push("Monitoramento registrado:");
    input.monitoramentos.forEach((m) => {
      const nivel = m.nivel ? " — " + m.nivel + (m.unidade ? " " + m.unidade : "") : "";
      linhas.push(
        "- [" + (TIPO_LABEL[m.tipo] || m.tipo) + "] " + m.alvo + nivel
      );
    });
  }

  try {
    const resp = await client.messages.create({
      model,
      max_tokens: 1200,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content:
            "Gere o resumo e a recomendação para esta visita:\n\n" +
            linhas.join("\n"),
        },
      ],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const parsed = parseJson(text);
    if (!parsed.resumo && !parsed.recomendacao) {
      return { error: "A IA não retornou uma sugestão utilizável." };
    }
    return { resumo: parsed.resumo, recomendacao: parsed.recomendacao };
  } catch {
    return { error: "Não foi possível gerar a sugestão agora." };
  }
}
