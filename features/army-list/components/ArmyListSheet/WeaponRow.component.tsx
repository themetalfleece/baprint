import clsx from "clsx";
import styles from "./ArmyListSheet.module.css";
import type { WeaponRowProps } from "./ArmyListSheet.types";

/** One weapon's stat line. */
export function WeaponRow({ weapon, mounted }: WeaponRowProps) {
  return (
    <tr className={styles.row}>
      <td className={styles.quantity}>{weapon.quantity}</td>
      <td className={clsx(styles.weaponName, mounted && styles.mounted)}>
        {weapon.name}
      </td>
      <td className={styles.stat}>{weapon.range}</td>
      <td className={styles.stat}>{weapon.shots}</td>
      <td className={styles.stat}>{weapon.penetration}</td>
      <td className={styles.special}>{weapon.notes.join(", ")}</td>
    </tr>
  );
}
