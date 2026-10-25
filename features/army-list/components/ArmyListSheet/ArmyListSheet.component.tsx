import { ArmySummary } from "@/features/army-list/components/ArmySummary";
import styles from "./ArmyListSheet.module.css";
import type { ArmyListSheetProps } from "./ArmyListSheet.types";
import { PickListSection } from "./PickListSection.component";
import { PlatoonBlock } from "./PlatoonBlock.component";
import { SpecialRulesSection } from "./SpecialRulesSection.component";

/** The full printable list: every platoon and unit card, then rules and pick list. */
export function ArmyListSheet({ list, rules }: ArmyListSheetProps) {
  return (
    <article className={styles.sheet}>
      <ArmySummary list={list} />
      {list.platoons.map((platoon) => (
        <PlatoonBlock key={platoon.id} platoon={platoon} />
      ))}
      <SpecialRulesSection rules={rules} />
      <PickListSection items={list.pickList} />
    </article>
  );
}
