import { assertNever } from "@/lib/assertNever";
import { abbreviateExperience } from "./QuickReferenceSheet.data";
import styles from "./QuickReferenceSheet.module.css";
import type { QuickUnitRowProps } from "./QuickReferenceSheet.types";
import { QuickVehicleLine } from "./QuickVehicleLine.component";
import { QuickWeaponLine } from "./QuickWeaponLine.component";

/** One unit on a single row, with its weapons stacked in the last cell. */
export function QuickUnitRow({ unit }: QuickUnitRowProps) {
  return (
    <tr className={styles.unitRow}>
      <td className={styles.unitName}>{unit.name}</td>
      <td className={styles.centred}>
        {abbreviateExperience(unit.experience)}
      </td>
      <td className={styles.numeric}>{unit.points}</td>
      <td>
        <ul className={styles.loadout}>
          {unit.loadout.map((entry) => {
            if (entry.kind === "weapon") {
              return <QuickWeaponLine key={entry.id} weapon={entry} />;
            }

            if (entry.kind === "vehicle") {
              return <QuickVehicleLine key={entry.id} vehicle={entry} />;
            }

            if (entry.kind === "option") {
              return (
                <li key={entry.id} className={styles.option}>
                  + {entry.name}
                </li>
              );
            }

            return assertNever(entry);
          })}
        </ul>
      </td>
    </tr>
  );
}
