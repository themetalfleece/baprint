import clsx from "clsx";
import { ArmySummary } from "@/features/army-list/components/ArmySummary";
import { QuickReferenceSheet } from "@/features/army-list/components/QuickReferenceSheet";
import { usePlatoonPrintFit } from "./ArmyListSheet.hooks";
import styles from "./ArmyListSheet.module.css";
import type { ArmyListSheetProps, PaperSize } from "./ArmyListSheet.types";
import { PickListSection } from "./PickListSection.component";
import { PlatoonBlock } from "./PlatoonBlock.component";
import { SpecialRulesSection } from "./SpecialRulesSection.component";

/** Each class names an `@page` rule in `reset.css`. */
const PAPER_CLASS_NAMES: Record<PaperSize, string | undefined> = {
  a4: styles.a4Paper,
  letter: styles.letterPaper,
};

/**
 * The printable list. Page one is the summary, a quick reference of the whole
 * army (print only) and the pick list; then a page per platoon, then the rules.
 * A platoon too tall for its page prints smaller so it fits.
 */
export function ArmyListSheet({ list, rules, paper }: ArmyListSheetProps) {
  const sheetRef = usePlatoonPrintFit(paper);

  return (
    <article
      ref={sheetRef}
      className={clsx(styles.sheet, PAPER_CLASS_NAMES[paper])}
    >
      <div className={styles.cover}>
        <ArmySummary list={list} />
        <div className={styles.printOnly}>
          <QuickReferenceSheet list={list} />
        </div>
        <PickListSection items={list.pickList} />
      </div>
      {list.platoons.map((platoon) => (
        <PlatoonBlock key={platoon.id} platoon={platoon} />
      ))}
      <SpecialRulesSection rules={rules} />
    </article>
  );
}
