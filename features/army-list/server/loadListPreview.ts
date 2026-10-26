import "server-only";
import { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { ListId } from "@/features/army-list/lib/ListId";
import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { ListPreview } from "@/features/army-list/lib/ListPreview";
import type { EasyArmyClient } from "./EasyArmyClient";
import { sharedEasyArmyClient } from "./sharedEasyArmyClient";
import { UpstreamListError } from "./UpstreamListError";

/**
 * The preview of a list, through the shared client so it costs EasyArmy
 * nothing when the list is cached. Returns `null` when the list cannot be
 * loaded, so a link preview falls back to the generic one.
 */
export async function loadListPreview(
  listId: ListId,
  client: EasyArmyClient = sharedEasyArmyClient
): Promise<ListPreview | null> {
  try {
    const { list } = await client.loadList(listId);

    return new ListPreview(ArmyList.fromWire(list));
  } catch (error) {
    if (error instanceof UpstreamListError || error instanceof ListParseError) {
      return null;
    }

    throw error;
  }
}
