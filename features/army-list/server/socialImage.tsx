import "server-only";
import { ImageResponse } from "next/og";
import {
  SOCIAL_CARD_SIZE,
  SocialCard,
  type SocialCardProps,
} from "@/features/army-list/components/SocialCard";
import { ListId } from "@/features/army-list/lib/ListId";
import type { ListPreview } from "@/features/army-list/lib/ListPreview";
import type { EasyArmyClient } from "./EasyArmyClient";
import { loadListPreview } from "./loadListPreview";

/** A shared list is locked on EasyArmy, so its preview can be cached for a day. */
const LIST_IMAGE_MAX_AGE_SECONDS = 24 * 60 * 60;

export const SOCIAL_IMAGE_ALT =
  "baprint: a Bolt Action army list, ready to print";

const HOME_CARD: SocialCardProps = {
  kicker: "EasyArmy list to printed sheet",
  heading: "Your Bolt Action army list, ready for the table",
  tiles: [
    { label: "Black and grey print" },
    { label: "Unit cards never split" },
    { label: "A page per platoon" },
  ],
};

/** The home page's preview image. */
export function renderHomeSocialImage(): ImageResponse {
  return draw(HOME_CARD, {});
}

/**
 * A list page's preview image: the army's name, countries and figures. It
 * reads the list through the shared client, so a page and its image cost
 * EasyArmy one fetch. A list that cannot be loaded gets the home image,
 * marked not to be cached so the next try can show the list.
 */
export async function renderListSocialImage(
  rawId: string,
  client?: EasyArmyClient
): Promise<Response> {
  const listId = ListId.fromId(rawId);

  if (listId === null) {
    return new Response(null, { status: 404 });
  }

  const preview = await loadListPreview(listId, client);

  if (preview === null) {
    return draw(HOME_CARD, { "cache-control": "no-store" });
  }

  return draw(listCard(preview), {
    "cache-control": `public, max-age=${LIST_IMAGE_MAX_AGE_SECONDS}`,
  });
}

function listCard(preview: ListPreview): SocialCardProps {
  const kicker = ["Bolt Action army list", preview.countries]
    .filter((part) => part !== "")
    .join(" · ");

  return { kicker, heading: preview.heading, tiles: preview.stats };
}

function draw(
  card: SocialCardProps,
  headers: Record<string, string>
): ImageResponse {
  return new ImageResponse(<SocialCard {...card} />, {
    ...SOCIAL_CARD_SIZE,
    headers,
  });
}
