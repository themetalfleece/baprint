import { describe, expect, it } from "vitest";
import {
  ruleKeyOf,
  ruleLabelOf,
  splitItemNotes,
} from "@/features/army-list/lib/itemNotes";

describe("splitItemNotes", () => {
  it("splits on top-level commas and trims", () => {
    expect(splitItemNotes("Team (3 men), Fixed, Indirect fire ")).toEqual([
      "Team (3 men)",
      "Fixed",
      "Indirect fire",
    ]);
  });

  it("keeps commas inside parentheses", () => {
    expect(splitItemNotes("Team (2 men, 1 loader), Shaped Charge")).toEqual([
      "Team (2 men, 1 loader)",
      "Shaped Charge",
    ]);
  });

  it("returns nothing for blank notes", () => {
    expect(splitItemNotes("")).toEqual([]);
    expect(splitItemNotes("  ")).toEqual([]);
    expect(splitItemNotes(" , ")).toEqual([]);
  });

  it("tolerates an unmatched closing parenthesis", () => {
    expect(splitItemNotes("Fixed), Assault")).toEqual(["Fixed)", "Assault"]);
  });
});

describe("ruleLabelOf", () => {
  it("drops a leading calibre", () => {
    expect(ruleLabelOf('(75mm) HE (2")')).toBe('HE (2")');
  });

  it("drops a trailing special rule suffix", () => {
    expect(ruleLabelOf("Command Vehicle special rule")).toBe("Command Vehicle");
  });

  it("leaves plain labels alone", () => {
    expect(ruleLabelOf("Gyro-stabiliser (Veterans only)")).toBe(
      "Gyro-stabiliser (Veterans only)"
    );
  });
});

describe("ruleKeyOf", () => {
  it("drops a trailing parenthetical and lower-cases", () => {
    expect(ruleKeyOf("Team (2 men)")).toBe("team");
    expect(ruleKeyOf('HE (2")')).toBe("he");
  });

  it("keys labels with no parenthetical by their text", () => {
    expect(ruleKeyOf("Shaped Charge")).toBe("shaped charge");
  });
});
