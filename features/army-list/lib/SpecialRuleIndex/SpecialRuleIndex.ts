import type { ArmyList } from "@/features/army-list/lib/ArmyList";
import { ruleKeyOf, ruleLabelOf } from "@/features/army-list/lib/itemNotes";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import type { Unit } from "@/features/army-list/lib/Unit";
import { assertNever } from "@/lib/assertNever";
import {
  NON_RULE_NOTE_KEYS,
  RULE_REFERENCES,
} from "./SpecialRuleIndex.constants";
import type { RuleReference, SpecialRuleEntry } from "./SpecialRuleIndex.types";

/** Every special rule a list uses, with where to read it up. */
export class SpecialRuleIndex {
  /** Entries sorted by label. */
  readonly entries: readonly SpecialRuleEntry[];

  constructor(options: { entries: readonly SpecialRuleEntry[] }) {
    this.entries = options.entries;
  }

  /**
   * Collects the rules named in a list's item notes and upgrades, with their
   * descriptions from the glossary when one is given.
   */
  static fromList(
    list: ArmyList,
    glossary: RuleGlossary = new RuleGlossary([])
  ): SpecialRuleIndex {
    const usersByLabel = new Map<string, Set<string>>();

    for (const platoon of list.platoons) {
      for (const unit of platoon.units) {
        for (const label of SpecialRuleIndex.labelsOf(unit)) {
          const users = usersByLabel.get(label) ?? new Set<string>();
          users.add(unit.name);
          usersByLabel.set(label, users);
        }
      }
    }

    const entries = [...usersByLabel].map(([label, users]) => {
      const key = ruleKeyOf(label);

      return {
        label,
        key,
        reference: SpecialRuleIndex.#referenceFor(key),
        usedBy: [...users],
        descriptions: glossary.textsFor(label),
      };
    });

    return new SpecialRuleIndex({
      entries: entries.toSorted((first, second) =>
        first.label.localeCompare(second.label)
      ),
    });
  }

  /** The distinct rule labels one unit carries, in the order they appear. */
  static labelsOf(unit: Unit): readonly string[] {
    const notes = unit.entries.flatMap((entry) => {
      if (entry.kind === "weapon") {
        return entry.notes;
      }

      if (entry.kind === "vehicle") {
        return [
          ...entry.notes,
          ...entry.weapons.flatMap((weapon) => weapon.notes),
        ];
      }

      if (entry.kind === "option") {
        return [entry.name, ...entry.notes];
      }

      return assertNever(entry);
    });

    const labels = notes
      .map(ruleLabelOf)
      .filter(
        (label) => label !== "" && !NON_RULE_NOTE_KEYS.has(ruleKeyOf(label))
      );

    return [...new Set(labels)];
  }

  /** Reads a reference as "Rulebook v3, p. 96", or "Unit entry" when none is known. */
  static formatReference(reference: RuleReference | null): string {
    if (reference === null) {
      return "Unit entry";
    }

    if (reference.page === "") {
      return reference.source;
    }

    return `${reference.source}, p. ${reference.page}`;
  }

  static #referenceFor(key: string): RuleReference | null {
    if (!Object.hasOwn(RULE_REFERENCES, key)) {
      return null;
    }

    return RULE_REFERENCES[key] ?? null;
  }
}
