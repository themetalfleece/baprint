import { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { ListId } from "@/features/army-list/lib/ListId";
import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import { isRecord, readText } from "@/lib/wireValues";

/** A list from the list route, with its rule descriptions when EasyArmy's PDF could be read. */
export interface FetchedList {
  list: ArmyList;
  glossary: RuleGlossary | null;
}

/** Where a list comes from: the sample the page opens on, or a pasted link. */
export interface ListSource {
  /** Shown above the sheet. */
  label: string;
  isSample: boolean;
  fetchList: (options: { signal: AbortSignal }) => Promise<FetchedList>;
}

/**
 * The list the page opens on, so a first visit shows what a printed sheet
 * looks like. The app serves it from its own copy, not from EasyArmy.
 */
export const SAMPLE_SOURCE: ListSource = {
  label: "a sample list",
  isSample: true,
  fetchList: (options) => fetchFromListRoute("/api/lists/sample", options),
};

/**
 * A saved list, loaded through the app's own route, which fetches it from
 * EasyArmy on the server (EasyArmy does not let browsers read it directly).
 */
export function linkSource(listId: ListId): ListSource {
  return {
    label: listId.shareUrl,
    isSample: false,
    fetchList: (options) => fetchListById(listId, options),
  };
}

/**
 * Loads a saved list by id through the list route.
 *
 * @throws ListParseError with the route's message when it cannot provide the list.
 */
export function fetchListById(
  listId: ListId,
  options: { signal: AbortSignal }
): Promise<FetchedList> {
  return fetchFromListRoute(`/api/lists/${listId.value}`, options);
}

async function fetchFromListRoute(
  url: string,
  options: { signal: AbortSignal }
): Promise<FetchedList> {
  const response = await fetch(url, { signal: options.signal });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ListParseError(routeErrorMessage(body));
  }

  if (!isRecord(body)) {
    throw new ListParseError("EasyArmy could not provide that list.");
  }

  return {
    list: ArmyList.fromWire(body.list),
    glossary: body.rules === null ? null : RuleGlossary.fromWire(body.rules),
  };
}

/**
 * The message to show for a failed load, or `null` when the load was
 * cancelled by a newer one and should be ignored.
 */
export function describeLoadError(error: unknown): string | null {
  if (error instanceof DOMException && error.name === "AbortError") {
    return null;
  }

  if (error instanceof ListParseError) {
    return error.message;
  }

  return "The list could not be loaded. Check your connection and try again.";
}

function routeErrorMessage(body: unknown): string {
  const fallback = "EasyArmy could not provide that list.";

  if (!isRecord(body) || !isRecord(body.error)) {
    return fallback;
  }

  const message = readText(body.error.message);

  return message === "" ? fallback : message;
}
