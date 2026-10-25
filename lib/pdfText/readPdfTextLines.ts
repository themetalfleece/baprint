import {
  getDocument,
  type PDFPageProxy,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { isNumberList } from "./matrix";
import { PdfReadError } from "./PdfReadError";
import type { FontInfo, Rect, TextLine } from "./pdfText.types";
import { TextRunCollector } from "./TextRunCollector";
import { groupRunsIntoLines } from "./textLines";

/** The PDF header must start within the first kilobyte. */
const HEADER_WINDOW = 1024;
const DEFAULT_FONT_SCALE = 0.001;
const BOLD_FONT_NAME = /bold|black|heavy/i;

// pdf.js runs its worker in this thread when it finds the module here, so a
// server build ships the worker as an ordinary import instead of a loose file.
Object.assign(globalThis, { pdfjsWorker });

/**
 * Reads the visible text of a PDF as lines, page by page and top to bottom.
 * Runs in Node; pdfjs takes ownership of `data`, so pass a buffer the caller
 * no longer needs.
 *
 * @throws PdfReadError when the data is not a readable PDF with text in it.
 */
export async function readPdfTextLines(data: Uint8Array): Promise<TextLine[]> {
  if (!hasPdfHeader(data)) {
    throw new PdfReadError("not_pdf");
  }

  // Font names are only kept with extra properties; they tell bold runs apart.
  const task = getDocument({ data, fontExtraProperties: true });

  try {
    const document = await task.promise.catch((error: unknown) => {
      throw toReadError(error);
    });
    const lines: TextLine[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      lines.push(...(await readPageLines(page)));
      page.cleanup();
    }

    if (lines.length === 0) {
      throw new PdfReadError("no_text");
    }

    return lines;
  } finally {
    await task.destroy();
  }
}

async function readPageLines(page: PDFPageProxy): Promise<TextLine[]> {
  const operatorList = await page.getOperatorList();
  const [minX = 0, minY = 0, maxX = 0, maxY = 0] = page.view;
  const pageBox: Rect = [minX, minY, maxX, maxY];
  const runs = TextRunCollector.collect(operatorList, {
    pageBox,
    fontOf: (fontName) => fontInfoOf(page, fontName),
  });

  return groupRunsIntoLines(runs);
}

/** Fonts are loaded by the time the operator list resolves. */
function fontInfoOf(page: PDFPageProxy, fontName: string): FontInfo {
  const font: unknown = page.commonObjs.has(fontName)
    ? page.commonObjs.get(fontName)
    : null;

  if (typeof font !== "object" || font === null) {
    return { scale: DEFAULT_FONT_SCALE, isBold: false };
  }

  const matrix = "fontMatrix" in font ? font.fontMatrix : null;
  const scale = isNumberList(matrix) ? matrix[0] : undefined;
  const name = "name" in font && typeof font.name === "string" ? font.name : "";
  const flaggedBold = "bold" in font && font.bold === true;

  return {
    scale: scale === undefined || scale === 0 ? DEFAULT_FONT_SCALE : scale,
    isBold: flaggedBold || BOLD_FONT_NAME.test(name),
  };
}

function hasPdfHeader(data: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(
    data.subarray(0, HEADER_WINDOW)
  );

  return head.includes("%PDF-");
}

/** pdfjs rebuilds its exceptions across the worker boundary, so match them by name. */
function toReadError(error: unknown): PdfReadError {
  const name = error instanceof Error ? error.name : "";

  if (name === "PasswordException") {
    return new PdfReadError("encrypted");
  }

  if (name === "InvalidPDFException") {
    return new PdfReadError("not_pdf");
  }

  return new PdfReadError("unreadable");
}
