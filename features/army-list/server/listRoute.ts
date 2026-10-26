import "server-only";
import { ListId } from "@/features/army-list/lib/ListId";
import { EasyArmyClient } from "./EasyArmyClient";
import { UpstreamListError } from "./UpstreamListError";

/** One client for the whole server, so its cache and throttle are shared by every request. */
const sharedClient = new EasyArmyClient();

/**
 * Answers `GET /api/lists/<id>` with `{ list, rules }`: the list's JSON and
 * the rule descriptions from its PDF, or `rules: null` when the PDF could not
 * be read. A failed list answers `{ error: { code, message } }` with a
 * matching status.
 */
export async function respondWithList(
  rawId: string,
  options: { client?: EasyArmyClient } = {}
): Promise<Response> {
  const listId = ListId.fromId(rawId);

  if (listId === null) {
    return errorResponse({
      status: 400,
      code: "invalid_id",
      message: "That is not an EasyArmy list id.",
    });
  }

  try {
    const data = await (options.client ?? sharedClient).loadList(listId);

    return Response.json(data, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof UpstreamListError) {
      return errorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    throw error;
  }
}

function errorResponse(options: {
  status: number;
  code: string;
  message: string;
}): Response {
  return Response.json(
    { error: { code: options.code, message: options.message } },
    { status: options.status, headers: { "cache-control": "no-store" } }
  );
}
