import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import { readPdfTextLines } from "@/lib/pdfText";

function samplePdf(): Uint8Array {
  return new Uint8Array(
    readFileSync(
      new URL("../../fixtures/easyarmy-sample-list.pdf", import.meta.url)
    )
  );
}

describe("RuleGlossary.fromPdfLines with the sample list", async () => {
  const glossary = RuleGlossary.fromPdfLines(
    await readPdfTextLines(samplePdf())
  );
  const byName = new Map(
    glossary.entries.map((entry) => [entry.name, entry.text])
  );

  it("reads every rule EasyArmy prints, in order", () => {
    expect(glossary.entries.map((entry) => entry.name)).toEqual([
      '(75mm) HE (2")',
      "Assault",
      "Command Vehicle",
      "Easily catches fire",
      "Fixed",
      "Gyro-stabiliser (Veterans only)",
      'HE (2")',
      "Indirect fire",
      "Medics",
      "Shaped Charge",
      "Spotter",
      "Stubborn",
      "Team (2 men)",
      "Team (3 men)",
      "Unarmed",
    ]);
  });

  it("joins a description that wraps over several lines", () => {
    expect(byName.get("Assault")).toBe(
      "(p66) Amet tempor nostrud et ullamco 'ad est' elit labore sit proident. Ex deserunt, pariatur dolore dolor enim ea laboris aliqua magna in minim occaecat (quis 91). Nisi l irure aliquip veniam o proident id velit deserunt commodo pariatur do consequat, ut sed consectetur duis r cillum fugiat aute."
    );
  });

  it("keeps the hyphens and minus signs the PDF stores as soft hyphens", () => {
    expect(byName.get("Shaped Charge")).toBe(
      "(p73) Nulla mollit est -1 consectetur occaecat sit tempor ex amet culpa."
    );
    expect(byName.get("Medics")).toContain("esse-pariatur");
  });

  it("joins runs that change style mid-line with single spaces", () => {
    expect(byName.get('HE (2")')).toBe(
      "(p68) PEN: +2, PIN: D3 (D6 ad ex proident) - Deserunt sed cupidatat non ea down in dolor qui nisi magna"
    );
  });

  it("stops before the pick list", () => {
    expect(byName.has("Pick List")).toBe(false);
    expect(byName.get("Unarmed")).toBe(
      "Ullamco non laboris lorem qui cillum et ipsum pariatur - dolor duis magna ad ex adipiscing"
    );
  });
});

describe("RuleGlossary", () => {
  const glossary = new RuleGlossary([
    { name: '(75mm) HE (2")', text: "Use the 2 inch template." },
    { name: 'HE (2")', text: "PEN +2." },
    { name: "Assault", text: "No penalty." },
  ]);

  it("finds a rule's text with the exact name first, then its variants", () => {
    expect(glossary.textsFor('HE (2")').map((entry) => entry.name)).toEqual([
      'HE (2")',
      '(75mm) HE (2")',
    ]);
    expect(glossary.textsFor("Fixed")).toEqual([]);
  });

  it("round-trips through JSON and skips malformed entries", () => {
    const wire: unknown = JSON.parse(
      JSON.stringify([...glossary.entries, { text: "no name" }, "junk"])
    );

    expect(RuleGlossary.fromWire(wire).entries).toEqual(glossary.entries);
    expect(RuleGlossary.fromWire(null).entries).toEqual([]);
  });

  it("is empty for lines with no special rules section", () => {
    expect(RuleGlossary.fromPdfLines([]).entries).toEqual([]);
  });
});
