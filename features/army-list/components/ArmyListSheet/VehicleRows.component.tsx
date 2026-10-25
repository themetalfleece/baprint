import styles from "./ArmyListSheet.module.css";
import type { VehicleRowsProps } from "./ArmyListSheet.types";
import { WeaponRow } from "./WeaponRow.component";

/** A vehicle's name, its type, transport and damage value line, then its weapons. */
export function VehicleRows({ vehicle }: VehicleRowsProps) {
  return (
    <>
      <tr className={styles.row}>
        <td className={styles.quantity}>{vehicle.quantity}</td>
        <td className={styles.vehicleName} colSpan={5}>
          {vehicle.name}
        </td>
      </tr>
      <tr className={styles.row}>
        <td />
        <td colSpan={4}>
          <dl className={styles.vehicleStats}>
            <div className={styles.vehicleStat}>
              <dt>Type</dt>
              <dd>{vehicle.mobility}</dd>
            </div>
            <div className={styles.vehicleStat}>
              <dt>Transport</dt>
              <dd>{vehicle.transport}</dd>
            </div>
            <div className={styles.vehicleStat}>
              <dt>Damage value</dt>
              <dd>{vehicle.damageValue}</dd>
            </div>
          </dl>
        </td>
        <td className={styles.special}>{vehicle.notes.join(", ")}</td>
      </tr>
      {vehicle.weapons.map((weapon) => (
        <WeaponRow key={weapon.id} weapon={weapon} mounted />
      ))}
    </>
  );
}
