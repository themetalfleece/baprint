import { describe, expect, it } from "vitest";
import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { Unit } from "@/features/army-list/lib/Unit";

const SHERMAN = {
  SectionName: "Vehicle",
  UnitName: "M4A1/A2/A3/A4 Sherman 75mm",
  Source: "Armies of the United States (v3)",
  SourcePage: "60",
  UnitPoints: "205",
  UnitSkill: "Regular",
  UnitItems: [
    {
      ItemSequence: 3,
      ItemLine: 1,
      IsVehicle: "false",
      IsGun: "true",
      ItemName: "Co-axial MMG",
      ItemRange: '36"',
      ItemROF: "5",
      ItemPen: "n/a",
      ItemNotes: "",
    },
    {
      ItemSequence: 1,
      ItemLine: 1,
      IsVehicle: "true",
      ItemQuantity: 1,
      ItemName: "M4A1/A2/A3/A4 Sherman 75mm",
      ItemMobility: "Tracked",
      ItemTransport: "-",
      ItemDamageValue: "9+",
      ItemNotes: "Easily catches fire",
    },
    {
      ItemSequence: 2,
      ItemLine: 1,
      IsVehicle: "false",
      IsGun: "true",
      ItemName: "Turret-mounted medium anti-tank gun",
      ItemRange: '60"',
      ItemROF: "1",
      ItemPen: "+5",
      ItemNotes: '(75mm) HE (2"), Gyro-stabiliser (Veterans only)',
    },
  ],
};

const PARATROOPERS = {
  SectionName: "Infantry",
  UnitName: "US Paratrooper Squad",
  Source: "Armies of the United States (v3)",
  SourcePage: "36",
  UnitPoints: "109",
  UnitSkill: "Regular",
  UnitItems: [
    {
      ItemSequence: 1,
      ItemLine: 1,
      IsVehicle: "false",
      ItemQuantity: 7,
      ItemName: "Infantry with Rifle",
      ItemRange: '24"',
      ItemROF: "1",
      ItemPEN: "n/a",
      ItemNotes: " ",
    },
    {
      ItemSequence: 2,
      ItemLine: 2,
      IsVehicle: "false",
      ItemName: "Stubborn",
      ItemRange: "",
      ItemROF: "-",
      ItemPen: "-",
      ItemNotes: "Stubborn",
    },
  ],
};

describe("Unit.fromWire", () => {
  it("reads string numbers and the unit's book reference", () => {
    const unit = Unit.fromWire(PARATROOPERS, { id: "unit" });

    expect(unit.points).toBe(109);
    expect(unit.experience).toBe("Regular");
    expect(unit.bookReference).toBe("Armies of the United States (v3), p. 36");
    expect(unit.hasOrderDie).toBe(true);
  });

  it("reads ItemPEN and ItemPen alike", () => {
    const sherman = Unit.fromWire(SHERMAN, { id: "unit" });
    const paratroopers = Unit.fromWire(PARATROOPERS, { id: "unit" });

    expect(paratroopers.weapons[0]?.penetration).toBe("n/a");
    expect(sherman.weapons.map((weapon) => weapon.penetration)).toEqual([
      "+5",
      "n/a",
    ]);
  });

  it("reads an item with no quantity that is not a gun as an upgrade", () => {
    const unit = Unit.fromWire(PARATROOPERS, { id: "unit" });

    expect(unit.entries.map((entry) => entry.kind)).toEqual([
      "weapon",
      "option",
    ]);
    expect(unit.entries[1]).toEqual({
      kind: "option",
      id: "unit-item-2",
      name: "Stubborn",
      notes: ["Stubborn"],
    });
  });

  it("lists upgrades after the weapons in its loadout, keeping book order", () => {
    const unit = Unit.fromWire(
      {
        UnitItems: [
          { ItemSequence: 1, ItemQuantity: 7, ItemName: "Infantry with Rifle" },
          { ItemSequence: 2, ItemName: "Stubborn", ItemNotes: "Stubborn" },
          { ItemSequence: 3, ItemQuantity: 1, ItemName: "NCO with SMG" },
          { ItemSequence: 4, ItemName: "Spotter", ItemNotes: "Spotter" },
        ],
      },
      { id: "unit" }
    );

    expect(unit.loadout.map((entry) => entry.name)).toEqual([
      "Infantry with Rifle",
      "NCO with SMG",
      "Stubborn",
      "Spotter",
    ]);
    expect(unit.entries.map((entry) => entry.name)).toEqual([
      "Infantry with Rifle",
      "Stubborn",
      "NCO with SMG",
      "Spotter",
    ]);
  });

  it("sorts items by sequence and nests guns under their vehicle", () => {
    const unit = Unit.fromWire(SHERMAN, { id: "unit" });
    const [vehicle] = unit.entries;

    expect(unit.entries).toHaveLength(1);
    expect(vehicle?.kind).toBe("vehicle");

    if (vehicle?.kind !== "vehicle") {
      throw new Error("Expected the first entry to be a vehicle.");
    }

    expect(vehicle.mobility).toBe("Tracked");
    expect(vehicle.damageValue).toBe("9+");
    expect(vehicle.notes).toEqual(["Easily catches fire"]);
    expect(vehicle.weapons.map((weapon) => weapon.name)).toEqual([
      "Turret-mounted medium anti-tank gun",
      "Co-axial MMG",
    ]);
    expect(vehicle.weapons[0]?.quantity).toBeNull();
    expect(vehicle.weapons[0]?.notes).toEqual([
      '(75mm) HE (2")',
      "Gyro-stabiliser (Veterans only)",
    ]);
  });

  it("keeps a gun with no vehicle before it as a plain weapon", () => {
    const unit = Unit.fromWire(
      { UnitItems: [{ IsGun: "true", ItemName: "Light howitzer" }] },
      { id: "unit" }
    );

    expect(unit.entries.map((entry) => entry.kind)).toEqual(["weapon"]);
  });

  it("starts a new vehicle's weapon list at each vehicle", () => {
    const unit = Unit.fromWire(
      {
        UnitItems: [
          { ItemSequence: 1, ItemLine: 1, IsVehicle: true, ItemName: "A" },
          { ItemSequence: 2, ItemLine: 1, IsGun: true, ItemName: "A gun" },
          { ItemSequence: 3, ItemLine: 2, IsVehicle: true, ItemName: "B" },
          { ItemSequence: 4, ItemLine: 2, IsGun: true, ItemName: "B gun" },
        ],
      },
      { id: "unit" }
    );

    const weaponNames = unit.entries.map((entry) =>
      entry.kind === "vehicle" ? entry.weapons.map((weapon) => weapon.name) : []
    );

    expect(weaponNames).toEqual([["A gun"], ["B gun"]]);
  });

  it("treats a unit with no experience as giving no order die", () => {
    const unit = Unit.fromWire(
      { UnitName: "Command Vehicle rule", UnitPoints: "10", UnitSkill: "" },
      { id: "unit" }
    );

    expect(unit.hasOrderDie).toBe(false);
    expect(unit.entries).toEqual([]);
  });

  it("falls back to zero points and a source-only reference", () => {
    const unit = Unit.fromWire(
      { UnitPoints: "free", Source: "Rulebook" },
      { id: "unit" }
    );

    expect(unit.points).toBe(0);
    expect(unit.bookReference).toBe("Rulebook");
  });

  it("rejects a unit that is not an object", () => {
    expect(() => Unit.fromWire("Squad", { id: "unit" })).toThrow(
      ListParseError
    );
  });
});
