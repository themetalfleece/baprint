import styles from "./ArmyListSheet.module.css";
import type { OptionRowProps } from "./ArmyListSheet.types";

/** An upgrade with no stat line, such as Stubborn or a Spotter. */
export function OptionRow({ option }: OptionRowProps) {
  const notes = option.notes.filter((note) => note !== option.name).join(", ");

  return (
    <tr className={styles.row}>
      <td />
      <td className={styles.optionName} colSpan={4}>
        {option.name}
      </td>
      <td className={styles.special}>{notes}</td>
    </tr>
  );
}
