import styles from "./ArmyListSheet.module.css";
import type { PickListSectionProps } from "./ArmyListSheet.types";

/** The models to bring to the table, with counts, in a few short columns under the summary. */
export function PickListSection({ items }: PickListSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.pickList}>
      <h2 className={styles.sectionLabel}>Pick list</h2>
      <ul className={styles.pickItems}>
        {items.map((item) => (
          <li key={item.id} className={styles.pickItem}>
            <span className={styles.pickCount}>
              {item.quantity}
              <span className={styles.pickTimes}>×</span>
            </span>
            <span>{item.item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
