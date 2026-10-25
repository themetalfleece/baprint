/** Exhaustiveness tail for closed-union dispatch: a new member fails compilation here. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled member: ${String(value)}`);
}
