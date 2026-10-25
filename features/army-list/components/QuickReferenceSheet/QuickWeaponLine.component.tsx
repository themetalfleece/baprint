import { formatWeaponStats } from "./QuickReferenceSheet.data";
import styles from "./QuickReferenceSheet.module.css";
import type { QuickWeaponLineProps } from "./QuickReferenceSheet.types";

/** A weapon as one line: count, name, then its stats and rules. */
export function QuickWeaponLine({ weapon }: QuickWeaponLineProps) {
  const stats = formatWeaponStats(weapon);

  return (
    <li className={styles.weapon}>
      {weapon.quantity !== null && (
        <span className={styles.quantity}>{weapon.quantity}×</span>
      )}
      <span className={styles.weaponName}>{weapon.name}</span>
      {stats !== "" && <span className={styles.stats}>{stats}</span>}
      {weapon.notes.length > 0 && (
        <span className={styles.notes}>{weapon.notes.join(", ")}</span>
      )}
    </li>
  );
}
