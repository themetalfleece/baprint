import type { Unit } from "@/features/army-list/lib/Unit";

/** A run of consecutive units in one force-organisation slot. */
export interface PlatoonSection {
  /** The id of the section's first unit. */
  id: string;
  name: string;
  units: readonly Unit[];
}
