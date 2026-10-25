import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ArmyList } from "@/features/army-list/lib/ArmyList";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
import { Unit } from "@/features/army-list/lib/Unit";
import { readPdfTextLines } from "@/lib/pdfText";

const sample = ArmyList.fromWire(
  JSON.parse(
    readFileSync(
      new URL("../../fixtures/easyarmy-sample-list.json", import.meta.url),
      "utf8"
    )
  )
);

describe("SpecialRuleIndex.fromList with the sample list", () => {
  const rules = SpecialRuleIndex.fromList(sample);
  const labels = rules.entries.map((entry) => entry.label);

  it("lists every rule the army uses, sorted, with no duplicates", () => {
    expect(labels).toEqual([
      "Assault",
      "Command Vehicle",
      "Easily catches fire",
      "Fixed",
      "Gyro-stabiliser (Veterans only)",
      'HE (2")',
      "Indirect fire",
      "Medics",
      "Shaped Charge",
      "Spotter",
      "Stubborn",
      "Team (2 men)",
      "Team (3 men)",
      "Unarmed",
    ]);
  });

  it("leaves out weapon arcs", () => {
    expect(labels).not.toContain("Front arc");
  });

  it("gives each rule a reference and the units that carry it", () => {
    const assault = rules.entries.find((entry) => entry.label === "Assault");

    expect(assault?.reference).toEqual({ source: "Rulebook v3", page: "96" });
    expect(assault?.usedBy).toEqual([
      "Platoon Commander",
      "US Army Rifle Squad",
      "US Paratrooper Squad",
    ]);
  });

  it("keys rule variants together for a glossary", () => {
    const teams = rules.entries.filter((entry) => entry.key === "team");

    expect(teams.map((entry) => entry.label)).toEqual([
      "Team (2 men)",
      "Team (3 men)",
    ]);
  });

  it("has no descriptions without a glossary", () => {
    for (const entry of rules.entries) {
      expect(entry.descriptions).toEqual([]);
    }
  });
});

describe("SpecialRuleIndex.fromList with the sample glossary", async () => {
  const glossary = RuleGlossary.fromPdfLines(
    await readPdfTextLines(
      new Uint8Array(
        readFileSync(
          new URL("../../fixtures/easyarmy-sample-list.pdf", import.meta.url)
        )
      )
    )
  );
  const rules = SpecialRuleIndex.fromList(sample, glossary);

  it("gives every rule the army uses its description", () => {
    for (const entry of rules.entries) {
      expect(entry.descriptions.length, entry.label).toBeGreaterThan(0);
    }
  });

  it("puts the exact rule first and a printed variant after it", () => {
    const he = rules.entries.find((entry) => entry.label === 'HE (2")');

    expect(he?.descriptions.map((description) => description.name)).toEqual([
      'HE (2")',
      '(75mm) HE (2")',
    ]);
  });
});

describe("SpecialRuleIndex.fromList", () => {
  it("is empty for a list with no rules", () => {
    expect(
      SpecialRuleIndex.fromList(ArmyList.fromWire({ Platoons: [] })).entries
    ).toEqual([]);
  });

  it("has no reference for a rule missing from the table", () => {
    const list = ArmyList.fromWire({
      Platoons: [
        {
          Units: [
            {
              UnitName: "Sniper team",
              UnitItems: [
                { ItemQuantity: 1, ItemName: "Sniper", ItemNotes: "Sniper" },
              ],
            },
          ],
        },
      ],
    });
    const [entry] = SpecialRuleIndex.fromList(list).entries;

    expect(entry?.label).toBe("Sniper");
    expect(entry?.reference).toBeNull();
  });
});

describe("SpecialRuleIndex.labelsOf", () => {
  it("reads upgrade names and strips the special rule suffix", () => {
    const unit = Unit.fromWire(
      {
        UnitItems: [
          { ItemName: "Command Vehicle special rule", ItemNotes: "" },
        ],
      },
      { id: "unit" }
    );

    expect(SpecialRuleIndex.labelsOf(unit)).toEqual(["Command Vehicle"]);
  });
});

describe("SpecialRuleIndex.formatReference", () => {
  it("formats a book and page", () => {
    expect(
      SpecialRuleIndex.formatReference({ source: "Rulebook v3", page: "96" })
    ).toBe("Rulebook v3, p. 96");
  });

  it("formats a source with no page", () => {
    expect(
      SpecialRuleIndex.formatReference({
        source: "Rulebook v3 errata",
        page: "",
      })
    ).toBe("Rulebook v3 errata");
  });

  it("points at the unit entry when there is no reference", () => {
    expect(SpecialRuleIndex.formatReference(null)).toBe("Unit entry");
  });
});
