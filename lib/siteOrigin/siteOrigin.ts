/** A host name with an optional port; anything else in a Host header is ignored. */
const HOST = /^[a-z0-9.-]+(?::\d{1,5})?$/i;
const PROTOCOLS = new Set(["http", "https"]);

/**
 * The site's public origin, for absolute links such as a preview image's URL.
 * A configured URL (the `SITE_URL` variable) wins. Otherwise it is read from
 * the request, preferring the `X-Forwarded-*` headers a reverse proxy sets.
 * Returns `undefined` when neither gives a usable origin.
 */
export function siteOrigin(
  headers: Headers,
  configured: string | undefined = process.env.SITE_URL
): URL | undefined {
  const fromConfig = parseOrigin(configured);

  if (fromConfig !== undefined) {
    return fromConfig;
  }

  const host = firstValue(headers.get("x-forwarded-host"));
  const requestHost = host === "" ? firstValue(headers.get("host")) : host;
  const protocol = firstValue(headers.get("x-forwarded-proto")).toLowerCase();

  if (!HOST.test(requestHost)) {
    return undefined;
  }

  const scheme = PROTOCOLS.has(protocol) ? protocol : "http";

  return new URL(`${scheme}://${requestHost}`);
}

function parseOrigin(url: string | undefined): URL | undefined {
  if (url === undefined || !URL.canParse(url)) {
    return undefined;
  }

  const parsed = new URL(url);

  return parsed.protocol === "https:" || parsed.protocol === "http:"
    ? new URL(parsed.origin)
    : undefined;
}

/** A proxy chain lists one value per hop; the first is the client's. */
function firstValue(header: string | null): string {
  const [first = ""] = (header ?? "").split(",");

  return first.trim();
}
