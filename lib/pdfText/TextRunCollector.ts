import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  applyToPoint,
  applyToRect,
  compose,
  IDENTITY,
  intersect,
  isNumberList,
  type Matrix,
  toMatrix,
} from "./matrix";
import type { FontInfo, Rect, TextRun } from "./pdfText.types";

/** The part of a pdfjs operator list the collector reads. */
export interface OperatorList {
  fnArray: readonly number[];
  argsArray: readonly unknown[];
}

interface CollectOptions {
  /** The page's visible box; nothing outside it is collected. */
  pageBox: Rect;
  fontOf: (fontName: string) => FontInfo;
}

/** Graphics state saved by `q` and restored by `Q`, text parameters included. */
interface GraphicsState {
  ctm: Matrix;
  clip: Rect;
  fontSize: number;
  font: FontInfo;
  charSpacing: number;
  wordSpacing: number;
  horizontalScale: number;
  leading: number;
  rise: number;
}

interface Glyph {
  unicode: string;
  width: number;
  isSpace?: boolean;
}

const DEFAULT_FONT: FontInfo = { scale: 0.001, isBold: false };
/** Matches invisible format characters, which pdfjs also leaves out of text. */
const FORMAT_CHARACTER = /^\p{Cf}$/u;
const SOFT_HYPHEN = "­";
const NO_BREAK_SPACE = " ";
/** How far outside the clip a baseline may start and still count as visible. */
const CLIP_TOLERANCE = 0.5;

/**
 * Walks a page's operator list and collects the text runs a reader would
 * see. Unlike pdfjs `getTextContent`, it honours clipping, so content a page
 * clips away is skipped, and it keeps soft hyphens, which some PDF writers
 * map their hyphen glyph to, as "-".
 */
export class TextRunCollector {
  readonly #runs: TextRun[] = [];
  readonly #stack: GraphicsState[] = [];
  readonly #fontOf: (fontName: string) => FontInfo;
  readonly #handlers: ReadonlyMap<number, (args: unknown) => void>;
  #state: GraphicsState;
  #textMatrix: Matrix = IDENTITY;
  #lineX = 0;
  #lineY = 0;
  #x = 0;
  #y = 0;
  #clipPending = false;

