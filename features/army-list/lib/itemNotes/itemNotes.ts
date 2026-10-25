/**
 * Splits an item's notes on top-level commas, so `Team (2 men), HE (2")`
 * becomes two entries while commas inside parentheses stay put.
 */
export function splitItemNotes(notes: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const character of notes) {
    if (character === "(") {
      depth += 1;
    }

    if (character === ")" && depth > 0) {
      depth -= 1;
    }

    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  parts.push(current);

  return parts.map((part) => part.trim()).filter((part) => part !== "");
}

/**
 * The rule label a note refers to. Drops a leading calibre such as `(75mm)`
 * and a trailing "special rule", so `(75mm) HE (2")` reads `HE (2")`.
 */
export function ruleLabelOf(note: string): string {
  return note
    .replace(/^\([^)]*\)\s*/, "")
    .replace(/\s+special rule$/i, "")
    .trim();
}

/**
 * The lookup key shared by every variant of a rule: lower case, with any
 * trailing parenthetical dropped, so `Team (2 men)` and `Team (3 men)` both
 * key `team`.
 */
export function ruleKeyOf(label: string): string {
  return label
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim()
    .toLowerCase();
}
