import styles from "./QuickReferenceSheet.module.css";
import type { QuickReferenceSheetProps } from "./QuickReferenceSheet.types";
import { QuickUnitRow } from "./QuickUnitRow.component";

/** The whole army as one dense table, a row per unit, for the first printed page. */
export function QuickReferenceSheet({ list }: QuickReferenceSheetProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">Unit</th>
          <th className={styles.centred} scope="col">
            Exp
          </th>
          <th className={styles.numeric} scope="col">
            Pts
          </th>
          <th scope="col">Weapons: range, shots, pen, special</th>
        </tr>
      </thead>
      {list.platoons.map((platoon) => (
        <tbody key={platoon.id} className={styles.platoon}>
          <tr>
            <th className={styles.platoonCell} colSpan={4} scope="rowgroup">
              <div className={styles.platoonHeading}>
                <span className={styles.platoonLabel}>{platoon.label}</span>
                <span className={styles.platoonSelector}>
                  {platoon.selector}
                </span>
                <span className={styles.platoonTotals}>
                  {platoon.points} pts, {platoon.orderDice} dice
                </span>
              </div>
            </th>
          </tr>
          {platoon.units.map((unit) => (
            <QuickUnitRow key={unit.id} unit={unit} />
          ))}
        </tbody>
      ))}
    </table>
  );
}