  private constructor(options: CollectOptions) {
    this.#fontOf = options.fontOf;
    this.#state = {
      ctm: IDENTITY,
      clip: options.pageBox,
      fontSize: 0,
      font: DEFAULT_FONT,
      charSpacing: 0,
      wordSpacing: 0,
      horizontalScale: 1,
      leading: 0,
      rise: 0,
    };
    this.#handlers = new Map<number, (args: unknown) => void>([
      [OPS.save, () => this.#save()],
      [OPS.restore, () => this.#restore()],
      [OPS.transform, (args) => this.#transform(toMatrix(args))],
      [OPS.paintFormXObjectBegin, (args) => this.#beginForm(args)],
      [OPS.paintFormXObjectEnd, () => this.#restore()],
      [OPS.clip, () => this.#markClip()],
      [OPS.eoClip, () => this.#markClip()],
      [OPS.constructPath, (args) => this.#constructPath(args)],
      [OPS.endPath, () => this.#endPath()],
      [OPS.beginText, () => this.#beginText()],
      [OPS.setFont, (args) => this.#setFont(args)],
      [OPS.setCharSpacing, (args) => this.#setNumber("charSpacing", args)],
      [OPS.setWordSpacing, (args) => this.#setNumber("wordSpacing", args)],
      [OPS.setHScale, (args) => this.#setHorizontalScale(args)],
      [OPS.setLeading, (args) => this.#setLeading(args)],
      [OPS.setTextRise, (args) => this.#setNumber("rise", args)],
      [OPS.moveText, (args) => this.#moveText(args)],
      [OPS.setLeadingMoveText, (args) => this.#setLeadingMoveText(args)],
      [OPS.setTextMatrix, (args) => this.#setTextMatrix(args)],
      [OPS.nextLine, () => this.#nextLine()],
      [OPS.showText, (args) => this.#showText(firstArg(args))],
      [OPS.showSpacedText, (args) => this.#showText(firstArg(args))],
      [OPS.nextLineShowText, (args) => this.#nextLineShowText(args)],
      [OPS.nextLineSetSpacingShowText, (args) => this.#spacedLineText(args)],
    ]);
  }

  /** The visible text runs of one page, in drawing order. */
  static collect(
    operatorList: OperatorList,
    options: CollectOptions
  ): TextRun[] {
    const collector = new TextRunCollector(options);

    for (const [index, fn] of operatorList.fnArray.entries()) {
      collector.#handlers.get(fn)?.(operatorList.argsArray[index]);
    }

    return collector.#runs;
  }

  #save(): void {
    this.#stack.push(this.#state);
  }

  #restore(): void {
    this.#state = this.#stack.pop() ?? this.#state;
  }

  #transform(matrix: Matrix | null): void {
    if (matrix === null) {
      return;
    }

    this.#state = { ...this.#state, ctm: compose(this.#state.ctm, matrix) };
  }

  /** A form saves state, applies its matrix and clips to its bounding box. */
  #beginForm(args: unknown): void {
    this.#save();

    if (!Array.isArray(args)) {
      return;
    }

    this.#transform(toMatrix(args[0]));
    this.#clipTo(toRect(args[1]));
  }

  #markClip(): void {
    this.#clipPending = true;
  }

  /** pdfjs sends the clip operator first, then the path it clips to. */
  #constructPath(args: unknown): void {
    if (!this.#clipPending) {
      return;
    }

    this.#clipPending = false;
    this.#clipTo(Array.isArray(args) ? toRect(args[2]) : null);
  }

  #endPath(): void {
    this.#clipPending = false;
  }

  /** Narrows the clip to a path's bounding box, a fair stand-in for the box clips page writers use. */
  #clipTo(bounds: Rect | null): void {
    if (bounds === null) {
      return;
    }

    const clip = intersect(
      this.#state.clip,
      applyToRect(this.#state.ctm, bounds)
    );
    this.#state = { ...this.#state, clip };
  }

  #beginText(): void {
    this.#textMatrix = IDENTITY;
    this.#beginLine(0, 0);
  }

  #setFont(args: unknown): void {
    if (!Array.isArray(args)) {
      return;
    }

    const [fontName, size] = args;
    this.#state = {
      ...this.#state,
      fontSize: typeof size === "number" ? Math.abs(size) : 0,
      font:
        typeof fontName === "string" ? this.#fontOf(fontName) : DEFAULT_FONT,
    };
  }

  #setNumber(key: "charSpacing" | "wordSpacing" | "rise", args: unknown): void {
    const value = firstArg(args);

    if (typeof value === "number") {
      this.#state = { ...this.#state, [key]: value };
    }
  }

  #setHorizontalScale(args: unknown): void {
    const percent = firstArg(args);

    if (typeof percent === "number") {
      this.#state = { ...this.#state, horizontalScale: percent / 100 };
    }
  }

  /** `TL` stores the leading so that `T*` moves down by it. */
  #setLeading(args: unknown): void {
    const leading = firstArg(args);

    if (typeof leading === "number") {
      this.#state = { ...this.#state, leading: -leading };
    }
  }

  #moveText(args: unknown): void {
    if (!isNumberList(args)) {
      return;
    }

    this.#beginLine(this.#lineX + (args[0] ?? 0), this.#lineY + (args[1] ?? 0));
  }

  #setLeadingMoveText(args: unknown): void {
    if (isNumberList(args)) {
      this.#state = { ...this.#state, leading: args[1] ?? 0 };
    }

    this.#moveText(args);
  }

  #setTextMatrix(args: unknown): void {
    const matrix = toMatrix(args) ?? toMatrix(firstArg(args));

    if (matrix === null) {
      return;
    }

    this.#textMatrix = matrix;
    this.#beginLine(0, 0);
  }

  #nextLine(): void {
    this.#beginLine(this.#lineX, this.#lineY + this.#state.leading);
  }

  #nextLineShowText(args: unknown): void {
    this.#nextLine();
    this.#showText(firstArg(args));
  }

  /** `"`: sets word and character spacing, moves to the next line and shows text. */
  #spacedLineText(args: unknown): void {
    if (!Array.isArray(args)) {
      return;
    }

    const [wordSpacing, charSpacing, glyphs] = args;
    this.#setNumber("wordSpacing", [wordSpacing]);
    this.#setNumber("charSpacing", [charSpacing]);
    this.#nextLine();
    this.#showText(glyphs);
  }

  #beginLine(x: number, y: number): void {
    this.#lineX = x;
    this.#lineY = y;
    this.#x = x;
    this.#y = y;
  }

  /** Advances over the glyphs the way a renderer would and records the run. */
  #showText(glyphs: unknown): void {
    if (!Array.isArray(glyphs)) {
      return;
    }

    const state = this.#state;
    const startX = this.#x;
    let advance = 0;
    let text = "";

    for (const glyph of glyphs) {
      if (typeof glyph === "number") {
        advance -= (glyph * state.fontSize) / 1000;
        continue;
      }

      if (!isGlyph(glyph)) {
        continue;
      }

      const spacing =
        state.charSpacing + (glyph.isSpace === true ? state.wordSpacing : 0);
      advance += glyph.width * state.font.scale * state.fontSize + spacing;
      text += visibleTextOf(glyph.unicode);
    }

    this.#x = startX + advance * state.horizontalScale;
    this.#record({ text, startX, endX: this.#x });
  }

