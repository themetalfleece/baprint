import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import type { Rect } from "@/lib/pdfText";
import {
  type OperatorList,
  TextRunCollector,
} from "@/lib/pdfText/TextRunCollector";

const PAGE: Rect = [0, 0, 600, 800];

/** Glyphs 500 units wide, the way pdfjs hands them over. */
function glyphs(text: string): object[] {
  return [...text].map((unicode) => ({
    unicode,
    width: 500,
    isSpace: unicode === " ",
  }));
}

function collect(ops: readonly [number, unknown][]) {
  const operatorList: OperatorList = {
    fnArray: ops.map(([fn]) => fn),
    argsArray: ops.map(([, args]) => args),
  };

  return TextRunCollector.collect(operatorList, {
    pageBox: PAGE,
    fontOf: (fontName) => ({ scale: 0.001, isBold: fontName === "Bold" }),
  });
}

describe("TextRunCollector", () => {
  it("places runs through the text matrix and the CTM", () => {
    const runs = collect([
      [OPS.transform, [2, 0, 0, 2, 10, 20]],
      [OPS.beginText, null],
      [OPS.setFont, ["Regular", 10]],
      [OPS.setTextMatrix, [[1, 0, 0, 1, 30, 40]]],
      [OPS.showText, [glyphs("ab")]],
    ]);

    expect(runs).toEqual([
      { text: "ab", x: 70, y: 100, width: 20, fontSize: 20, isBold: false },
    ]);
  });

  it("advances along the line between runs, with kerning and spacing", () => {
    const runs = collect([
      [OPS.beginText, null],
      [OPS.setFont, ["Regular", 10]],
      [OPS.setCharSpacing, [1]],
      [OPS.moveText, [100, 500]],
      [OPS.showText, [[...glyphs("ab"), -1000]]],
      [OPS.showText, [glyphs("c")]],
    ]);

    expect(runs.map((run) => [run.text, run.x])).toEqual([
      ["ab", 100],
      ["c", 122],
    ]);
  });

  it("moves to the next line by the leading", () => {
    const runs = collect([
      [OPS.beginText, null],
      [OPS.setFont, ["Regular", 10]],
      [OPS.moveText, [50, 500]],
      [OPS.setLeading, [12]],
      [OPS.showText, [glyphs("one")]],
      [OPS.nextLineShowText, [glyphs("two")]],
      [OPS.setLeadingMoveText, [0, -20]],
      [OPS.showText, [glyphs("three")]],
      [OPS.nextLine, null],
      [OPS.showText, [glyphs("four")]],
    ]);

    expect(runs.map((run) => [run.text, run.y])).toEqual([
      ["one", 500],
      ["two", 488],
      ["three", 468],
      ["four", 448],
    ]);
  });

  it("drops runs outside the clip and restores the clip on Q", () => {
    const runs = collect([
      [OPS.save, null],
      [OPS.clip, null],
      [OPS.constructPath, [OPS.endPath, [], [0, 400, 600, 800]]],
      [OPS.beginText, null],
      [OPS.setFont, ["Regular", 10]],
      [OPS.moveText, [10, 100]],
      [OPS.showText, [glyphs("hidden")]],
      [OPS.restore, null],
      [OPS.beginText, null],
      [OPS.moveText, [10, 100]],
      [OPS.showText, [glyphs("shown")]],
    ]);

    expect(runs.map((run) => run.text)).toEqual(["shown"]);
  });

  it("clips a form to its bounding box", () => {
    const runs = collect([
      [
        OPS.paintFormXObjectBegin,
        [
          [1, 0, 0, 1, 0, 0],
          [0, 0, 50, 50],
        ],
      ],
      [OPS.beginText, null],
      [OPS.setFont, ["Regular", 10]],
      [OPS.moveText, [100, 10]],
      [OPS.showText, [glyphs("outside")]],
      [OPS.paintFormXObjectEnd, null],
    ]);

    expect(runs).toEqual([]);
  });

  it("reads soft hyphens and no-break spaces as drawn, and drops other format characters", () => {
    const runs = collect([
      [OPS.beginText, null],
      [OPS.setFont, ["Regular", 10]],
      [OPS.showText, [glyphs("co­ax​ial MMG")]],
    ]);

    expect(runs.map((run) => run.text)).toEqual(["co-axial MMG"]);
  });

  it("marks runs in a bold font, and restores the font on Q", () => {
    const runs = collect([
      [OPS.setFont, ["Regular", 10]],
      [OPS.save, null],
      [OPS.setFont, ["Bold", 10]],
      [OPS.beginText, null],
      [OPS.showText, [glyphs("Assault")]],
      [OPS.restore, null],
      [OPS.beginText, null],
      [OPS.showText, [glyphs("text")]],
    ]);

    expect(runs.map((run) => [run.text, run.isBold])).toEqual([
      ["Assault", true],
      ["text", false],
    ]);
  });

  it("skips runs that are only whitespace", () => {
    const runs = collect([
      [OPS.beginText, null],
      [OPS.setFont, ["Regular", 10]],
      [OPS.showText, [glyphs("   ")]],
    ]);

    expect(runs).toEqual([]);
  });
});
