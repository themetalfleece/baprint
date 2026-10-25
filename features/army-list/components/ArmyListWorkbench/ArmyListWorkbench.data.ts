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

/**
 * Loads a saved list through the app's own route, which fetches it from
 * EasyArmy on the server (EasyArmy does not let browsers read it directly).
 *
 * @throws ListParseError with the route's message when it cannot provide the list.
 */
export async function fetchListById(
  listId: ListId,
  options: { signal: AbortSignal }
): Promise<FetchedList> {
  const response = await fetch(`/api/lists/${listId.value}`, {
    signal: options.signal,
  });
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
