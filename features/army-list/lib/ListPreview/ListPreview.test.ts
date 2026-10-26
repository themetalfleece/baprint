import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ArmyList } from "@/features/army-list/lib/ArmyList";
import { ListPreview } from "@/features/army-list/lib/ListPreview";

const sampleText = readFileSync(
  new URL("../../fixtures/easyarmy-sample-list.json", import.meta.url),
  "utf8"
);

describe("ListPreview with the sample list", () => {
  const preview = new ListPreview(ArmyList.fromWire(JSON.parse(sampleText)));

  it("leads with the army's name, countries and points", () => {
    expect(preview.heading).toBe("1000 GIs and Paras");
    expect(preview.countries).toBe("United States");
    expect(preview.title).toBe("1000 GIs and Paras: United States, 998 pts");
  });

  it("describes the list by its figures", () => {
    expect(preview.stats).toEqual([
      { label: "Points", value: 998 },
      { label: "Order dice", value: 11 },
      { label: "Platoons", value: 3 },
      { label: "Units", value: 12 },
    ]);
    expect(preview.description).toBe(
      "A United States Bolt Action army list: 998 points, 11 order dice, 3 platoons, 12 units. Print it as a clean, black and grey sheet for the table."
    );
  });
});

describe("ListPreview with an unnamed list", () => {
  const preview = new ListPreview(
    ArmyList.fromWire({ TotalPoints: 60, Platoons: [] })
  );

  it("falls back to a generic heading and leaves out the countries", () => {
    expect(preview.heading).toBe("Bolt Action army list");
    expect(preview.countries).toBe("");
    expect(preview.title).toBe("Bolt Action army list: 60 pts");
    expect(preview.description).toMatch(/^A Bolt Action army list: 60 points,/);
  });
});
