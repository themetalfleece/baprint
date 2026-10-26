import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ListId } from "@/features/army-list/lib/ListId";
import { siteOrigin } from "@/lib/siteOrigin";
import type { EasyArmyClient } from "./EasyArmyClient";
import { loadListPreview } from "./loadListPreview";

const SITE_NAME = "baprint";
const HOME_TITLE = "baprint: Bolt Action list printer";
const HOME_DESCRIPTION =
  "Turn an EasyArmy Bolt Action list into a clean, black and grey sheet for the table.";
const LIST_FALLBACK_TITLE = "Bolt Action army list";

/**
 * Metadata every page inherits. Preview images need absolute URLs, so the
 * base URL is read per request (see `siteOrigin`).
 */
export async function siteMetadata(): Promise<Metadata> {
  return {
    metadataBase: siteOrigin(await headers()),
    title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
    description: HOME_DESCRIPTION,
    applicationName: SITE_NAME,
    twitter: { card: "summary_large_image" },
  };
}

/** The home page's title, description and link preview. */
export const homeMetadata: Metadata = {
  ...pageMetadata({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
  }),
  // The home title already names the site, so it skips the template.
  title: { absolute: HOME_TITLE },
};

/**
 * A list page's title and description, naming the army, its countries and
 * points. A list that cannot be loaded gets a generic title, and an invalid
 * id gets nothing, because the page answers 404.
 */
export async function listPageMetadata(
  rawId: string,
  client?: EasyArmyClient
): Promise<Metadata> {
  const listId = ListId.fromId(rawId);

  if (listId === null) {
    return {};
  }

  const preview = await loadListPreview(listId, client);

  return pageMetadata({
    title: preview?.title ?? LIST_FALLBACK_TITLE,
    description: preview?.description ?? HOME_DESCRIPTION,
    path: listId.pagePath,
  });
}

/** A page's own metadata. Open Graph is restated in full because Next replaces it per page. */
function pageMetadata(page: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
      url: page.path,
    },
  };
}
