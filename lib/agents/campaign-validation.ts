import type { CampaignContext } from "./campaign-context";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

/** True if this equipment+service combination is something the client explicitly does NOT do. */
export function isServiceExcluded(context: CampaignContext, equipmentId: string, serviceId: string): boolean {
  if (context.excludedEquipment.some((e) => e.equipmentId === equipmentId)) return true;
  return context.excludedServices.some(
    (s) => (s.equipmentId === equipmentId || s.equipmentId === null) && (s.serviceId === serviceId || s.serviceId === null)
  );
}

/**
 * Deterministic, pre-generation validation — runs before any AI call.
 * Errors BLOCK strategy generation entirely; warnings are surfaced to the
 * user but do not. Nothing here depends on an LLM: everything checked is
 * already known from what's registered in Reconnect OS.
 */
export function validateCampaignContext(context: CampaignContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (context.client.status === "paused" || context.client.status === "churned") {
    errors.push(`O cliente está com status "${context.client.status}" — reative-o antes de criar uma campanha.`);
  }

  if (context.budget.daily <= 0) {
    errors.push("O orçamento diário precisa ser maior que zero.");
  }

  if (!context.selectedSegment) {
    errors.push("Nenhum segmento selecionado.");
  }

  if (context.selectedServices.length === 0) {
    errors.push("Nenhuma combinação de equipamento/serviço foi selecionada.");
  }

  for (const service of context.selectedServices) {
    if (isServiceExcluded(context, service.equipmentId, service.serviceId)) {
      errors.push(
        `"${service.serviceName} de ${service.equipmentName}" está marcado como restrição deste cliente e não pode ser usado na campanha.`
      );
    }
  }

  for (const equipment of context.selectedEquipment) {
    if (context.excludedEquipment.some((e) => e.equipmentId === equipment.id)) {
      errors.push(`"${equipment.name}" está marcado como equipamento não atendido por este cliente.`);
    }
  }

  for (const location of context.locations) {
    if (!location.isServed) {
      errors.push(`"${location.city}/${location.state}" não é uma região atendida por este cliente.`);
    }
  }

  if (context.locations.length === 0) {
    errors.push("Nenhuma região válida foi selecionada.");
  }

  // Warnings — none of these block generation.
  if (context.selectedLandingPages.length === 0 && context.availableLandingPages.length === 0) {
    warnings.push("Este cliente não tem nenhuma landing page cadastrada.");
  }

  for (const service of context.selectedServices) {
    const hasMatch = context.selectedLandingPages.some(
      (lp) => lp.equipmentId === service.equipmentId && lp.serviceId === service.serviceId
    );
    if (!hasMatch) {
      warnings.push(`Nenhuma landing page selecionada especificamente para "${service.serviceName} de ${service.equipmentName}".`);
    }
  }

  if (context.selectedConversions.length === 0) {
    warnings.push("Nenhuma conversão selecionada para esta campanha.");
  }

  const objectiveToConversionType: Record<string, string> = {
    whatsapp: "whatsapp",
    calls: "call",
    forms: "form",
    bookings: "booking",
  };
  const requiredType = objectiveToConversionType[context.objective];
  if (requiredType && !context.selectedConversions.some((c) => c.conversionType === requiredType)) {
    warnings.push(`O objetivo é "${context.objective}", mas nenhuma conversão do tipo correspondente foi selecionada.`);
  }

  if (context.goals.averageTicket === null) {
    warnings.push("Ticket médio não informado para este cliente.");
  }

  if (
    context.goals.leadGoal === null &&
    context.goals.cplGoal === null &&
    context.goals.closedServicesGoal === null &&
    context.goals.cpaGoal === null &&
    context.goals.roasGoal === null
  ) {
    warnings.push("Nenhuma meta (leads, CPL, CPA, ROAS...) foi configurada para este cliente.");
  }

  return { errors, warnings };
}

/**
 * Post-generation safety net. The AI provider is expected to already follow
 * the CampaignContext strictly (see the system prompt), but this re-checks
 * the actual output against the same exclusion rules — a hallucinated
 * equipment/service/region/brand is rejected here rather than trusted.
 */
