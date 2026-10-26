import { notFound, redirect } from "next/navigation";
import { ArmyListWorkbench } from "@/features/army-list/components/ArmyListWorkbench";
import { LegalNotice } from "@/features/army-list/components/LegalNotice";
import { ListId } from "@/features/army-list/lib/ListId";
import styles from "./ArmyListPage.module.css";
import type { ArmyListPageProps } from "./ArmyListPage.types";

/**
 * The app's one page. Without a list id it opens on the sample; with one, as
 * at `/list/<id>`, it loads that list. An id that is not a GUID is a 404, and
 * one in another letter case redirects to the lower case link.
 */
export function ArmyListPage({ listId }: ArmyListPageProps) {
  const parsedId = listId === undefined ? null : parseListId(listId);

  return (
    <>
      <header className={styles.hero}>
        <p className={styles.kicker}>Bolt Action list printer</p>
        <h1 className={styles.title}>baprint</h1>
        <p className={styles.lede}>
          Load an EasyArmy Bolt Action list and print it as a clean, black and
          grey sheet for the table.
        </p>
        <ul className={styles.features}>
          <li>Black and grey print</li>
          <li>Unit cards never split</li>
          <li>A page per platoon</li>
        </ul>
      </header>
      <ArmyListWorkbench listId={parsedId?.value ?? null} />
      <LegalNotice />
    </>
  );
}

function parseListId(raw: string): ListId {
  const listId = ListId.fromId(raw);

  if (listId === null) {
    notFound();
  }

  if (listId.value !== raw) {
    redirect(listId.pagePath);
  }

  return listId;
}
