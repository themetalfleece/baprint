import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { Unit } from "@/features/army-list/lib/Unit";
import { isRecord, readText } from "@/lib/wireValues";
import type { PlatoonSection } from "./Platoon.types";

interface PlatoonOptions {
  id: string;
  label: string;
  selector: string;
  name: string;
  units: readonly Unit[];
}

/** One platoon with its units, grouped the way the list builder lays them out. */
export class Platoon {
  /** Unique within the list, stable for a given input. */
  readonly id: string;
  /** EasyArmy's running label, such as "Platoon #1". */
  readonly label: string;
  /** The selector it was built from, such as "Armies of the U.S. - Rifle Platoon (LW)". */
  readonly selector: string;
  /** The player's own name for the platoon; may be empty. */
  readonly name: string;
  readonly units: readonly Unit[];

  constructor(options: PlatoonOptions) {
    this.id = options.id;
    this.label = options.label;
    this.selector = options.selector;
    this.name = options.name;
    this.units = options.units;
  }

  /** The sum of every unit's points. */
  get points(): number {
    return this.units.reduce((total, unit) => total + unit.points, 0);
  }

  /** How many order dice the platoon's units add to the bag. */
  get orderDice(): number {
    return this.units.filter((unit) => unit.hasOrderDie).length;
  }

  /** Consecutive units that share a section, in list order. */
  get sections(): readonly PlatoonSection[] {
    const sections: { id: string; name: string; units: Unit[] }[] = [];

    for (const unit of this.units) {
      const last = sections.at(-1);

      if (last !== undefined && last.name === unit.section) {
        last.units.push(unit);
        continue;
      }

      sections.push({ id: unit.id, name: unit.section, units: [unit] });
    }

    return sections;
  }

  /**
   * Builds a platoon from one EasyArmy `Platoons[]` record.
   *
   * @throws ListParseError when the record is not an object or has no unit array.
   */
  static fromWire(raw: unknown, options: { id: string }): Platoon {
    if (!isRecord(raw) || !Array.isArray(raw.Units)) {
      throw new ListParseError("A platoon in the list has no units.");
    }

    return new Platoon({
      id: options.id,
      label: readText(raw.Platoon),
      selector: Platoon.#cleanSelector(readText(raw.PlatoonName)),
      name: Platoon.#decodeName(readText(raw.PlatoonSubName)),
      units: raw.Units.map((unit, index) =>
        Unit.fromWire(unit, { id: `${options.id}-unit-${index + 1}` })
      ),
    });
  }

  /** Drops the asterisks EasyArmy wraps around some selector names. */
  static #cleanSelector(selector: string): string {
    return selector.replace(/\*/g, "").replace(/\s+/g, " ").trim();
  }

  /** The player's name arrives form-encoded, with `+` for spaces. */
  static #decodeName(name: string): string {
    const spaced = name.replace(/\+/g, " ");

    try {
      return decodeURIComponent(spaced).trim();
    } catch {
      return spaced.trim();
    }
  }
}
