import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ArmyList } from "@/features/army-list/lib/ArmyList";
import { ListParseError } from "@/features/army-list/lib/ListParseError";

const sampleText = readFileSync(
  new URL("../../fixtures/easyarmy-sample-list.json", import.meta.url),
  "utf8"
);

describe("ArmyList.fromWire with the sample list", () => {
  const list = ArmyList.fromWire(JSON.parse(sampleText));

  it("reads the reported totals", () => {
    expect(list.points).toBe(998);
    expect(list.orderDice).toBe(11);
  });

  it("reads every platoon and unit", () => {
    expect(list.platoons.map((platoon) => platoon.label)).toEqual([
      "Platoon #1",
      "Platoon #2",
      "Platoon #3",
    ]);
    expect(list.unitCount).toBe(12);
  });

  it("has platoon subtotals that add up to the reported totals", () => {
    const points = list.platoons.reduce(
      (sum, platoon) => sum + platoon.points,
      0
    );
    const dice = list.platoons.reduce(
      (sum, platoon) => sum + platoon.orderDice,
      0
    );

    expect(points).toBe(list.points);
    expect(dice).toBe(list.orderDice);
    expect(list.platoons.map((platoon) => platoon.points)).toEqual([
      444, 420, 134,
    ]);
    expect(list.platoons.map((platoon) => platoon.orderDice)).toEqual([
      6, 2, 3,
    ]);
  });

  it("decodes platoon names and tidies selectors", () => {
    const [first] = list.platoons;

    expect(first?.name).toBe("1000 GIs and Paras");
    expect(first?.selector).toBe("v3 Armies of the U.S. - Rifle Platoon (LW)");
  });

  it("reads the pick list with numeric quantities", () => {
    expect(list.pickList).toHaveLength(12);
    expect(list.pickList).toContainEqual({
      id: "pick-3",
      country: "United States",
      item: "Infantry with Rifle",
      quantity: 22,
    });
    expect(list.countries).toEqual(["United States"]);
  });

  it("gives every platoon, unit and entry a unique id", () => {
    const ids = list.platoons.flatMap((platoon) => [
      platoon.id,
      ...platoon.units.flatMap((unit) => [
        unit.id,
        ...unit.entries.flatMap((entry) =>
          entry.kind === "vehicle"
            ? [entry.id, ...entry.weapons.map((weapon) => weapon.id)]
            : [entry.id]
        ),
      ]),
    ]);

    expect(ids.length).toBeGreaterThan(40);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ArmyList.fromWire", () => {
  it("rejects JSON with no platoon array", () => {
    expect(() => ArmyList.fromWire({ TotalPoints: 10 })).toThrow(
      ListParseError
    );
    expect(() => ArmyList.fromWire([])).toThrow(ListParseError);
    expect(() => ArmyList.fromWire(null)).toThrow(ListParseError);
  });

  it("rejects a platoon that is not an object", () => {
    expect(() => ArmyList.fromWire({ Platoons: ["Platoon #1"] })).toThrow(
      "has no units"
    );
  });

  it("works out totals the list leaves out", () => {
    const list = ArmyList.fromWire({
      Platoons: [
        {
          Platoon: "Platoon #1",
          Units: [
            { UnitName: "Squad", UnitPoints: "50", UnitSkill: "Regular" },
            { UnitName: "Upgrade", UnitPoints: 10, UnitSkill: "" },
          ],
        },
      ],
    });

    expect(list.points).toBe(60);
    expect(list.orderDice).toBe(1);
  });

  it("reads string totals", () => {
    const list = ArmyList.fromWire({
      TotalPoints: "998",
      OrderDice: "11",
      Platoons: [],
    });

    expect(list.points).toBe(998);
    expect(list.orderDice).toBe(11);
  });

  it("treats a missing pick list as empty and skips non-object lines", () => {
    expect(ArmyList.fromWire({ Platoons: [] }).pickList).toEqual([]);
    expect(
      ArmyList.fromWire({ Platoons: [], PickList: ["x", null] }).pickList
    ).toEqual([]);
  });
});
