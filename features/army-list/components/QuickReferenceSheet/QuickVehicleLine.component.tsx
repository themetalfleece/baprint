import { formatVehicleStats } from "./QuickReferenceSheet.data";
import styles from "./QuickReferenceSheet.module.css";
import type { QuickVehicleLineProps } from "./QuickReferenceSheet.types";
import { QuickWeaponLine } from "./QuickWeaponLine.component";

/** A vehicle's profile on one line, with its weapons nested under it. */
export function QuickVehicleLine({ vehicle }: QuickVehicleLineProps) {
  return (
    <li className={styles.vehicle}>
      <span className={styles.stats}>{formatVehicleStats(vehicle)}</span>
      {vehicle.notes.length > 0 && (
        <span className={styles.notes}>{vehicle.notes.join(", ")}</span>
      )}
      <ul className={styles.loadout}>
        {vehicle.weapons.map((weapon) => (
          <QuickWeaponLine key={weapon.id} weapon={weapon} />
        ))}
      </ul>
    </li>
  );
}
