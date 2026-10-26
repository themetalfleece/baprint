import type { PageArea } from "@/lib/printFit";
import type { PaperSize } from "./ArmyListSheet.types";

/** The `@page` margins in `reset.css`, in millimetres. */
export const PAGE_MARGINS_MM = { top: 12, side: 11, bottom: 14 };

const PAPER_SIZES_MM: Record<PaperSize, PageArea> = {
  a4: { widthMm: 210, heightMm: 297 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
};

function printableArea(paper: PageArea): PageArea {
  return {
    widthMm: paper.widthMm - 2 * PAGE_MARGINS_MM.side,
    heightMm: paper.heightMm - PAGE_MARGINS_MM.top - PAGE_MARGINS_MM.bottom,
  };
}

/** The space a platoon has on each paper size. */
export const PRINTABLE_AREAS: Record<PaperSize, PageArea> = {
  a4: printableArea(PAPER_SIZES_MM.a4),
  letter: printableArea(PAPER_SIZES_MM.letter),
};

/** Below this a platoon would be too small to read, so it runs onto a second page. */
export const MIN_PLATOON_SCALE = 0.65;

/** Finds the platoons, which `PlatoonBlock` marks with `data-fit-page`. */
export const PLATOON_FIT_SELECTOR = "[data-fit-page]";
