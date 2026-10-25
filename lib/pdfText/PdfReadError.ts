import type { PdfReadFailure } from "./pdfText.types";

/** Thrown when data cannot be read as a text PDF. */
export class PdfReadError extends Error {
  override readonly name = "PdfReadError";
  readonly reason: PdfReadFailure;

  constructor(reason: PdfReadFailure) {
    super(`The PDF could not be read (${reason}).`);
    this.reason = reason;
  }
}
