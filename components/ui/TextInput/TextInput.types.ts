import type { InputHTMLAttributes } from "react";

export interface TextInputProps
  extends Pick<
    InputHTMLAttributes<HTMLInputElement>,
    | "name"
    | "value"
    | "onChange"
    | "placeholder"
    | "autoComplete"
    | "spellCheck"
    | "inputMode"
    | "aria-describedby"
  > {
  /** The visible label above the field. */
  label: string;
}
