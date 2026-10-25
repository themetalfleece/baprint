import { splitItemNotes } from "@/features/army-list/lib/itemNotes";
import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { assertNever } from "@/lib/assertNever";
import { isRecord, readCount, readFlag, readText } from "@/lib/wireValues";
import type { UnitEntry, Vehicle, Weapon } from "./Unit.types";

interface UnitOptions {
  id: string;
  section: string;
  name: string;
  source: string;
  sourcePage: string;
  points: number;
  experience: string;
  entries: readonly UnitEntry[];
}

/** One unit on the list, with its weapons, vehicles and upgrades in book order. */
export class Unit {
  /** Unique within the list, stable for a given input. */
  readonly id: string;
  /** The force-organisation slot, such as "Infantry" or "Command Vehicle". */
  readonly section: string;
  readonly name: string;
  /** The book the unit comes from. */
  readonly source: string;
  readonly sourcePage: string;
  readonly points: number;
  /** "Inexperienced", "Regular" or "Veteran"; empty for an upgrade-only entry. */
  readonly experience: string;
  readonly entries: readonly UnitEntry[];

  constructor(options: UnitOptions) {
    this.id = options.id;
    this.section = options.section;
    this.name = options.name;
    this.source = options.source;
    this.sourcePage = options.sourcePage;
    this.points = options.points;
    this.experience = options.experience;
    this.entries = options.entries;
  }

  /**
   * Whether the unit puts an order die in the bag. Upgrade-only entries, such
   * as the Command Vehicle rule, have no experience level and no die.
   */
  get hasOrderDie(): boolean {
    return this.experience !== "";
  }

  /** The book and page to look the unit up in, such as "Armies of the United States (v3), p. 27". */
  get bookReference(): string {
    if (this.sourcePage === "") {
      return this.source;
    }

    return `${this.source}, p. ${this.sourcePage}`;
  }

  /**
   * The entries in the order a sheet shows them: weapons and vehicles in book
   * order, then upgrades. EasyArmy can place a unit-wide upgrade such as
   * Stubborn between two weapons, where it reads as part of the one above.
   */
  get loadout(): readonly UnitEntry[] {
    return [
      ...this.entries.filter((entry) => entry.kind !== "option"),
      ...this.entries.filter((entry) => entry.kind === "option"),
    ];
  }

  /** Every weapon on the unit, vehicle-mounted ones included. */
  get weapons(): readonly Weapon[] {
    return this.entries.flatMap((entry) => {
      if (entry.kind === "weapon") {
        return [entry];
      }

      if (entry.kind === "vehicle") {
        return entry.weapons;
      }

      if (entry.kind === "option") {
        return [];
      }

      return assertNever(entry);
    });
  }

  /**
   * Builds a unit from one EasyArmy `Units[]` record.
   *
   * @throws ListParseError when the record is not an object.
   */
  static fromWire(raw: unknown, options: { id: string }): Unit {
    if (!isRecord(raw)) {
      throw new ListParseError("A unit in the list is not an object.");
    }

    const items = Array.isArray(raw.UnitItems) ? raw.UnitItems : [];

    return new Unit({
      id: options.id,
      section: readText(raw.SectionName),
      name: readText(raw.UnitName),
      source: readText(raw.Source),
      sourcePage: readText(raw.SourcePage),
      points: readCount(raw.UnitPoints) ?? 0,
      experience: readText(raw.UnitSkill),
      entries: Unit.#readEntries({ items, unitId: options.id }),
    });
  }

  /**
   * Turns flat `UnitItems` into entries. A vehicle owns the gun items that
   * follow it on the same `ItemLine`; an item with no quantity that is not a
   * gun is an upgrade.
   */
  static #readEntries(options: {
    items: readonly unknown[];
    unitId: string;
  }): UnitEntry[] {
    const records = options.items.filter(isRecord).toSorted(Unit.#bySequence);
    const entries: UnitEntry[] = [];
    let vehicleWeapons: Weapon[] | null = null;
    let vehicleLine: number | null = null;

    for (const [index, record] of records.entries()) {
      const id = `${options.unitId}-item-${index + 1}`;
      const line = readCount(record.ItemLine);

      if (readFlag(record.IsVehicle)) {
        vehicleWeapons = [];
        vehicleLine = line;
        entries.push(
          Unit.#readVehicle({ record, id, weapons: vehicleWeapons })
        );
        continue;
      }

      const isGun = readFlag(record.IsGun);

      if (isGun && vehicleWeapons !== null && line === vehicleLine) {
        vehicleWeapons.push(Unit.#readWeapon(record, id));
        continue;
      }

      if (!isGun && readCount(record.ItemQuantity) === null) {
        entries.push({
          kind: "option",
          id,
          name: readText(record.ItemName),
          notes: splitItemNotes(readText(record.ItemNotes)),
        });
        continue;
      }

      entries.push(Unit.#readWeapon(record, id));
    }

    return entries;
  }

  static #readVehicle(options: {
    record: Record<string, unknown>;
    id: string;
    weapons: readonly Weapon[];
  }): Vehicle {
    const { record, id, weapons } = options;

    return {
      kind: "vehicle",
      id,
      quantity: readCount(record.ItemQuantity),
      name: readText(record.ItemName),
      mobility: readText(record.ItemMobility),
      transport: readText(record.ItemTransport),
      damageValue: readText(record.ItemDamageValue),
      notes: splitItemNotes(readText(record.ItemNotes)),
      weapons,
    };
  }

  static #readWeapon(record: Record<string, unknown>, id: string): Weapon {
    return {
      kind: "weapon",
      id,
      quantity: readCount(record.ItemQuantity),
      name: readText(record.ItemName),
      range: readText(record.ItemRange),
      shots: readText(record.ItemROF),
      penetration: Unit.#readPenetration(record),
      notes: splitItemNotes(readText(record.ItemNotes)),
    };
  }

  /** EasyArmy spells the field `ItemPEN` on infantry and `ItemPen` elsewhere. */
  static #readPenetration(record: Record<string, unknown>): string {
    if (Object.hasOwn(record, "ItemPEN")) {
      return readText(record.ItemPEN);
    }

    return readText(record.ItemPen);
  }

  static #bySequence(
    first: Record<string, unknown>,
    second: Record<string, unknown>
  ): number {
    const firstSequence = readCount(first.ItemSequence) ?? 0;
    const secondSequence = readCount(second.ItemSequence) ?? 0;

    return firstSequence - secondSequence;
  }
}
