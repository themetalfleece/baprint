import { describe, expect, it } from "vitest";
import {
  abbreviateExperience,
  formatVehicleStats,
  formatWeaponStats,
} from "@/features/army-list/components/QuickReferenceSheet/QuickReferenceSheet.data";
import type { Vehicle, Weapon } from "@/features/army-list/lib/Unit/Unit.types";

function weapon(stats: Partial<Weapon>): Weapon {
  return {
    kind: "weapon",
    id: "weapon",
    quantity: 1,
    name: "Rifle",
    range: "",
    shots: "",
    penetration: "",
    notes: [],
    ...stats,
  };
}

function vehicle(stats: Partial<Vehicle>): Vehicle {
  return {
    kind: "vehicle",
    id: "vehicle",
    quantity: 1,
    name: "Sherman",
    mobility: "",
    transport: "",
    damageValue: "",
    notes: [],
    weapons: [],
    ...stats,
  };
}

describe("formatWeaponStats", () => {
  it("joins range, shots and pen", () => {
    expect(
      formatWeaponStats(weapon({ range: '24"', shots: "1", penetration: "+5" }))
    ).toBe('24" / 1 / +5');
  });

  it("skips blank and dash values", () => {
    expect(formatWeaponStats(weapon({ shots: "-", penetration: "-" }))).toBe(
      ""
    );
    expect(formatWeaponStats(weapon({ range: '36"', shots: "5" }))).toBe(
      '36" / 5'
    );
  });
});

describe("formatVehicleStats", () => {
  it("reads type and damage value, leaving out an empty transport", () => {
    expect(
      formatVehicleStats(
        vehicle({ mobility: "Tracked", transport: "-", damageValue: "9+" })
      )
    ).toBe("Tracked, DV 9+");
  });

  it("includes transport capacity when there is one", () => {
    expect(
      formatVehicleStats(
        vehicle({ mobility: "Wheeled", transport: "12", damageValue: "7+" })
      )
    ).toBe("Wheeled, DV 7+, transports 12");
  });

  it("is empty for a vehicle with no stats", () => {
    expect(formatVehicleStats(vehicle({}))).toBe("");
  });
});

describe("abbreviateExperience", () => {
  it("shortens to three letters", () => {
    expect(abbreviateExperience("Regular")).toBe("Reg");
    expect(abbreviateExperience("Veteran")).toBe("Vet");
  });

  it("leaves an empty level empty", () => {
    expect(abbreviateExperience("")).toBe("");
  });
});
