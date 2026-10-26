import { useEffect, useRef } from "react";
import { PrintFit } from "@/lib/printFit";
import {
  MIN_PLATOON_SCALE,
  PLATOON_FIT_SELECTOR,
  PRINTABLE_AREAS,
} from "./ArmyListSheet.constants";
import type { PaperSize } from "./ArmyListSheet.types";

/**
 * Shrinks each platoon that is too tall for one page of `paper` just before
 * printing, and puts it back afterwards. Returns the ref for the sheet.
 */
export function usePlatoonPrintFit(paper: PaperSize) {
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sheet = sheetRef.current;

    if (sheet === null) {
      return;
    }

    const fit = new PrintFit({
      area: PRINTABLE_AREAS[paper],
      minScale: MIN_PLATOON_SCALE,
    });
    const platoons = () => [
      ...sheet.querySelectorAll<HTMLElement>(PLATOON_FIT_SELECTOR),
    ];
    const handleBeforePrint = () => fit.apply(sheet, platoons());
    const handleAfterPrint = () => fit.clear(platoons());

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [paper]);

  return sheetRef;
}
