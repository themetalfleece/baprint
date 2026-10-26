import styles from "./ArmyListSheet.module.css";
import type { PlatoonBlockProps } from "./ArmyListSheet.types";
import { UnitCard } from "./UnitCard.component";

/** A platoon heading with its points and dice, then its units by section. */
export function PlatoonBlock({ platoon }: PlatoonBlockProps) {
  return (
    <section className={styles.platoon} data-fit-page>
      <header className={styles.platoonHeader}>
        <h2 className={styles.platoonLabel}>{platoon.label}</h2>
        <p className={styles.platoonTotals}>
          <span>{platoon.points} pts</span>
          <span>{platoon.orderDice} order dice</span>
        </p>
      </header>
      <p className={styles.platoonSelector}>
        {platoon.selector}
        {platoon.name !== "" && (
          <span className={styles.platoonName}>{platoon.name}</span>
        )}
      </p>
      {platoon.sections.map((section) => (
        <div key={section.id} className={styles.section}>
          <h3 className={styles.sectionLabel}>{section.name}</h3>
          {section.units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      ))}
    </section>
  );
}
