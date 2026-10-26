import type { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { Unit } from "@/features/army-list/lib/Unit";
import type { Vehicle, Weapon } from "@/features/army-list/lib/Unit/Unit.types";

export interface QuickReferenceSheetProps {
  list: ArmyList;
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
