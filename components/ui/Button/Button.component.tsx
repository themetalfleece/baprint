import clsx from "clsx";
import styles from "./Button.module.css";
import type { ButtonProps } from "./Button.types";

/** An outlined button. Defaults to `type="button"` so it never submits by accident. */
export function Button({
  children,
  variant = "secondary",
  type = "button",
  ...nativeProps
}: ButtonProps) {
  return (
    <button
      {...nativeProps}
      type={type}
      className={clsx(styles.button, variant === "primary" && styles.primary)}
    >
      {children}
    </button>
  );
}
