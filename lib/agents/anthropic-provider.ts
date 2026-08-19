import "server-only";

import type { AIGenerationResult, AIProvider, CampaignCorrection } from "./ai-provider";
import type { CampaignContext } from "./campaign-context";
import { parseAnthropicJsonResponse } from "./anthropic-json-response";
import { STRATEGIST_SYSTEM_PROMPT, STRATEGIST_PROMPT_VERSION } from "@/lib/prompts/strategist-v1";
import { ASSET_LIMITS, RSA_LIMITS } from "@/lib/google-ads/limits";
import {
  BIDDING_STRATEGIES,
  CAMPAIGN_OBJECTIVES,
  KEYWORD_MATCH_TYPES,
  NEGATIVE_CATEGORIES,
  NEGATIVE_MATCH_TYPES,
} from "@/lib/schemas/campaign-strategy";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_STRATEGY_MODEL = "claude-sonnet-5";
// A full multi-ad-group CampaignStrategy (keywords, RSA copy, negatives,
// assets) can run long; 8000 was cutting real responses off mid-JSON.
const MAX_TOKENS = 16000;

function buildOutputFormatInstructions(): string {
  return `Responda apenas com um JSON (sem markdown, sem texto fora do JSON) exatamente neste formato:

{
  "meta": { "schema_version": "1.0", "campaign_type": "search", "generated_at": "<ISO 8601>", "client_id": "<uuid>", "campaign_id": "<uuid>" },
  "campaign": { "name": "", "objective": "<${CAMPAIGN_OBJECTIVES.join("|")}>", "daily_budget": 0, "language": "pt-BR" },
  "bidding": { "strategy": "<${BIDDING_STRATEGIES.join("|")}>", "reason": "" },
  "locations": { "included": [""], "excluded": [""] },
  "conversions": [""],
  "ad_groups": [
    {
      "name": "", "theme": "", "equipment": "", "service": "", "landing_page": "<url ou null>",
      "keywords": [{ "text": "", "match_type": "<${KEYWORD_MATCH_TYPES.join("|")}>", "intent": "", "reason": "" }],
      "ads": [{
        "headlines": ["<até ${RSA_LIMITS.HEADLINE_MAX_COUNT} títulos, ${RSA_LIMITS.HEADLINE_MIN_COUNT}-${RSA_LIMITS.HEADLINE_MAX_COUNT}, cada um com no máximo ${RSA_LIMITS.HEADLINE_MAX_LENGTH} caracteres>"],
        "descriptions": ["<${RSA_LIMITS.DESCRIPTION_MIN_COUNT}-${RSA_LIMITS.DESCRIPTION_MAX_COUNT} descrições, cada uma com no máximo ${RSA_LIMITS.DESCRIPTION_MAX_LENGTH} caracteres>"],
        "path1": "<opcional, até ${RSA_LIMITS.PATH_MAX_LENGTH} caracteres>",
        "path2": "<opcional, até ${RSA_LIMITS.PATH_MAX_LENGTH} caracteres>"
      }]
    }
  ],
  "campaign_negatives": [{ "text": "", "match_type": "<${NEGATIVE_MATCH_TYPES.join("|")}>", "category": "<${NEGATIVE_CATEGORIES.join("|")}>", "reason": "" }],
  "assets": { "sitelinks": ["<até ${ASSET_LIMITS.SITELINK_MAX_LENGTH} caracteres>"], "callouts": ["<até ${ASSET_LIMITS.CALLOUT_MAX_LENGTH} caracteres>"], "structured_snippets": ["<até ${ASSET_LIMITS.STRUCTURED_SNIPPET_MAX_LENGTH} caracteres>"] },
  "warnings": [""],
  "assumptions": [""],
  "strategy_summary": ""
}

Use exatamente "client_id": "${"{{client_id}}"}" e "campaign_id": "${"{{campaign_id}}"}" (substituindo pelos valores reais informados no CampaignContext).`;
}

interface AnthropicCallResult {
  raw: unknown;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
}

async function callAnthropic(systemPrompt: string, userMessages: { role: "user" | "assistant"; content: string }[]): Promise<AnthropicCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");

  const model = process.env.ANTHROPIC_STRATEGY_MODEL || DEFAULT_STRATEGY_MODEL;
  const startedAt = Date.now();

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: userMessages,
    }),
  });

  const durationMs = Date.now() - startedAt;

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha na chamada à API da Anthropic (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    stop_reason?: string | null;
  };
  const textBlock = data.content.find((c) => c.type === "text");
  if (!textBlock?.text) throw new Error("A API da Anthropic não retornou texto.");

  const raw = parseAnthropicJsonResponse({ text: textBlock.text, stopReason: data.stop_reason ?? null }, "Estrategista");

  return {
    raw,
    model,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
    durationMs,
  };
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",

  async generateStrategy(context: CampaignContext, correction?: CampaignCorrection): Promise<AIGenerationResult> {
    const briefing = `CampaignContext:\n${JSON.stringify(context, null, 2)}\n\n${buildOutputFormatInstructions()}`;

    const messages: { role: "user" | "assistant"; content: string }[] = correction
      ? [
          { role: "user", content: briefing },
          { role: "assistant", content: JSON.stringify(correction.previousOutput) },
          {
            role: "user",
            content: `Sua resposta anterior não é válida. Problemas encontrados:\n${correction.issues.map((i) => `- ${i}`).join("\n")}\n\nCorrija e responda novamente APENAS com o JSON completo e válido, no mesmo formato.`,
          },
        ]
      : [{ role: "user", content: briefing }];

    const result = await callAnthropic(STRATEGIST_SYSTEM_PROMPT, messages);

    return {
      raw: result.raw,
      providerType: "ai",
      model: result.model,
      promptVersion: STRATEGIST_PROMPT_VERSION,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs: result.durationMs,
    };
  },
};
