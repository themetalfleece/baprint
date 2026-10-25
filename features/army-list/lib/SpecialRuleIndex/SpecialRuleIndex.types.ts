import type { RuleText } from "@/features/army-list/lib/RuleGlossary";

/** Where a rule is written up: a book and a page. */
export interface RuleReference {
  source: string;
  /** Empty when the source has no page numbers, such as an errata document. */
  page: string;
}

/** One special rule used somewhere in the list. */
export interface SpecialRuleEntry {
  /** The rule as the list writes it, such as "Team (2 men)". */
  label: string;
  /** Shared by every variant of the rule ("team" for both team sizes). */
  key: string;
  /** `null` when the rule is not in the reference table. */
  reference: RuleReference | null;
  /** Names of the units that carry the rule, deduplicated, in list order. */
  usedBy: readonly string[];
  /** The rule's text as EasyArmy prints it, exact name first; empty when none was found. */
  descriptions: readonly RuleText[];
}
