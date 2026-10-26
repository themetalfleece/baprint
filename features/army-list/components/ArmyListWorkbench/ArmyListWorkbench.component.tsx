"use client";

import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Spinner } from "@/components/ui/Spinner";
import { ArmyListSheet } from "@/features/army-list/components/ArmyListSheet";
import { PAPER_SIZE_OPTIONS } from "./ArmyListWorkbench.constants";
import { useArmyListWorkbench } from "./ArmyListWorkbench.hooks";
import styles from "./ArmyListWorkbench.module.css";
import { ListSourcePanel } from "./ListSourcePanel.component";
import { LoadingSheet } from "./LoadingSheet.component";

/** Loads a list from its share link and shows it as a printable sheet. */
export function ArmyListWorkbench() {
  const { loaded, paper, setPaper, handlePrint, controls } =
    useArmyListWorkbench();
  // A load in flight hides the current list, so the sample never shows while yours loads.
  const shown = controls.isLoading ? null : loaded;

  return (
    <div className={styles.workbench}>
      <div className={styles.controls}>
        <ListSourcePanel controls={controls} />
        <p className={styles.status} role="status" aria-live="polite">
          {controls.isLoading && (
            <>
              <Spinner />
              Loading list…
            </>
          )}
        </p>
        {shown !== null && (
          <div className={styles.sheetBar}>
            {shown.isSample && (
              <div className={styles.sampleBanner}>
                <span className={styles.sampleTag}>Sample</span>
                <h2 className={styles.sampleTitle}>Showing a sample list</h2>
                <p className={styles.sampleText}>
                  Load your own list above to replace it.
                </p>
              </div>
            )}
            <div className={styles.toolbar}>
              {!shown.isSample && (
                <p className={styles.loadedFrom}>
                  Showing <strong>{shown.sourceLabel}</strong>
                </p>
              )}
              <SegmentedControl
                label="Paper"
                options={PAPER_SIZE_OPTIONS}
                value={paper}
                onChange={setPaper}
              />
              <Button variant="primary" onClick={handlePrint}>
                Print
              </Button>
            </div>
            {!shown.hasRuleTexts && (
              <p className={styles.notice}>
                EasyArmy's PDF for this list could not be read, so the special
                rules show their names and pages without descriptions.
              </p>
            )}
          </div>
        )}
      </div>
      {controls.isLoading && (
        <div className={styles.paper}>
          <LoadingSheet />
        </div>
      )}
      {shown !== null && (
        <div className={styles.paper}>
          <ArmyListSheet list={shown.list} rules={shown.rules} paper={paper} />
        </div>
      )}
    </div>
  );
}
