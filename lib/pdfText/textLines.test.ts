import { describe, expect, it } from "vitest";
import type { TextRun } from "@/lib/pdfText";
import { groupRunsIntoLines } from "@/lib/pdfText/textLines";

function run(text: string, x: number, y: number, width = 10): TextRun {
  return { text, x, y, width, fontSize: 8.7, isBold: false };
}

describe("groupRunsIntoLines", () => {
  it("orders lines top to bottom and runs left to right", () => {
    const lines = groupRunsIntoLines([
      run("b", 50, 700),
      run("c", 10, 600),
      run("a", 10, 700),
    ]);

    expect(lines.map((line) => line.text)).toEqual(["a b", "c"]);
    expect(lines.map((line) => line.y)).toEqual([700, 600]);
  });

  it("merges baselines a fraction of a point apart", () => {
    const lines = groupRunsIntoLines([
      run("Squad", 26, 747.2),
      run("Regular", 472.6, 746.7),
    ]);

    expect(lines.map((line) => line.text)).toEqual(["Squad Regular"]);
  });

  it("keeps a two-row header as two lines", () => {
    expect(
      groupRunsIntoLines([run("Vehicle", 48, 273.5), run("Weapons", 52, 262.7)])
    ).toHaveLength(2);
  });

  it("adds no space between runs that touch, such as a style change mid-word", () => {
    const [line] = groupRunsIntoLines([
      run("self", 10, 100, 12),
      run("-medicate", 22, 100),
    ]);

    expect(line?.text).toBe("self-medicate");
  });

  it("collapses the whitespace runs carry at their ends", () => {
    const [line] = groupRunsIntoLines([
      run("  Weapons ", 48, 100, 40),
      run("Range", 88, 100),
    ]);

    expect(line?.text).toBe("Weapons Range");
  });
});
