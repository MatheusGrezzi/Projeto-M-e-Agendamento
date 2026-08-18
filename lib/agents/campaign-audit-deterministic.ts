import type { CampaignContext } from "./campaign-context";
import { validateGeneratedStrategy } from "./campaign-validation";
import type { AuditIssue } from "@/lib/schemas/campaign-audit";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";

/** Symptom-shaped searches that look "negative" but often carry high commercial intent — see auditor-v1 prompt. */
const SYMPTOM_PATTERNS = ["não gela", "não esquenta", "não liga", "não funciona", "parou de funcionar", "vazando"];

/**
 * Runs first, always, regardless of whether an AI auditor is configured —
 * these are objective checks a human reviewer would also run mechanically,
 * so they don't need (and shouldn't wait on) an LLM call. The AI pass adds
 * qualitative judgment on top; it never replaces this.
 */
export function runDeterministicAudit(context: CampaignContext, strategy: CampaignStrategy): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // client_restrictions — re-run the same hallucination check applied before
  // persistence, as a second line of defense in case an older/replayed
  // strategy_json is ever audited.
  const restrictionErrors = validateGeneratedStrategy(strategy, context);
  for (const problem of restrictionErrors) {
    issues.push({
      severity: "critical",
      category: "client_restrictions",
      title: "Violação de restrição do cliente",
      problem,
      evidence: problem,
      recommendation: "Gerar uma nova versão da estratégia — esta não pode ser aprovada.",
      requires_regeneration: true,
    });
  }

  // conversion_tracking
  if (strategy.conversions.length === 0) {
    issues.push({
      severity: "high",
      category: "conversion_tracking",
      title: "Nenhuma conversão configurada",
      problem: "A estratégia não usa nenhuma ação de conversão do cliente.",
      evidence: "conversions: []",
      recommendation: "Cadastrar e selecionar ao menos uma conversão antes de aprovar a campanha.",
      requires_regeneration: false,
    });
  }

  // landing_page_relevance
  for (const group of strategy.ad_groups) {
    if (!group.landing_page) {
      issues.push({
        severity: "medium",
        category: "landing_page_relevance",
        title: `Sem landing page — ${group.name}`,
        problem: `O grupo "${group.name}" não tem landing page associada.`,
        evidence: `ad_groups[].landing_page = null (${group.name})`,
        recommendation: "Cadastrar uma landing page específica para este equipamento/serviço.",
        requires_regeneration: false,
      });
    }
  }

  // negative_keywords — flag symptom-shaped negatives that could block high-intent searches
  for (const negative of strategy.campaign_negatives) {
    const text = negative.text.toLowerCase();
    if (SYMPTOM_PATTERNS.some((p) => text.includes(p))) {
      issues.push({
        severity: "high",
        category: "negative_keywords",
        title: "Negativa pode bloquear busca de alta intenção",
        problem: `A negativa "${negative.text}" tem formato de sintoma, que costuma ter alta intenção comercial de contratação.`,
        evidence: `campaign_negatives: "${negative.text}" (${negative.category})`,
        recommendation: "Reavaliar se esta negativa deveria mesmo bloquear esse termo — sintomas geralmente convertem bem.",
        requires_regeneration: false,
      });
    }
  }

  // duplication — same keyword text reused across ad groups (self-competition)
  const keywordOwners = new Map<string, string[]>();
  for (const group of strategy.ad_groups) {
    for (const keyword of group.keywords) {
      const key = keyword.text.trim().toLowerCase();
      keywordOwners.set(key, [...(keywordOwners.get(key) ?? []), group.name]);
    }
  }
  for (const [keyword, groups] of keywordOwners) {
    if (new Set(groups).size > 1) {
      issues.push({
        severity: "medium",
        category: "duplication",
        title: "Palavra-chave duplicada entre grupos",
        problem: `"${keyword}" aparece em mais de um grupo de anúncios (${groups.join(", ")}), o que gera concorrência interna (canibalização).`,
        evidence: `keyword "${keyword}" em: ${groups.join(", ")}`,
        recommendation: "Manter a palavra-chave em apenas um grupo, o mais relevante.",
        requires_regeneration: false,
      });
    }
  }

  // rsa_quality — fewer than 5 headlines leaves unused ad slots (Google recommends filling all available slots)
  for (const group of strategy.ad_groups) {
    for (const ad of group.ads) {
      if (ad.headlines.length < 5) {
        issues.push({
          severity: "low",
          category: "rsa_quality",
          title: `Poucos títulos — ${group.name}`,
          problem: `O anúncio do grupo "${group.name}" tem apenas ${ad.headlines.length} título(s).`,
          evidence: `ad_groups[].ads[].headlines.length = ${ad.headlines.length} (${group.name})`,
          recommendation: "Adicionar mais títulos (até 15) para o Google testar mais combinações.",
          requires_regeneration: false,
        });
      }
    }
  }

  // budget — a rough sanity check, not a CPC/CPL prediction (no historical data exists yet)
  const minRecommendedPerGroup = 10;
  if (strategy.ad_groups.length > 0 && strategy.campaign.daily_budget < strategy.ad_groups.length * minRecommendedPerGroup) {
    issues.push({
      severity: "medium",
      category: "budget",
      title: "Orçamento pode ser insuficiente",
      problem: `R$ ${strategy.campaign.daily_budget.toFixed(2)}/dia para ${strategy.ad_groups.length} grupo(s) de anúncios é um orçamento apertado.`,
      evidence: `daily_budget=${strategy.campaign.daily_budget}, ad_groups=${strategy.ad_groups.length}`,
      recommendation: "Sem dados históricos de CPC/CPL deste cliente ainda — trate como hipótese, não como certeza. Considerar aumentar o orçamento ou reduzir o número de grupos.",
      requires_regeneration: false,
    });
  }

  // assets
  if (strategy.assets.sitelinks.length === 0 && strategy.assets.callouts.length === 0) {
    issues.push({
      severity: "low",
      category: "assets",
      title: "Sem sitelinks nem callouts",
      problem: "A campanha não usa nenhum asset (sitelink/callout), reduzindo o espaço ocupado no anúncio.",
      evidence: "assets.sitelinks = [], assets.callouts = []",
      recommendation: "Adicionar ao menos sitelinks e callouts básicos.",
      requires_regeneration: false,
    });
  }

  return issues;
}
