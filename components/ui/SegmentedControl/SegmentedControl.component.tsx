import { type ChangeEvent, useId } from "react";
import styles from "./SegmentedControl.module.css";
import type { SegmentedControlProps } from "./SegmentedControl.types";

/** A row of mutually exclusive choices, built on native radio buttons. */
export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  const groupName = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = options.find(
      (option) => option.value === event.currentTarget.value
    );

    if (selected !== undefined) {
      onChange(selected.value);
    }
  };

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              className={styles.input}
              type="radio"
              name={groupName}
              value={option.value}
              checked={option.value === value}
              onChange={handleChange}
            />
            <span className={styles.optionLabel}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
