import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import styles from "./ArmyListWorkbench.module.css";
import type { ListSourcePanelProps } from "./ArmyListWorkbench.types";

/** The one way in: a list's EasyArmy share link. */
export function ListSourcePanel({ controls }: ListSourcePanelProps) {
  return (
    <div className={styles.sources}>
      <form className={styles.linkForm} onSubmit={controls.onLinkSubmit}>
        <TextInput
          label="EasyArmy list link"
          name="link"
          value={controls.link}
          onChange={controls.onLinkChange}
          placeholder="https://wg.easyarmy.com/BoltAction/ViewL/…"
          autoComplete="off"
          spellCheck={false}
          inputMode="url"
        />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={controls.isLoading}>
            Load list
          </Button>
        </div>
      </form>
      <p className={styles.status} role="status" aria-live="polite">
        {controls.isLoading && "Loading list…"}
      </p>
      {controls.error !== null && (
        <p className={styles.error} role="alert">
          {controls.error}
        </p>
      )}
    </div>
  );
}
