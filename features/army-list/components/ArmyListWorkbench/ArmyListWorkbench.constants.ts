import type { SegmentedControlOption } from "@/components/ui/SegmentedControl/SegmentedControl.types";
import type { PaperSize } from "@/features/army-list/components/ArmyListSheet/ArmyListSheet.types";

export const INVALID_LINK_MESSAGE =
  "Paste a list's share link, such as https://wg.easyarmy.com/BoltAction/ViewL/…, or the id from one.";

export const PAPER_SIZE_OPTIONS: readonly SegmentedControlOption<PaperSize>[] =
  [
    { value: "a4", label: "A4" },
    { value: "letter", label: "US Letter" },
  ];
