import "server-only";

function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Best-effort JSON extraction from free-form model text: strips a markdown
 * fence, then — if direct parsing still fails — falls back to the substring
 * between the first "{" and the last "}", which recovers cases where the
 * model added stray preamble/postamble despite being told not to.
 */
function extractJson(text: string): unknown {
  const cleaned = stripMarkdownFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("no-json-object-found");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export interface AnthropicTextResponse {
  text: string;
  stopReason: string | null;
}

/**
 * Turns a raw Claude text response into parsed JSON, with actionable errors:
 * a response cut off by max_tokens is reported as truncation (not "invalid
 * JSON"), and any other parse failure includes a preview of what came back
 * so the real cause isn't hidden behind a generic message.
 */
export function parseAnthropicJsonResponse(response: AnthropicTextResponse, label: string): unknown {
  if (response.stopReason === "max_tokens") {
    throw new Error(
      `A resposta do Claude (${label}) foi cortada por atingir o limite de tokens de saída (max_tokens) antes de terminar o JSON. Aumente o limite configurado e tente novamente.`
    );
  }
  try {
    return extractJson(response.text);
  } catch {
    const preview = response.text.slice(0, 300);
    throw new Error(`A resposta da IA (${label}) não é um JSON válido. Início da resposta recebida: ${JSON.stringify(preview)}`);
  }
}
