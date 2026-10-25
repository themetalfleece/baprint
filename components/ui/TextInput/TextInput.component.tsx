import { useId } from "react";
import styles from "./TextInput.module.css";
import type { TextInputProps } from "./TextInput.types";

/** A labelled single-line text field. */
export function TextInput({ label, ...nativeProps }: TextInputProps) {
  const id = useId();

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input {...nativeProps} id={id} type="text" className={styles.input} />
    </div>
  );
}
