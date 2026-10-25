import styles from "./Badge.module.css";
import type { BadgeProps } from "./Badge.types";

/** A small outlined uppercase pill, such as a unit's experience level. */
export function Badge({ children }: BadgeProps) {
  return <span className={styles.badge}>{children}</span>;
}
