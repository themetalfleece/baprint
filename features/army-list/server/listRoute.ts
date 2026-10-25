import "server-only";
import { ListId } from "@/features/army-list/lib/ListId";
import type { RuleText } from "@/features/army-list/lib/RuleGlossary";
import { fetchEasyArmyList, fetchEasyArmyRules } from "./fetchEasyArmyList";
import { UpstreamListError } from "./UpstreamListError";

/**
 * Answers `GET /api/lists/<id>` with `{ list, rules }`: the list's JSON and
 * the rule descriptions from its PDF, or `rules: null` when the PDF could not
 * be read. A failed list answers `{ error: { code, message } }` with a
 * matching status.
 */
export async function respondWithList(
  rawId: string,
  options: { fetch?: typeof fetch } = {}
): Promise<Response> {
  const listId = ListId.fromId(rawId);

  if (listId === null) {
    return errorResponse({
      status: 400,
      code: "invalid_id",
      message: "That is not an EasyArmy list id.",
    });
  }

  // Both downloads run at once; a missing PDF only costs the descriptions.
  const rules = fetchEasyArmyRules(listId, options).then(
    (glossary): readonly RuleText[] | null => glossary.entries,
    () => null
  );

  try {
    const list = await fetchEasyArmyList(listId, options);

    return Response.json(
      { list, rules: await rules },
      { headers: { "cache-control": "no-store" } }
    );
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