  #record(options: { text: string; startX: number; endX: number }): void {
    if (options.text.trim() === "") {
      return;
    }

    const state = this.#state;
    const toDevice = compose(state.ctm, this.#textMatrix);
    const baseline = this.#y + state.rise;
    const start = applyToPoint(toDevice, options.startX, baseline);
    const end = applyToPoint(toDevice, options.endX, baseline);

    if (!isInside(state.clip, start)) {
      return;
    }

    this.#runs.push({
      text: options.text,
      x: start.x,
      y: start.y,
      width: end.x - start.x,
      fontSize: state.fontSize * Math.hypot(toDevice[2], toDevice[3]),
      isBold: state.font.isBold,
    });
  }
}

function firstArg(args: unknown): unknown {
  return Array.isArray(args) ? args[0] : undefined;
}

function toRect(value: unknown): Rect | null {
  if (!isNumberList(value) || value.length < 4) {
    return null;
  }

  const [minX = 0, minY = 0, maxX = 0, maxY = 0] = Array.from(value);

  return [minX, minY, maxX, maxY];
}

function isGlyph(value: unknown): value is Glyph {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "unicode" in value &&
    typeof value.unicode === "string" &&
    "width" in value &&
    typeof value.width === "number"
  );
}

/**
 * Text as a reader sees it: a soft hyphen is drawn as a hyphen, a no-break
 * space as a space, and other format characters draw nothing.
 */
function visibleTextOf(unicode: string): string {
  if (unicode === SOFT_HYPHEN) {
    return "-";
  }

  if (unicode === NO_BREAK_SPACE) {
    return " ";
  }

  if (FORMAT_CHARACTER.test(unicode)) {
    return "";
  }

  return unicode;
}

function isInside(clip: Rect, point: { x: number; y: number }): boolean {
  return (
    point.x >= clip[0] - CLIP_TOLERANCE &&
    point.x <= clip[2] + CLIP_TOLERANCE &&
    point.y >= clip[1] - CLIP_TOLERANCE &&
    point.y <= clip[3] + CLIP_TOLERANCE
  );
}