export function validateGeneratedStrategy(strategy: CampaignStrategy, context: CampaignContext): string[] {
  const errors: string[] = [];

  const allowedEquipmentNames = new Set(context.selectedEquipment.map((e) => e.name));
  const allowedServiceNames = new Set(context.selectedServices.map((s) => s.serviceName));
  const allowedLocationNames = new Set(context.locations.map((l) => l.city));
  const excludedLocationNames = new Set(context.excludedLocations.map((l) => l.city));
  const excludedBrandNames = new Set(context.excludedBrands.map((b) => b.brandName.toLowerCase()));
  const allowedLandingPageUrls = new Set([...context.availableLandingPages, ...context.selectedLandingPages].map((lp) => lp.url));
  const allowedConversionNames = new Set(context.selectedConversions.map((c) => c.name));

  // Free-text labels for exclusions (e.g. "Troca de borracha") aren't tied to
  // any real equipment/service id, so they can only be caught by scanning the
  // actual generated copy — not by the field-level checks below.
  const forbiddenPhrases = [
    ...context.excludedEquipment.map((e) => e.equipmentName ?? e.label),
    ...context.excludedServices.map((s) => s.label ?? [s.equipmentName, s.serviceName].filter(Boolean).join(" ")),
  ]
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => p.trim().toLowerCase());

  for (const group of strategy.ad_groups) {
    if (!allowedEquipmentNames.has(group.equipment)) {
      errors.push(`O grupo "${group.name}" usa o equipamento "${group.equipment}", que não estava entre os selecionados.`);
    }
    if (!allowedServiceNames.has(group.service)) {
      errors.push(`O grupo "${group.name}" usa o serviço "${group.service}", que não estava entre os selecionados.`);
    }

    // Re-resolve the group's equipment/service names back to ids (via the
    // context's own selection lists) and re-check exclusion by id — catches
    // a drifted context where the item is still "selected" but was also
    // excluded after the fact, which the name-allowlist checks above miss.
    const matchedService = context.selectedServices.find(
      (s) => s.equipmentName === group.equipment && s.serviceName === group.service
    );
    if (matchedService && isServiceExcluded(context, matchedService.equipmentId, matchedService.serviceId)) {
      errors.push(`O grupo "${group.name}" usa "${group.service} de ${group.equipment}", que é uma restrição deste cliente.`);
    }
    const matchedEquipment = context.selectedEquipment.find((e) => e.name === group.equipment);
    if (matchedEquipment && context.excludedEquipment.some((e) => e.equipmentId === matchedEquipment.id)) {
      errors.push(`O grupo "${group.name}" usa o equipamento "${group.equipment}", que é uma restrição deste cliente.`);
    }

    if (group.landing_page && !allowedLandingPageUrls.has(group.landing_page)) {
      errors.push(`O grupo "${group.name}" usa a landing page "${group.landing_page}", que não existe no CampaignContext deste cliente.`);
    }

    const groupText = [
      ...group.keywords.map((k) => k.text),
      ...group.ads.flatMap((ad) => [...ad.headlines, ...ad.descriptions]),
    ]
      .join(" \n ")
      .toLowerCase();
    for (const phrase of forbiddenPhrases) {
      if (groupText.includes(phrase)) {
        errors.push(`O grupo "${group.name}" menciona "${phrase}", que é uma restrição deste cliente.`);
      }
    }
  }

  for (const conversion of strategy.conversions) {
    if (!allowedConversionNames.has(conversion)) {
      errors.push(`A estratégia usa a conversão "${conversion}", que não foi selecionada (ou não existe) para este cliente.`);
    }
  }

  for (const location of strategy.locations.included) {
    if (excludedLocationNames.has(location)) {
      errors.push(`A região "${location}" é uma restrição deste cliente e não pode ser incluída.`);
    }
  }
  if (strategy.locations.included.some((l) => !allowedLocationNames.has(l))) {
    errors.push("A estratégia inclui uma região que não estava entre as selecionadas.");
  }

  if (excludedBrandNames.size > 0) {
    const haystack = JSON.stringify(strategy).toLowerCase();
    for (const brand of excludedBrandNames) {
      if (haystack.includes(brand)) {
        errors.push(`A estratégia menciona a marca "${brand}", que este cliente marcou como não atendida.`);
      }
    }
  }

  return errors;
}
