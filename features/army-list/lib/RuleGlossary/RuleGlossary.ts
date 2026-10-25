import { ruleLabelOf } from "@/features/army-list/lib/itemNotes";
import type { TextLine } from "@/lib/pdfText";
import { isRecord, readText } from "@/lib/wireValues";
import type { RuleText } from "./RuleGlossary.types";

const RULES_HEADING = /^SPECIAL RULES$/i;
const PICK_LIST_HEADING = /^PICK LIST$/i;

/** The special-rule descriptions EasyArmy prints with a list. */
export class RuleGlossary {
  readonly entries: readonly RuleText[];

  constructor(entries: readonly RuleText[]) {
    this.entries = entries;
  }

  /**
   * Reads the "SPECIAL RULES" section of an EasyArmy list PDF. Each rule is a
   * bold name line followed by plain lines of text, up to the pick list.
   */
  static fromPdfLines(lines: readonly TextLine[]): RuleGlossary {
    const start = lines.findIndex((line) => RULES_HEADING.test(line.text));

    if (start === -1) {
      return new RuleGlossary([]);
    }

    const entries: { name: string; text: string[] }[] = [];

    for (const line of lines.slice(start + 1)) {
      if (PICK_LIST_HEADING.test(line.text)) {
        break;
      }

      if (line.runs.every((run) => run.isBold)) {
        entries.push({ name: line.text, text: [] });
        continue;
      }

      entries.at(-1)?.text.push(line.text);
    }

    return new RuleGlossary(
      entries.map((entry) => ({ name: entry.name, text: entry.text.join(" ") }))
    );
  }

  /** Reads the glossary back from JSON, skipping anything malformed. */
  static fromWire(data: unknown): RuleGlossary {
    if (!Array.isArray(data)) {
      return new RuleGlossary([]);
    }

    return new RuleGlossary(
      data
        .filter(isRecord)
        .map((entry) => ({
          name: readText(entry.name),
          text: readText(entry.text),
        }))
        .filter((entry) => entry.name !== "")
    );
  }

  /**
   * The descriptions for a rule label from the list. EasyArmy can print
   * variants under one label, such as "HE (2\")" and "(75mm) HE (2\")", so
   * the exact name comes first and the variants follow.
   */
  textsFor(label: string): readonly RuleText[] {
    const matches = this.entries.filter(
      (entry) => ruleLabelOf(entry.name) === label
    );

    return matches.toSorted(
      (first, second) =>
        Number(second.name === label) - Number(first.name === label)
    );
  }
}
