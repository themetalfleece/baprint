import type { RuleReference } from "./SpecialRuleIndex.types";

const RULEBOOK = "Rulebook v3";
const ARMIES_OF_THE_US = "Armies of the United States v3";

/**
 * Page references for rules, keyed by rule key. Names and pages only: the
 * rule text is Warlord Games content and is not reproduced.
 */
export const RULE_REFERENCES: Readonly<Record<string, RuleReference>> = {
  assault: { source: RULEBOOK, page: "96" },
  "command vehicle": { source: RULEBOOK, page: "149" },
  "easily catches fire": { source: ARMIES_OF_THE_US, page: "57" },
  fixed: { source: RULEBOOK, page: "96" },
  "gyro-stabiliser": { source: ARMIES_OF_THE_US, page: "26" },
  he: { source: RULEBOOK, page: "97" },
  "improved he": { source: ARMIES_OF_THE_US, page: "57" },
  "indirect fire": { source: RULEBOOK, page: "101" },
  medics: { source: RULEBOOK, page: "113" },
  "shaped charge": { source: RULEBOOK, page: "103" },
  spotter: { source: RULEBOOK, page: "102" },
  stubborn: { source: RULEBOOK, page: "122" },
  team: { source: RULEBOOK, page: "103" },
  unarmed: { source: `${RULEBOOK} errata`, page: "" },
};

/** Notes that describe a weapon's mounting rather than name a rule. */
export const NON_RULE_NOTE_KEYS: ReadonlySet<string> = new Set([
  "front arc",
  "rear arc",
  "left arc",
  "right arc",
  "side arc",
  "side arcs",
]);
