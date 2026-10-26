import { ArmyListWorkbench } from "@/features/army-list/components/ArmyListWorkbench";
import { LegalNotice } from "@/features/army-list/components/LegalNotice";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <header className={styles.hero}>
        <p className={styles.kicker}>Bolt Action list printer</p>
        <h1 className={styles.title}>baprint</h1>
        <p className={styles.lede}>
          Load an EasyArmy Bolt Action list and print it as a clean, black and
          grey sheet for the table.
        </p>
        <ul className={styles.features}>
          <li>Black and grey print</li>
          <li>Unit cards never split</li>
          <li>A page per platoon</li>
        </ul>
      </header>
      <ArmyListWorkbench />
      <LegalNotice />
    </>
  );
}
