import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { MAX_LIST_BYTES } from "@/features/army-list/server/fetchEasyArmyList";
import { respondWithList } from "@/features/army-list/server/listRoute";

const ID = "4f9e2111-d911-4a42-adb8-c4090971f82d";
const SHARE_URL = `https://wg.easyarmy.com/BoltAction/ViewL/${ID}`;
const sampleJson = readFileSync(
  new URL("../fixtures/easyarmy-sample-list.json", import.meta.url),
  "utf8"
);
const samplePdf = readFileSync(
  new URL("../fixtures/easyarmy-sample-list.pdf", import.meta.url)
);

type Upstream = () => Response | Error;

const jsonOk: Upstream = () =>
  new Response(`﻿${sampleJson}`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
const pdfOk: Upstream = () =>
  new Response(new Uint8Array(samplePdf), {
    headers: { "content-type": "application/pdf" },
  });

/** A stand-in for EasyArmy: `?ps=1` answers with the JSON, the share link with the PDF. */
function fakeEasyArmy(upstream: { json: Upstream; pdf?: Upstream }) {
  return vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    const answer = url.endsWith("?ps=1")
      ? upstream.json
      : (upstream.pdf ?? pdfOk);
    const response = answer();

    if (response instanceof Error) {
      throw response;
    }

    return response;
  });
}

async function bodyOf(response: Response) {
  return { status: response.status, body: await response.json() };
}

describe("respondWithList", () => {
  it("answers with the list and the rule descriptions from its PDF", async () => {
    const fetchSpy = fakeEasyArmy({ json: jsonOk });

    const { status, body } = await bodyOf(
      await respondWithList(ID.toUpperCase(), { fetch: fetchSpy })
    );

    expect(status).toBe(200);
    expect(body.list.TotalPoints).toBe(998);
    expect(body.rules).toHaveLength(15);
    expect(body.rules).toContainEqual({
      name: "Shaped Charge",
      text: "(p73) Never suffer the -1 penetration modifier for firing at long range.",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      `${SHARE_URL}?ps=1`,
      expect.objectContaining({ redirect: "manual" })
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      SHARE_URL,
      expect.objectContaining({ redirect: "manual" })
    );
  });

  it("still answers with the list when the PDF cannot be read", async () => {
    for (const pdf of [
      () => new Response("<html>oops</html>"),
      () => new Response(null, { status: 500 }),
      () => new TypeError("fetch failed"),
    ]) {
      const { status, body } = await bodyOf(
        await respondWithList(ID, {
          fetch: fakeEasyArmy({ json: jsonOk, pdf }),
        })
      );

      expect(status).toBe(200);
      expect(body.list.TotalPoints).toBe(998);
      expect(body.rules).toBeNull();
    }
  });

  it("rejects an id that is not a GUID without calling EasyArmy", async () => {
    const fetchSpy = fakeEasyArmy({ json: jsonOk });

    const response = await respondWithList("../../etc/passwd", {
      fetch: fetchSpy,
    });

    expect(await bodyOf(response)).toEqual({
      status: 400,
      body: {
        error: {
          code: "invalid_id",
          message: "That is not an EasyArmy list id.",
        },
      },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports EasyArmy's redirect for an unknown id as not found", async () => {
    const redirect = () =>
      new Response(null, { status: 302, headers: { location: "/" } });

    const response = await respondWithList(ID, {
      fetch: fakeEasyArmy({ json: redirect, pdf: redirect }),
    });

    expect(await bodyOf(response)).toMatchObject({
      status: 404,
      body: { error: { code: "not_found" } },
    });
  });

  it("reports a server error, non-JSON and non-list JSON as a bad upstream", async () => {
    for (const json of [
      () => new Response("oops", { status: 500 }),
      () => new Response("<html>maintenance</html>"),
      () => new Response('{"hello": "world"}'),
    ]) {
      const response = await respondWithList(ID, {
        fetch: fakeEasyArmy({ json }),
      });

      expect(await bodyOf(response)).toMatchObject({
        status: 502,
        body: { error: { code: "bad_upstream" } },
      });
    }
  });

  it("stops reading a body over the size cap", async () => {
    const response = await respondWithList(ID, {
      fetch: fakeEasyArmy({
        json: () => new Response("x".repeat(MAX_LIST_BYTES + 1)),
      }),
    });

    expect(response.status).toBe(502);
  });

  it("reports a timeout and a network failure", async () => {
    const timedOut = await respondWithList(ID, {
      fetch: fakeEasyArmy({
        json: () => new DOMException("Timed out", "TimeoutError"),
      }),
    });
    const failed = await respondWithList(ID, {
      fetch: fakeEasyArmy({ json: () => new TypeError("fetch failed") }),
    });

    expect(timedOut.status).toBe(504);
    expect(failed.status).toBe(502);
  });
});
