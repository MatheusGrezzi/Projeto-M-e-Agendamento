import { describe, expect, it } from "vitest";

import { deterministicProvider } from "@/lib/agents/deterministic-provider";
import { campaignStrategySchema } from "@/lib/schemas/campaign-strategy";
import { fixtureCampaignContext, fixtureExcludedEquipment, fixtureExcludedService } from "./helpers/campaign-context-fixture";

describe("deterministicProvider", () => {
  it("produces output that satisfies campaignStrategySchema", async () => {
    const generation = await deterministicProvider.generateStrategy(fixtureCampaignContext());
    const result = campaignStrategySchema.safeParse(generation.raw);
    expect(result.success).toBe(true);
  });

  it("reports its own generation metadata (provider type, model, prompt version, duration)", async () => {
    const generation = await deterministicProvider.generateStrategy(fixtureCampaignContext());
    expect(generation.providerType).toBe("deterministic");
    expect(generation.model).toBe("deterministic");
    expect(generation.promptVersion).toBeTruthy();
    expect(generation.inputTokens).toBeNull();
    expect(generation.outputTokens).toBeNull();
    expect(generation.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("never uses broad match for positive keywords (schema already forbids it, but double-check the generator's own output)", async () => {
    const generation = await deterministicProvider.generateStrategy(fixtureCampaignContext());
    const raw = generation.raw as { ad_groups: { keywords: { match_type: string }[] }[] };
    const allMatchTypes = raw.ad_groups.flatMap((g) => g.keywords.map((k) => k.match_type));
    expect(allMatchTypes.every((m) => m === "exact" || m === "phrase")).toBe(true);
  });

  it("still produces a valid strategy when the client has zero excluded items and zero conversions (all warnings, no crash)", async () => {
    const context = fixtureCampaignContext({ selectedConversions: [] });
    const generation = await deterministicProvider.generateStrategy(context);
    const result = campaignStrategySchema.safeParse(generation.raw);
    expect(result.success).toBe(true);
  });

  it("carries client_id and campaign_id through into meta", async () => {
    const context = fixtureCampaignContext({ campaignId: "22222222-2222-4222-8222-222222222222" });
    const generation = await deterministicProvider.generateStrategy(context);
    const raw = generation.raw as { meta: { client_id: string; campaign_id: string } };
    expect(raw.meta.client_id).toBe(context.client.id);
    expect(raw.meta.campaign_id).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("adds an excluded_service negative when the client has a service exclusion", async () => {
    const context = fixtureCampaignContext({
      excludedServices: [fixtureExcludedService({ label: "Venda de peças" })],
    });
    const generation = await deterministicProvider.generateStrategy(context);
    const raw = generation.raw as { campaign_negatives: { text: string; category: string }[] };
    expect(raw.campaign_negatives.some((n) => n.category === "excluded_service")).toBe(true);
  });

  it("adds an irrelevant_equipment negative when the client has an equipment exclusion", async () => {
    const context = fixtureCampaignContext({
      excludedEquipment: [fixtureExcludedEquipment({ equipmentId: "equip-microondas", equipmentName: "Micro-ondas" })],
    });
    const generation = await deterministicProvider.generateStrategy(context);
    const raw = generation.raw as { campaign_negatives: { text: string; category: string }[] };
    expect(raw.campaign_negatives.some((n) => n.category === "irrelevant_equipment")).toBe(true);
  });
});
