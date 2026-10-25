"use client";

import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ArmyListSheet } from "@/features/army-list/components/ArmyListSheet";
import { QuickReferenceSheet } from "@/features/army-list/components/QuickReferenceSheet";
import { SHEET_MODE_OPTIONS } from "./ArmyListWorkbench.constants";
import { useArmyListWorkbench } from "./ArmyListWorkbench.hooks";
import styles from "./ArmyListWorkbench.module.css";
import { ListSourcePanel } from "./ListSourcePanel.component";

/** Loads a list from its share link and shows it as a printable sheet. */
export function ArmyListWorkbench() {
  const { loaded, mode, setMode, handlePrint, controls } =
    useArmyListWorkbench();

  return (
    <div className={styles.workbench}>
      <div className={styles.controls}>
        <ListSourcePanel controls={controls} />
        {loaded !== null && (
          <div className={styles.toolbar}>
            <p className={styles.loadedFrom}>
              Showing <strong>{loaded.sourceLabel}</strong>
            </p>
            <SegmentedControl
              label="Layout"
              options={SHEET_MODE_OPTIONS}
              value={mode}
              onChange={setMode}
            />
            <Button variant="primary" onClick={handlePrint}>
              Print
            </Button>
          </div>
        )}
        {loaded !== null && !loaded.hasRuleTexts && (
          <p className={styles.notice}>
            EasyArmy's PDF for this list could not be read, so the special rules
            show their names and pages without descriptions.
          </p>
        )}
      </div>
      {loaded !== null && mode === "full" && (
        <ArmyListSheet list={loaded.list} rules={loaded.rules} />
      )}
      {loaded !== null && mode === "quick" && (
        <QuickReferenceSheet list={loaded.list} rules={loaded.rules} />
      )}
    </div>
  );
}
