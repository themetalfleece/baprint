/** An axis-aligned box in PDF points: `[minX, minY, maxX, maxY]`, y up. */
export type Rect = readonly [number, number, number, number];

/** One run of text as drawn on the page, positioned at its baseline start. */
export interface TextRun {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  isBold: boolean;
}

/** Runs that share a baseline, left to right. */
export interface TextLine {
  /** The baseline of the line's first run. */
  y: number;
  runs: readonly TextRun[];
  /** The runs' text, with a space wherever the page shows a gap. */
  text: string;
}

/** What the collector needs to know about a font. */
export interface FontInfo {
  /** The horizontal font-matrix scale, usually 0.001. */
  scale: number;
  isBold: boolean;
}

/** Why a file could not be read as text. */
export type PdfReadFailure = "not_pdf" | "encrypted" | "no_text" | "unreadable";
