import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PAGE_MARGINS_MM, PRINTABLE_AREAS } from "./ArmyListSheet.constants";

const reset = readFileSync(
  new URL("../../../../components/ui/reset.css", import.meta.url),
  "utf8"
);

describe("PAGE_MARGINS_MM", () => {
  it("matches the @page margins in reset.css", () => {
    const { top, side, bottom } = PAGE_MARGINS_MM;

    expect(reset).toContain(`margin: ${top}mm ${side}mm ${bottom}mm;`);
  });
});

describe("PRINTABLE_AREAS", () => {
  it("takes the margins off each paper size", () => {
    expect(PRINTABLE_AREAS.a4).toEqual({ widthMm: 188, heightMm: 271 });
    expect(PRINTABLE_AREAS.letter.widthMm).toBeCloseTo(193.9);
    expect(PRINTABLE_AREAS.letter.heightMm).toBeCloseTo(253.4);
  });
});
