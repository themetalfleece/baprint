import { describe, expect, it } from "vitest";
import { ArmyList } from "@/features/army-list/lib/ArmyList";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import { respondWithSampleList } from "@/features/army-list/server/sampleListRoute";

describe("respondWithSampleList", () => {
  it("serves the saved sample in the list route's shape, with rule texts", async () => {
    const response = await respondWithSampleList();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(ArmyList.fromWire(body.list).platoons.length).toBeGreaterThan(0);
    expect(RuleGlossary.fromWire(body.rules).entries.length).toBeGreaterThan(0);
  });
});
