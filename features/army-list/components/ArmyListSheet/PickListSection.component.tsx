import styles from "./ArmyListSheet.module.css";
import type { PickListSectionProps } from "./ArmyListSheet.types";

/** The models to bring to the table, with counts. */
export function PickListSection({ items }: PickListSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.appendix}>
      <h2 className={styles.appendixHeading}>Pick list</h2>
      <table className={styles.pickList}>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th className={styles.pickCount} scope="col">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={styles.row}>
              <td>{item.item}</td>
              <td className={styles.pickCount}>
                <span className={styles.pickTimes}>×</span> {item.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
