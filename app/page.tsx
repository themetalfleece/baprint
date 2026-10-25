import { ArmyListWorkbench } from "@/features/army-list/components/ArmyListWorkbench";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <header className={styles.intro}>
        <h1 className={styles.title}>wgeaprint</h1>
        <p className={styles.lede}>
          Load an EasyArmy Bolt Action list and print it as a clean, black and
          grey sheet. Unit cards never split across pages.
        </p>
      </header>
      <ArmyListWorkbench />
    </>
  );
}
