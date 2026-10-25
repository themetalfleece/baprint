import type { Rect } from "./pdfText.types";

/** A PDF affine matrix `[a, b, c, d, e, f]`. */
export type Matrix = readonly [number, number, number, number, number, number];

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** Reads six numbers from a pdfjs argument, or `null` when it is not a matrix. */
export function toMatrix(value: unknown): Matrix | null {
  if (!isNumberList(value) || value.length < 6) {
    return null;
  }

  const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = Array.from(value);

  return [a, b, c, d, e, f];
}

/** The matrix that applies `inner` first, then `outer`. */
export function compose(outer: Matrix, inner: Matrix): Matrix {
  const [a, b, c, d, e, f] = outer;
  const [g, h, i, j, k, l] = inner;

  return [
    a * g + c * h,
    b * g + d * h,
    a * i + c * j,
    b * i + d * j,
    a * k + c * l + e,
    b * k + d * l + f,
  ];
}

export function applyToPoint(
  matrix: Matrix,
  x: number,
  y: number
): { x: number; y: number } {
  const [a, b, c, d, e, f] = matrix;

  return { x: a * x + c * y + e, y: b * x + d * y + f };
}

/** The bounding box of a rectangle after a transform. */
export function applyToRect(matrix: Matrix, rect: Rect): Rect {
  const [minX, minY, maxX, maxY] = rect;
  const corners = [
    applyToPoint(matrix, minX, minY),
    applyToPoint(matrix, minX, maxY),
    applyToPoint(matrix, maxX, minY),
    applyToPoint(matrix, maxX, maxY),
  ];
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);

  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

export function intersect(first: Rect, second: Rect): Rect {
  return [
    Math.max(first[0], second[0]),
    Math.max(first[1], second[1]),
    Math.min(first[2], second[2]),
    Math.min(first[3], second[3]),
  ];
}

/** True for a plain array or typed array of numbers. */
export function isNumberList(value: unknown): value is ArrayLike<number> {
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    return true;
  }

  return (
    Array.isArray(value) && value.every((item) => typeof item === "number")
  );
}
