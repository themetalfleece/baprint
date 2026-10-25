import { respondWithList } from "@/features/army-list/server/listRoute";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/lists/[listId]">
): Promise<Response> {
  const { listId } = await context.params;

  return respondWithList(listId);
}
