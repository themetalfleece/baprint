import { Badge } from "@/components/ui/Badge";
import { assertNever } from "@/lib/assertNever";
import styles from "./ArmyListSheet.module.css";
import type { UnitCardProps } from "./ArmyListSheet.types";
import { OptionRow } from "./OptionRow.component";
import { VehicleRows } from "./VehicleRows.component";
import { WeaponRow } from "./WeaponRow.component";

/** One unit as a bordered card that never splits across a page. */
export function UnitCard({ unit }: UnitCardProps) {
  const hasStatLines = unit.weapons.length > 0;

  return (
    <div className={styles.unitCard}>
      <div className={styles.unitHeader}>
        <p className={styles.unitTitle}>
          <span className={styles.unitName}>{unit.name}</span>
          <span className={styles.unitReference}>{unit.bookReference}</span>
        </p>
        {unit.experience !== "" && <Badge>{unit.experience}</Badge>}
        <p className={styles.unitPoints}>
          {unit.points}
          <span className={styles.unitPointsSuffix}> pts</span>
        </p>
      </div>
      <table className={styles.weaponTable}>
        {hasStatLines && (
          <thead>
            <tr>
              <th className={styles.quantityHeading} scope="col">
                Qty
              </th>
              <th scope="col">Weapon</th>
              <th className={styles.statHeading} scope="col">
                Range
              </th>
              <th className={styles.statHeading} scope="col">
                Shots
              </th>
              <th className={styles.statHeading} scope="col">
                Pen
              </th>
              <th scope="col">Special</th>
            </tr>
          </thead>
        )}
        <tbody>
          {unit.loadout.map((entry) => {
            if (entry.kind === "weapon") {
              return (
                <WeaponRow key={entry.id} weapon={entry} mounted={false} />
              );
            }

            if (entry.kind === "vehicle") {
              return <VehicleRows key={entry.id} vehicle={entry} />;
            }

            if (entry.kind === "option") {
              return <OptionRow key={entry.id} option={entry} />;
            }

            return assertNever(entry);
          })}
        </tbody>
      </table>
    </div>
  );
}
