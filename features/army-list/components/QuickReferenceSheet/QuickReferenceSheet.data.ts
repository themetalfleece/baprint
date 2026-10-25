import type { Vehicle, Weapon } from "@/features/army-list/lib/Unit/Unit.types";

/** Values EasyArmy uses to mean "no value" in a stat column. */
const EMPTY_STATS: ReadonlySet<string> = new Set(["", "-"]);

/** A weapon's range, shots and pen joined with slashes, skipping blanks. */
export function formatWeaponStats(weapon: Weapon): string {
  return [weapon.range, weapon.shots, weapon.penetration]
    .filter((stat) => !EMPTY_STATS.has(stat))
    .join(" / ");
}

/** A vehicle's type, damage value and any transport capacity in one phrase. */
export function formatVehicleStats(vehicle: Vehicle): string {
  const parts = [vehicle.mobility];

  if (!EMPTY_STATS.has(vehicle.damageValue)) {
    parts.push(`DV ${vehicle.damageValue}`);
  }

  if (!EMPTY_STATS.has(vehicle.transport)) {
    parts.push(`transports ${vehicle.transport}`);
  }

  return parts.filter((part) => part !== "").join(", ");
}

/** The first three letters of an experience level, such as "Reg" or "Vet". */
export function abbreviateExperience(experience: string): string {
  return experience.slice(0, 3);
}
