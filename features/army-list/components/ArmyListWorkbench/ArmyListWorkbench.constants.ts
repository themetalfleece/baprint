import type { SegmentedControlOption } from "@/components/ui/SegmentedControl/SegmentedControl.types";
import type { SheetMode } from "./ArmyListWorkbench.types";

export const INVALID_LINK_MESSAGE =
  "Paste a list's share link, such as https://wg.easyarmy.com/BoltAction/ViewL/…, or the id from one.";

export const SHEET_MODE_OPTIONS: readonly SegmentedControlOption<SheetMode>[] =
  [
    { value: "full", label: "Full list" },
    { value: "quick", label: "Quick reference" },
  ];
