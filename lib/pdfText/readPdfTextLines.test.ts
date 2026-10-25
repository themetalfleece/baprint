import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PdfReadError, readPdfTextLines } from "@/lib/pdfText";

/** A real Select.Pdf export, which clips each page to a slice of one long canvas. */
function samplePdf(): Uint8Array {
  return new Uint8Array(
    readFileSync(
      new URL(
        "../../features/army-list/fixtures/easyarmy-sample-list.pdf",
        import.meta.url
      )
    )
  );
}

async function readFailure(data: Uint8Array): Promise<unknown> {
  return readPdfTextLines(data).then(
    () => null,
    (error: unknown) => error
  );
}

describe("readPdfTextLines", () => {
  it("reads each line once, even where pages overlap", async () => {
    const texts = (await readPdfTextLines(samplePdf())).map(
      (line) => line.text
    );
    const once = (text: string) => texts.filter((each) => each === text).length;

    expect(once("*v3 Armies of the U.S. - Heavy Weapon Platoon(LW)")).toBe(1);
    expect(once("United States Infantry with Rifle 22")).toBe(1);
  });

  it("marks bold runs from the font name", async () => {
    const lines = await readPdfTextLines(samplePdf());
    const name = lines.find((line) => line.text === "Shaped Charge");
    const text = lines.find((line) => line.text.startsWith("(p73) Never"));

    expect(name?.runs.every((run) => run.isBold)).toBe(true);
    expect(text?.runs.some((run) => run.isBold)).toBe(false);
  });

  it("rejects data that is not a PDF", async () => {
    const error = await readFailure(new TextEncoder().encode("<html></html>"));

    expect(error).toBeInstanceOf(PdfReadError);
    expect(error).toMatchObject({ reason: "not_pdf" });
  });

  it("rejects a damaged PDF", async () => {
    const error = await readFailure(
      new TextEncoder().encode("%PDF-1.4\nnot really a pdf")
    );

    expect(error).toBeInstanceOf(PdfReadError);
  });
});
