import { describe, expect, it } from "vitest";
import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { Platoon } from "@/features/army-list/lib/Platoon";

describe("Platoon.fromWire", () => {
  it("decodes the form-encoded name", () => {
    const platoon = Platoon.fromWire(
      { PlatoonSubName: "Sherman+section%21", Units: [] },
      { id: "platoon" }
    );

    expect(platoon.name).toBe("Sherman section!");
  });

  it("keeps a name with a stray percent sign as it is", () => {
    const platoon = Platoon.fromWire(
      { PlatoonSubName: "100%+GIs", Units: [] },
      { id: "platoon" }
    );

    expect(platoon.name).toBe("100% GIs");
  });

  it("strips asterisks from the selector", () => {
    const platoon = Platoon.fromWire(
      { PlatoonName: "** v3 Rifle Platoon ** (LW)", Units: [] },
      { id: "platoon" }
    );

    expect(platoon.selector).toBe("v3 Rifle Platoon (LW)");
  });

  it("rejects a platoon with no unit array", () => {
    expect(() => Platoon.fromWire({ Platoon: "#1" }, { id: "p" })).toThrow(
      ListParseError
    );
  });
});

describe("Platoon totals and sections", () => {
  const platoon = Platoon.fromWire(
    {
      Units: [
        { SectionName: "Command", UnitPoints: "50", UnitSkill: "Regular" },
        { SectionName: "Options", UnitPoints: "10", UnitSkill: "" },
        { SectionName: "Infantry", UnitPoints: "100", UnitSkill: "Veteran" },
        { SectionName: "Infantry", UnitPoints: "90", UnitSkill: "Regular" },
        { SectionName: "Command", UnitPoints: "40", UnitSkill: "Regular" },
      ],
    },
    { id: "platoon" }
  );

  it("sums points and counts dice only for units with experience", () => {
    expect(platoon.points).toBe(290);
    expect(platoon.orderDice).toBe(4);
  });

  it("groups consecutive units by section, keeping list order", () => {
    expect(
      platoon.sections.map((section) => [section.name, section.units.length])
    ).toEqual([
      ["Command", 1],
      ["Options", 1],
      ["Infantry", 2],
      ["Command", 1],
    ]);
    expect(platoon.sections[2]?.id).toBe("platoon-unit-3");
  });

  it("is empty for a platoon with no units", () => {
    const empty = Platoon.fromWire({ Units: [] }, { id: "p" });

    expect(empty.points).toBe(0);
    expect(empty.orderDice).toBe(0);
    expect(empty.sections).toEqual([]);
  });
});
