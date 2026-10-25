/** True for a plain object, the shape every JSON record decodes to. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a field as trimmed text. Numbers are stringified, and anything else
 * (null, undefined, objects) reads as an empty string.
 */
export function readText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

/** Reads a boolean that may arrive as `true`, `"true"`, `"True"` or `1`. */
export function readFlag(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const text = readText(value).toLowerCase();

  return text === "true" || text === "1";
}

/**
 * Reads a whole number that may arrive as a number or a numeric string.
 * Returns `null` when the field is missing or does not hold an integer.
 */
export function readCount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }

  const text = readText(value);

  if (!/^-?\d+$/.test(text)) {
    return null;
  }

  return Number.parseInt(text, 10);
}
