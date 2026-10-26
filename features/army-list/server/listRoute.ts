import "server-only";
import { ListId } from "@/features/army-list/lib/ListId";
import type { EasyArmyClient } from "./EasyArmyClient";
import { sharedEasyArmyClient } from "./sharedEasyArmyClient";
import { UpstreamListError } from "./UpstreamListError";

/**
 * Answers `GET /api/lists/<id>`, and `POST` to refresh it from EasyArmy, with
 * `{ list, rules, fetchedAt, refreshableInMs }`: the list's JSON, the rule
 * descriptions from its PDF (`null` when the PDF could not be read), when it
 * was fetched, and how long until it may be refreshed. A failed list answers
 * `{ error: { code, message }, refreshableInMs }` with a matching status, so
 * the page learns the wait after a failed refresh too; an invalid id has no wait.
 */
export async function respondWithList(
  rawId: string,
  options: { client?: EasyArmyClient; refresh?: boolean } = {}
): Promise<Response> {
  const listId = ListId.fromId(rawId);

  if (listId === null) {
    return errorResponse({
      status: 400,
      code: "invalid_id",
      message: "That is not an EasyArmy list id.",
    });
  }

  const client = options.client ?? sharedEasyArmyClient;

  try {
    const data = await (options.refresh === true
      ? client.refreshList(listId)
      : client.loadList(listId));

    return Response.json(
      { ...data, refreshableInMs: client.refreshWaitMs(listId) },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof UpstreamListError) {
      return errorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        refreshableInMs: client.refreshWaitMs(listId),
      });
    }

    throw error;
  }
}

function errorResponse(options: {
  status: number;
  code: string;
  message: string;
  refreshableInMs?: number;
}): Response {
  const error = { code: options.code, message: options.message };
  const body =
    options.refreshableInMs === undefined
      ? { error }
      : { error, refreshableInMs: options.refreshableInMs };

  return Response.json(body, {
    status: options.status,
    headers: { "cache-control": "no-store" },
  });
}
