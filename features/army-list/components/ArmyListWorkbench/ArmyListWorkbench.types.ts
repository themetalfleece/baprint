import type { ChangeEvent, FormEvent } from "react";
import type { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";

/** `full` prints every unit card; `quick` fits the list on one page. */
export type SheetMode = "full" | "quick";

/** A list that rendered, with what it was loaded from. */
export interface LoadedList {
  list: ArmyList;
  rules: SpecialRuleIndex;
  /** Whether EasyArmy's PDF could be read for the rule descriptions. */
  hasRuleTexts: boolean;
  /** The share link, shown above the sheet. */
  sourceLabel: string;
}

/** Everything the source panel needs to load a list. */
export interface ListSourceControls {
  link: string;
  isLoading: boolean;
  error: string | null;
  onLinkChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLinkSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export interface ListSourcePanelProps {
  controls: ListSourceControls;
}
