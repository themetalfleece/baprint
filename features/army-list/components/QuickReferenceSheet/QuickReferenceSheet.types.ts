import type { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
import type { Unit } from "@/features/army-list/lib/Unit";
import type { Vehicle, Weapon } from "@/features/army-list/lib/Unit/Unit.types";

export interface QuickReferenceSheetProps {
  list: ArmyList;
  rules: SpecialRuleIndex;
}

export interface QuickUnitRowProps {
  unit: Unit;
}

export interface QuickVehicleLineProps {
  vehicle: Vehicle;
}

export interface QuickWeaponLineProps {
  weapon: Weapon;
}
