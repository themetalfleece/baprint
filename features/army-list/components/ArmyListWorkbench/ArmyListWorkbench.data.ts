import { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { ListId } from "@/features/army-list/lib/ListId";
import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import { isRecord, readCount, readText } from "@/lib/wireValues";

/** A list from the list route, with its rule descriptions when EasyArmy's PDF could be read. */
export interface FetchedList {
  list: ArmyList;
  glossary: RuleGlossary | null;
  /** When the server fetched the list from EasyArmy, or `null` for the sample. */
  freshness: ListFreshness | null;
}

/** How old the server's copy of a list is, and when it may be refreshed. */
export interface ListFreshness {
  fetchedAt: Date;
  /** When a refresh is allowed, on this browser's clock (epoch milliseconds). */
  refreshableAt: number;
}

interface FetchOptions {
  signal: AbortSignal;
  /** Ask the server to fetch the list from EasyArmy again. */
  refresh?: boolean;
}

/** Where a list comes from: the sample the page opens on, or a pasted link. */
export interface ListSource {
  /** Shown above the sheet. */
  label: string;
  isSample: boolean;
  /** Whether this asks the server to fetch the list from EasyArmy again. */
  isRefresh: boolean;
  fetchList: (options: { signal: AbortSignal }) => Promise<FetchedList>;
}

/**
 * The list the page opens on, so a first visit shows what a printed sheet
 * looks like. The app serves it from its own copy, not from EasyArmy.
 */
export const SAMPLE_SOURCE: ListSource = {
  label: "a sample list",
  isSample: true,
  isRefresh: false,
  fetchList: (options) => fetchFromListRoute("/api/lists/sample", options),
};

/**
 * A saved list, loaded through the app's own route, which fetches it from
 * EasyArmy on the server (EasyArmy does not let browsers read it directly).
 * With `refresh` the server fetches it again instead of using its copy.
 */
export function linkSource(
  listId: ListId,
  options: { refresh?: boolean } = {}
): ListSource {
  return {
    label: listId.shareUrl,
    isSample: false,
    isRefresh: options.refresh === true,
    fetchList: ({ signal }) =>
      fetchListById(listId, { signal, refresh: options.refresh }),
  };
}

/**
 * Loads a saved list by id through the list route.
 *
 * @throws ListParseError with the route's message when it cannot provide the list.
 */
export function fetchListById(
  listId: ListId,
  options: FetchOptions
): Promise<FetchedList> {
  return fetchFromListRoute(`/api/lists/${listId.value}`, options);
}

async function fetchFromListRoute(
  url: string,
  options: FetchOptions
): Promise<FetchedList> {
  const init: RequestInit =
    options.refresh === true
      ? { signal: options.signal, method: "POST" }
      : { signal: options.signal };
  const response = await fetch(url, init);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ListRouteError(
      routeErrorMessage(body),
      isRecord(body) ? readCount(body.refreshableInMs) : null
    );
  }

  if (!isRecord(body)) {
    throw new ListParseError("EasyArmy could not provide that list.");
  }

  return {
    list: ArmyList.fromWire(body.list),
    glossary: body.rules === null ? null : RuleGlossary.fromWire(body.rules),
    freshness: readFreshness(body),
  };
}

/** A failed answer from the list route, with how long until the list may be refreshed when it said. */
export class ListRouteError extends ListParseError {
  readonly refreshableInMs: number | null;

  constructor(message: string, refreshableInMs: number | null) {
    super(message);
    this.refreshableInMs = refreshableInMs;
  }
}

/** The same freshness with the refresh moved to `waitMs` from now, on this browser's clock. */
export function withRefreshWait(
  freshness: ListFreshness,
  waitMs: number
): ListFreshness {
  return { ...freshness, refreshableAt: Date.now() + waitMs };
}

/** The route's fetch time and cooldown, or `null` when it sent none (the sample). */
function readFreshness(body: Record<string, unknown>): ListFreshness | null {
  const fetchedAt = readCount(body.fetchedAt);
  const refreshableInMs = readCount(body.refreshableInMs);

  if (fetchedAt === null || refreshableInMs === null) {
    return null;
  }

  // The wait is relative, so a browser clock that disagrees with the server's cannot skew it.
  return withRefreshWait(
    { fetchedAt: new Date(fetchedAt), refreshableAt: 0 },
    refreshableInMs
  );
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
