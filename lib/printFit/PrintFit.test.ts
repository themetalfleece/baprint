import { describe, expect, it } from "vitest";
import { fitScale } from "@/lib/printFit";

describe("fitScale", () => {
  it("leaves a block that fits at full size", () => {
    expect(fitScale(900, 1000, 0.5)).toBe(1);
    expect(fitScale(1000, 1000, 0.5)).toBe(1);
  });

  it("shrinks a tall block to the available height", () => {
    expect(fitScale(1250, 1000, 0.5)).toBe(0.8);
  });

  it("rounds down so the scaled block never overflows", () => {
    expect(fitScale(1100, 1000, 0.5)).toBe(0.9);
  });

  it("stops at the minimum scale", () => {
    expect(fitScale(4000, 1000, 0.5)).toBe(0.5);
  });
});
