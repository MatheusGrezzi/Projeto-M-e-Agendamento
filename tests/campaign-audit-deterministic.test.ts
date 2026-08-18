import { describe, expect, it } from "vitest";

import { runDeterministicAudit } from "@/lib/agents/campaign-audit-deterministic";
import { fixtureCampaignContext, fixtureExcludedEquipment, fixtureExcludedService, fixtureLocation } from "./helpers/campaign-context-fixture";
import { fixtureStrategy } from "./helpers/campaign-strategy-fixture";

describe("runDeterministicAudit", () => {
  it("flags no client_restrictions issue for a fully compliant strategy", () => {
    const issues = runDeterministicAudit(fixtureCampaignContext(), fixtureStrategy());
    expect(issues.some((i) => i.category === "client_restrictions")).toBe(false);
  });

  it("raises a CRITICAL client_restrictions issue when the strategy uses an excluded service", () => {
    const context = fixtureCampaignContext({
      excludedServices: [fixtureExcludedService({ equipmentId: "equip-geladeira", serviceId: "service-conserto" })],
    });
    const issues = runDeterministicAudit(context, fixtureStrategy());
    const issue = issues.find((i) => i.category === "client_restrictions");
    expect(issue?.severity).toBe("critical");
    expect(issue?.requires_regeneration).toBe(true);
  });

  it("raises a CRITICAL issue when the strategy uses an excluded equipment", () => {
    const context = fixtureCampaignContext({
      excludedEquipment: [fixtureExcludedEquipment({ equipmentId: "equip-geladeira", equipmentName: "Geladeira" })],
    });
    const issues = runDeterministicAudit(context, fixtureStrategy());
    expect(issues.some((i) => i.category === "client_restrictions" && i.severity === "critical")).toBe(true);
  });

  it("raises a CRITICAL issue when the strategy targets a non-served region", () => {
    const context = fixtureCampaignContext({ excludedLocations: [fixtureLocation({ id: "loc-2", city: "Igarapé", isServed: false })] });
    const strategy = fixtureStrategy({ locations: { included: ["Igarapé"], excluded: [] } });
    const issues = runDeterministicAudit(context, strategy);
    expect(issues.some((i) => i.category === "client_restrictions" && i.severity === "critical")).toBe(true);
  });

  it("raises a CRITICAL issue when the strategy uses a landing page not in the CampaignContext", () => {
    const strategy = fixtureStrategy({
      ad_groups: [{ ...fixtureStrategy().ad_groups[0], landing_page: "https://not-real.example.com/fake" }],
    });
    const issues = runDeterministicAudit(fixtureCampaignContext(), strategy);
    expect(issues.some((i) => i.category === "client_restrictions" && i.severity === "critical")).toBe(true);
  });

  it("raises a CRITICAL issue when the strategy uses a conversion that wasn't selected", () => {
    const strategy = fixtureStrategy({ conversions: ["Conversão inventada"] });
    const issues = runDeterministicAudit(fixtureCampaignContext(), strategy);
    expect(issues.some((i) => i.category === "client_restrictions" && i.severity === "critical")).toBe(true);
  });

  it("flags a symptom-shaped negative keyword as high severity, without rejecting outright", () => {
    const strategy = fixtureStrategy({
      campaign_negatives: [{ text: "geladeira não gela", match_type: "broad", category: "other", reason: "teste" }],
    });
    const issues = runDeterministicAudit(fixtureCampaignContext(), strategy);
    const issue = issues.find((i) => i.category === "negative_keywords");
    expect(issue?.severity).toBe("high");
  });

  it("flags duplicated keywords across ad groups (canibalização)", () => {
    const base = fixtureStrategy();
    const strategy = fixtureStrategy({
      ad_groups: [
        base.ad_groups[0],
        { ...base.ad_groups[0], name: "Manutenção — Geladeira", service: "Manutenção", keywords: base.ad_groups[0].keywords },
      ],
    });
    const issues = runDeterministicAudit(fixtureCampaignContext(), strategy);
    expect(issues.some((i) => i.category === "duplication")).toBe(true);
  });

  it("flags a missing landing page on an ad group", () => {
    const strategy = fixtureStrategy({ ad_groups: [{ ...fixtureStrategy().ad_groups[0], landing_page: null }] });
    const issues = runDeterministicAudit(fixtureCampaignContext(), strategy);
    expect(issues.some((i) => i.category === "landing_page_relevance")).toBe(true);
  });

  it("flags missing conversion tracking", () => {
    const strategy = fixtureStrategy({ conversions: [] });
    const issues = runDeterministicAudit(fixtureCampaignContext(), strategy);
    expect(issues.some((i) => i.category === "conversion_tracking")).toBe(true);
  });
});
