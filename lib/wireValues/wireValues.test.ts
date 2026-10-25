import { describe, expect, it } from "vitest";
import { isRecord, readCount, readFlag, readText } from "@/lib/wireValues";

describe("isRecord", () => {
  it("accepts plain objects", () => {
    expect(isRecord({})).toBe(true);
  });

  it("rejects arrays, null and primitives", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord("text")).toBe(false);
  });
});

describe("readText", () => {
  it("trims strings", () => {
    expect(readText("  Assault ")).toBe("Assault");
  });

  it("stringifies finite numbers", () => {
    expect(readText(44)).toBe("44");
  });

  it("reads missing, null, NaN and objects as empty", () => {
    expect(readText(undefined)).toBe("");
    expect(readText(null)).toBe("");
    expect(readText(Number.NaN)).toBe("");
    expect(readText({})).toBe("");
  });
});

describe("readFlag", () => {
  it("reads booleans as they are", () => {
    expect(readFlag(true)).toBe(true);
    expect(readFlag(false)).toBe(false);
  });

  it("reads string booleans in any case", () => {
    expect(readFlag("true")).toBe(true);
    expect(readFlag(" True ")).toBe(true);
    expect(readFlag("false")).toBe(false);
  });

  it("reads 1 as true and other numbers as false", () => {
    expect(readFlag(1)).toBe(true);
    expect(readFlag("1")).toBe(true);
    expect(readFlag(0)).toBe(false);
    expect(readFlag(2)).toBe(false);
  });

  it("reads missing and unknown values as false", () => {
    expect(readFlag(undefined)).toBe(false);
    expect(readFlag("yes")).toBe(false);
  });
});

describe("readCount", () => {
  it("reads integers and numeric strings", () => {
    expect(readCount(7)).toBe(7);
    expect(readCount("205")).toBe(205);
    expect(readCount(" 0 ")).toBe(0);
  });

  it("returns null for missing, blank, fractional and non-numeric input", () => {
    expect(readCount(undefined)).toBeNull();
    expect(readCount(" ")).toBeNull();
    expect(readCount(1.5)).toBeNull();
    expect(readCount("1.5")).toBeNull();
    expect(readCount("9+")).toBeNull();
  });
});
