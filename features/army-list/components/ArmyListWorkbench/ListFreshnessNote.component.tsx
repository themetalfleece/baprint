import type { ListFreshnessNoteProps } from "./ArmyListWorkbench.types";

const FETCHED_AT_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const REFRESH_AT_FORMAT = new Intl.DateTimeFormat(undefined, {
  timeStyle: "short",
});

/** When the list was fetched from EasyArmy and, during the cooldown, when it can be refreshed. */
export function ListFreshnessNote({
  freshness,
  canRefresh,
}: ListFreshnessNoteProps) {
  // No closing full stop: some locales already end a time with one.
  const fetched = `, fetched from EasyArmy on ${FETCHED_AT_FORMAT.format(freshness.fetchedAt)}`;
  const wait = canRefresh
    ? ""
    : `; you can refresh it from ${REFRESH_AT_FORMAT.format(freshness.refreshableAt)}`;

  return `${fetched}${wait}`;
}
