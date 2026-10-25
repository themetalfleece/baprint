/** A weapon line: a rifle, a squad's SMGs, or a gun mounted on a vehicle. */
export interface Weapon {
  kind: "weapon";
  /** Unique within the list, stable for a given input. */
  id: string;
  /** `null` for vehicle-mounted weapons, which carry no count of their own. */
  quantity: number | null;
  name: string;
  range: string;
  shots: string;
  penetration: string;
  notes: readonly string[];
}

/** A vehicle with the weapons mounted on it. */
export interface Vehicle {
  kind: "vehicle";
  id: string;
  quantity: number | null;
  name: string;
  mobility: string;
  transport: string;
  damageValue: string;
  notes: readonly string[];
  weapons: readonly Weapon[];
}

/** An upgrade with no models of its own, such as Stubborn or a Spotter. */
export interface UnitOption {
  kind: "option";
  id: string;
  name: string;
  notes: readonly string[];
}

export type UnitEntry = Weapon | Vehicle | UnitOption;
