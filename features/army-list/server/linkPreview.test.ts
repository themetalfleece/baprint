import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { EasyArmyClient } from "@/features/army-list/server/EasyArmyClient";
import {
  homeMetadata,
  listPageMetadata,
} from "@/features/army-list/server/pageMetadata";
import { renderListSocialImage } from "@/features/army-list/server/socialImage";
import { Throttle } from "@/lib/throttle";

const ID = "0b6c1a52-3f0e-4d7a-9c21-5e8f4a7b9d13";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const sampleJson = readFileSync(
  new URL("../fixtures/easyarmy-sample-list.json", import.meta.url),
  "utf8"
);

/** A client whose EasyArmy serves the sample JSON and no PDF, or nothing at all. */
function clientFor(upstream: "list" | "missing") {
  const fetchSpy = vi.fn<typeof fetch>(async (input) => {
    if (upstream === "list" && String(input).endsWith("?ps=1")) {
      return new Response(sampleJson);
    }

    return new Response(null, { status: 404 });
  });
  const client = new EasyArmyClient({
    fetch: fetchSpy,
    throttle: new Throttle({ intervalMs: 0, maxWaitMs: 0 }),
  });

  return { client, fetchSpy };
}

describe("homeMetadata", () => {
  it("names the site and points the preview at the home page", () => {
    expect(homeMetadata.title).toEqual({
      absolute: "baprint: Bolt Action list printer",
    });
    expect(homeMetadata.openGraph).toMatchObject({
      siteName: "baprint",
      url: "/",
    });
  });
});

describe("listPageMetadata", () => {
  it("names the army, its countries and points", async () => {
    const { client } = clientFor("list");

    const metadata = await listPageMetadata(ID, client);

    expect(metadata.title).toBe("1000 GIs and Paras: United States, 998 pts");
    expect(metadata.description).toMatch(
      /^A United States Bolt Action army list: 998 points, 11 order dice,/
    );
    expect(metadata.alternates?.canonical).toBe(`/list/${ID}`);
    expect(metadata.openGraph).toMatchObject({
      siteName: "baprint",
      title: "1000 GIs and Paras: United States, 998 pts",
      url: `/list/${ID}`,
    });
  });

  it("falls back to a generic title when the list cannot be loaded", async () => {
    const { client } = clientFor("missing");

    const metadata = await listPageMetadata(ID, client);

    expect(metadata.title).toBe("Bolt Action army list");
    expect(metadata.alternates?.canonical).toBe(`/list/${ID}`);
  });

  it("adds nothing for an invalid id, which the page answers with a 404", async () => {
    const { client, fetchSpy } = clientFor("list");

    expect(await listPageMetadata("not-a-guid", client)).toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("renderListSocialImage", () => {
  it("draws the list and lets it be cached for a day", async () => {
    const { client, fetchSpy } = clientFor("list");

    await listPageMetadata(ID, client);
    const response = await renderListSocialImage(ID, client);
    const png = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("public, max-age=86400");
    expect([...png.subarray(0, 4)]).toEqual(PNG_SIGNATURE);
    // The page's metadata and its image share one load: the JSON and the PDF.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("draws the generic card, uncached, when the list cannot be loaded", async () => {
    const { client } = clientFor("missing");

    const response = await renderListSocialImage(ID, client);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("answers 404 for an invalid id without calling EasyArmy", async () => {
    const { client, fetchSpy } = clientFor("list");

    const response = await renderListSocialImage("not-a-guid", client);

    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
