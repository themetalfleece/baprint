import type { ChangeEvent, FormEvent } from "react";
import type { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
/** A list that rendered, with what it was loaded from. */
export interface LoadedList {
  list: ArmyList;
  rules: SpecialRuleIndex;
  /** Whether EasyArmy's PDF could be read for the rule descriptions. */
  hasRuleTexts: boolean;
  /** The share link, or the sample's name, shown above the sheet. */
  sourceLabel: string;
  /** Whether this is the sample list the page opens on. */
  isSample: boolean;
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
