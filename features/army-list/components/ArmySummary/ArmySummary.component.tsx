import styles from "./ArmySummary.module.css";
import type { ArmySummaryProps } from "./ArmySummary.types";

/** The sheet's masthead: what the army is, its points and its order dice. */
export function ArmySummary({ list }: ArmySummaryProps) {
  const countries = list.countries.join(", ");

  return (
    <header className={styles.summary}>
      <div className={styles.titles}>
        <h1 className={styles.title}>Bolt Action army list</h1>
        {countries !== "" && <p className={styles.countries}>{countries}</p>}
      </div>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Points</dt>
          <dd className={styles.statValue}>{list.points}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Order dice</dt>
          <dd className={styles.statValue}>{list.orderDice}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Platoons</dt>
          <dd className={styles.statValue}>{list.platoons.length}</dd>
        </div>
      </dl>
    </header>
  );
}
