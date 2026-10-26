import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TextInput } from "@/components/ui/TextInput";
import styles from "./ArmyListWorkbench.module.css";
import type { ListSourcePanelProps } from "./ArmyListWorkbench.types";

/** The one way in: a list's EasyArmy share link. */
export function ListSourcePanel({ controls }: ListSourcePanelProps) {
  const stepsId = useId();

  return (
    <div className={styles.sources}>
      <form className={styles.linkForm} onSubmit={controls.onLinkSubmit}>
        <div className={styles.linkRow}>
          <div className={styles.linkField}>
            <TextInput
              label="EasyArmy list link"
              name="link"
              value={controls.link}
              onChange={controls.onLinkChange}
              placeholder="https://wg.easyarmy.com/BoltAction/ViewL/…"
              autoComplete="off"
              spellCheck={false}
              inputMode="url"
              aria-describedby={stepsId}
            />
          </div>
          <Button type="submit" variant="primary" disabled={controls.isLoading}>
            {controls.isLoading && <Spinner />}
            {controls.isLoading ? "Loading…" : "Load list"}
          </Button>
        </div>
        <ol id={stepsId} className={styles.steps}>
          <li>
            Open your list on{" "}
            <a
              href="https://wg.easyarmy.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              wg.easyarmy.com
            </a>
            .
          </li>
          <li>
            Press <strong>View</strong>, then <strong>Output</strong>, then{" "}
            <strong>Lock to Share</strong>.
          </li>
          <li>
            Open <strong>Output</strong> again, copy the{" "}
            <strong>Share link</strong> and paste it here.
          </li>
        </ol>
      </form>
      {controls.error !== null && (
        <p className={styles.error} role="alert">
          {controls.error}
        </p>
      )}
    </div>
  );
}
