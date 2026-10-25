import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps
  extends Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "onClick" | "disabled" | "aria-describedby"
  > {
  children: ReactNode;
  /** `primary` is drawn heavier, for the one main action in a group. */
  variant?: ButtonVariant;
}
