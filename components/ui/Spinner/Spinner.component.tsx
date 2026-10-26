import styles from "./Spinner.module.css";

/** A small turning ring in the current text colour. Decorative: pair it with text. */
export function Spinner() {
  return <span className={styles.spinner} aria-hidden="true" />;
}
