import clsx from "clsx";
import styles from "./LoadingSheet.module.css";

/** One grey unit card: a name, a points value and a few weapon rows. */
function PlaceholderCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={clsx(styles.bar, styles.cardName)} />
        <span className={clsx(styles.bar, styles.cardPoints)} />
      </div>
      <span className={clsx(styles.bar, styles.row)} />
      <span className={clsx(styles.bar, styles.row)} />
      <span className={clsx(styles.bar, styles.row, styles.rowShort)} />
    </div>
  );
}

/**
 * The outline of a sheet, shown in its place while a list loads. Decorative
 * only: the workbench's status line tells assistive tech what is happening.
 */
export function LoadingSheet() {
  return (
    <div className={styles.loadingSheet} aria-hidden="true">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={clsx(styles.bar, styles.title)} />
          <span className={clsx(styles.bar, styles.subtitle)} />
        </div>
        <div className={styles.stats}>
          <span className={styles.stat} />
          <span className={styles.stat} />
          <span className={styles.stat} />
        </div>
      </div>
      <span className={clsx(styles.bar, styles.sectionLabel)} />
      <div className={styles.cards}>
        <PlaceholderCard />
        <PlaceholderCard />
        <PlaceholderCard />
        <PlaceholderCard />
      </div>
    </div>
  );
}
