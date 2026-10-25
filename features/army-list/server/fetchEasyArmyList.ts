import "server-only";
import { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { ListId } from "@/features/army-list/lib/ListId";
import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import { readPdfTextLines } from "@/lib/pdfText";
import { UpstreamListError } from "./UpstreamListError";

/** A big list is about 20 KB as JSON; anything near this cap is not a list. */
export const MAX_LIST_BYTES = 1_000_000;
/** EasyArmy's PDF of a list is a few hundred KB. */
export const MAX_PDF_BYTES = 5_000_000;
export const UPSTREAM_TIMEOUT_MS = 10_000;

interface FetchOptions {
  fetch?: typeof fetch;
}

/**
 * Fetches a saved list from EasyArmy as decoded JSON.
 *
 * @throws UpstreamListError when EasyArmy has no such list or sends something else.
 */
export async function fetchEasyArmyList(
  listId: ListId,
  options: FetchOptions = {}
): Promise<unknown> {
  const body = await fetchCapped(listId.dataUrl, {
    ...options,
    maxBytes: MAX_LIST_BYTES,
  });
  const data = parseJson(new TextDecoder().decode(body));
  assertIsList(data);

  return data;
}

/**
 * Reads the special-rule descriptions from the PDF EasyArmy serves at the
 * list's share link. The JSON export does not carry them.
 *
 * @throws UpstreamListError when the PDF cannot be fetched or read.
 */
export async function fetchEasyArmyRules(
  listId: ListId,
  options: FetchOptions = {}
): Promise<RuleGlossary> {
  const body = await fetchCapped(listId.shareUrl, {
    ...options,
    maxBytes: MAX_PDF_BYTES,
  });

  try {
    return RuleGlossary.fromPdfLines(await readPdfTextLines(body));
  } catch {
    throw new UpstreamListError("bad_upstream");
  }
}

/**
 * GETs an EasyArmy URL built from a list id. Redirects are not followed
 * (EasyArmy redirects an unknown id to its index page), and the time and
 * size are capped.
 */
async function fetchCapped(
  url: string,
  options: FetchOptions & { maxBytes: number }
): Promise<Uint8Array> {
  const fetchFn = options.fetch ?? fetch;
  let response: Response;

  try {
    response = await fetchFn(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new UpstreamListError(isTimeout(error) ? "timeout" : "bad_upstream");
  }

  if (response.status === 404 || isRedirect(response.status)) {
    await response.body?.cancel();
    throw new UpstreamListError("not_found");
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new UpstreamListError("bad_upstream");
  }

  return readCapped(response, options.maxBytes);
}

/** Reads the body, stopping as soon as it passes the size cap. */
async function readCapped(
  response: Response,
  maxBytes: number
): Promise<Uint8Array> {
  if (response.body === null) {
    throw new UpstreamListError("bad_upstream");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        return concat(chunks, size);
      }

      size += value.byteLength;

      if (size > maxBytes) {
        throw new UpstreamListError("bad_upstream");
      }

      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error instanceof UpstreamListError
      ? error
      : new UpstreamListError(isTimeout(error) ? "timeout" : "bad_upstream");
  }
}

function concat(chunks: readonly Uint8Array[], size: number): Uint8Array {
  const joined = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return joined;
}

/** EasyArmy sends the JSON as `text/html`, sometimes with a byte order mark. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    throw new UpstreamListError("bad_upstream");
  }
}

function assertIsList(data: unknown): void {
  try {
    ArmyList.fromWire(data);
  } catch (error) {
    if (error instanceof ListParseError) {
      throw new UpstreamListError("bad_upstream");
    }

    throw error;
  }
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}
