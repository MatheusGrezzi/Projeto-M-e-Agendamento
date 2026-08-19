import "server-only";

import type { AIGenerationResult } from "./ai-provider";
import type { AuditorProvider } from "./auditor-provider";
import type { CampaignContext } from "./campaign-context";
import { parseAnthropicJsonResponse } from "./anthropic-json-response";
import { AUDITOR_SYSTEM_PROMPT, AUDITOR_PROMPT_VERSION } from "@/lib/prompts/auditor-v1";
import { AUDIT_CATEGORIES, AUDIT_SEVERITIES, AUDIT_STATUSES, type AuditIssue } from "@/lib/schemas/campaign-audit";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_AUDITOR_MODEL = "claude-sonnet-5";
// A full audit report can carry many issues across 18 categories; 6000 was
// tight enough to risk truncating a thorough report mid-JSON.
const MAX_TOKENS = 8000;

function buildOutputFormatReminder(): string {
  return `Responda apenas com um JSON (sem markdown, sem texto fora do JSON) neste formato:

{
  "score": 0,
  "status": "<${AUDIT_STATUSES.join("|")}>",
  "summary": "",
  "issues": [{ "severity": "<${AUDIT_SEVERITIES.join("|")}>", "category": "<${AUDIT_CATEGORIES.join("|")}>", "title": "", "problem": "", "evidence": "", "recommendation": "", "requires_regeneration": false }],
  "recommendations": [""],
  "positives": [""]
}`;
}

export const anthropicAuditorProvider: AuditorProvider = {
  name: "anthropic",

  async auditStrategy(context: CampaignContext, strategy: CampaignStrategy, seedIssues: AuditIssue[]): Promise<AIGenerationResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");

    const model = process.env.ANTHROPIC_AUDITOR_MODEL || DEFAULT_AUDITOR_MODEL;
    const userMessage =
      `CampaignContext (dados reais do cliente):\n${JSON.stringify(context, null, 2)}\n\n` +
      `CampaignStrategy a auditar:\n${JSON.stringify(strategy, null, 2)}\n\n` +
      `Problemas já identificados por verificação determinística (não repita estes, adicione o que faltar):\n${JSON.stringify(seedIssues, null, 2)}\n\n` +
      buildOutputFormatReminder();

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
        system: AUDITOR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
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

    const raw = parseAnthropicJsonResponse({ text: textBlock.text, stopReason: data.stop_reason ?? null }, "Auditor");

    return {
      raw,
      providerType: "ai",
      model,
      promptVersion: AUDITOR_PROMPT_VERSION,
      inputTokens: data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.output_tokens ?? null,
      durationMs,
    };
  },
};
