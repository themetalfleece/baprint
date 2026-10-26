import clsx from "clsx";
import { type FocusEvent, useId } from "react";
import styles from "./TextInput.module.css";
import type { TextInputProps } from "./TextInput.types";

function selectAllText(event: FocusEvent<HTMLInputElement>) {
  event.currentTarget.select();
}

/** A labelled single-line text field. */
export function TextInput({
  label,
  selectOnFocus = false,
  ...nativeProps
}: TextInputProps) {
  const id = useId();

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        {...nativeProps}
        id={id}
        type="text"
        className={clsx(styles.input, selectOnFocus && styles.selectOnFocus)}
        onFocus={selectOnFocus ? selectAllText : undefined}
      />
    </div>
  );
}
