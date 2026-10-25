import type { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { PickListItem } from "@/features/army-list/lib/ArmyList/ArmyList.types";
import type { Platoon } from "@/features/army-list/lib/Platoon";
import type { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
import type { Unit } from "@/features/army-list/lib/Unit";
import type {
  UnitOption,
  Vehicle,
  Weapon,
} from "@/features/army-list/lib/Unit/Unit.types";

export interface ArmyListSheetProps {
  list: ArmyList;
  rules: SpecialRuleIndex;
}

export interface PlatoonBlockProps {
  platoon: Platoon;
}

export interface UnitCardProps {
  unit: Unit;
}

export interface WeaponRowProps {
  weapon: Weapon;
  /** Indents the name under the vehicle it is mounted on. */
  mounted: boolean;
}

export interface VehicleRowsProps {
  vehicle: Vehicle;
}

export interface OptionRowProps {
  option: UnitOption;
}

export interface SpecialRulesSectionProps {
  rules: SpecialRuleIndex;
}

export interface PickListSectionProps {
  items: readonly PickListItem[];
}
