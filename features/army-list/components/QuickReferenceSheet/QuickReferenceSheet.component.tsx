import { ArmySummary } from "@/features/army-list/components/ArmySummary";
import { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
import styles from "./QuickReferenceSheet.module.css";
import type { QuickReferenceSheetProps } from "./QuickReferenceSheet.types";
import { QuickUnitRow } from "./QuickUnitRow.component";

/** The whole list on one dense page: a row per unit and a line of rule references. */
export function QuickReferenceSheet({ list, rules }: QuickReferenceSheetProps) {
  return (
    <article className={styles.sheet}>
      <ArmySummary list={list} />
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
      {rules.entries.length > 0 && (
        <section className={styles.rules}>
          <h2 className={styles.rulesHeading}>Special rules</h2>
          <ul className={styles.ruleList}>
            {rules.entries.map((rule) => (
              <li key={rule.label} className={styles.rule}>
                <span className={styles.ruleName}>{rule.label}</span>{" "}
                <span className={styles.ruleReference}>
                  {SpecialRuleIndex.formatReference(rule.reference)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
