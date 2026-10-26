import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  EasyArmyClient,
  REFRESH_COOLDOWN_MS,
} from "@/features/army-list/server/EasyArmyClient";
import { MAX_LIST_BYTES } from "@/features/army-list/server/fetchEasyArmyList";
import { respondWithList } from "@/features/army-list/server/listRoute";
import { Throttle } from "@/lib/throttle";

const ID = "0b6c1a52-3f0e-4d7a-9c21-5e8f4a7b9d13";
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

/** A fresh client with an empty cache and no throttle delay, so each test stands alone. */
function clientFor(fetchFn: typeof fetch, now?: () => number) {
  return new EasyArmyClient({
    fetch: fetchFn,
    throttle: new Throttle({ intervalMs: 0, maxWaitMs: 0 }),
    now,
  });
}

function respond(id: string, fetchFn: typeof fetch) {
  return respondWithList(id, { client: clientFor(fetchFn) });
}

async function bodyOf(response: Response) {
  return { status: response.status, body: await response.json() };
}

describe("respondWithList", () => {
  it("answers with the list and the rule descriptions from its PDF", async () => {
    const fetchSpy = fakeEasyArmy({ json: jsonOk });

    const { status, body } = await bodyOf(
      await respond(ID.toUpperCase(), fetchSpy)
    );

    expect(status).toBe(200);
    expect(body.list.TotalPoints).toBe(998);
    expect(body.rules).toHaveLength(15);
    expect(body.rules).toContainEqual({
      name: "Shaped Charge",
      text: "(p73) Nulla mollit est -1 consectetur occaecat sit tempor ex amet culpa.",
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

  it("says when the list was fetched and how long until it may be refreshed", async () => {
    const clock = { now: 1000 };
    const client = clientFor(fakeEasyArmy({ json: jsonOk }), () => clock.now);

    await respondWithList(ID, { client });
    clock.now = 61_000;
    const { body } = await bodyOf(await respondWithList(ID, { client }));

    expect(body.fetchedAt).toBe(1000);
    expect(body.refreshableInMs).toBe(REFRESH_COOLDOWN_MS - 60_000);
  });

  it("refreshes the list on request once the cooldown has passed", async () => {
    const clock = { now: 0 };
    const fetchSpy = fakeEasyArmy({ json: jsonOk });
    const client = clientFor(fetchSpy, () => clock.now);

    await respondWithList(ID, { client });
    const early = await respondWithList(ID, { client, refresh: true });

    expect(await bodyOf(early)).toMatchObject({
      status: 429,
      body: {
        error: { code: "refresh_too_soon" },
        refreshableInMs: REFRESH_COOLDOWN_MS,
      },
    });

    clock.now = REFRESH_COOLDOWN_MS;
    const { status, body } = await bodyOf(
      await respondWithList(ID, { client, refresh: true })
    );

    expect(status).toBe(200);
    expect(body.fetchedAt).toBe(REFRESH_COOLDOWN_MS);
    expect(body.refreshableInMs).toBe(REFRESH_COOLDOWN_MS);
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it("still answers with the list when the PDF cannot be read", async () => {
    for (const pdf of [
      () => new Response("<html>oops</html>"),
      () => new Response(null, { status: 500 }),
      () => new TypeError("fetch failed"),
    ]) {
      const { status, body } = await bodyOf(
        await respond(ID, fakeEasyArmy({ json: jsonOk, pdf }))
      );

      expect(status).toBe(200);
      expect(body.list.TotalPoints).toBe(998);
      expect(body.rules).toBeNull();
    }
  });

  it("rejects an id that is not a GUID without calling EasyArmy", async () => {
    const fetchSpy = fakeEasyArmy({ json: jsonOk });

    const response = await respond("../../etc/passwd", fetchSpy);

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

    const response = await respond(
      ID,
      fakeEasyArmy({ json: redirect, pdf: redirect })
    );

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
      const response = await respond(ID, fakeEasyArmy({ json }));

      expect(await bodyOf(response)).toMatchObject({
        status: 502,
        body: { error: { code: "bad_upstream" } },
      });
    }
  });

  it("stops reading a body over the size cap", async () => {
    const response = await respond(
      ID,
      fakeEasyArmy({
        json: () => new Response("x".repeat(MAX_LIST_BYTES + 1)),
      })
    );

    expect(response.status).toBe(502);
  });

  it("reports a timeout and a network failure", async () => {
    const timedOut = await respond(
      ID,
      fakeEasyArmy({
        json: () => new DOMException("Timed out", "TimeoutError"),
      })
    );
    const failed = await respond(
      ID,
      fakeEasyArmy({ json: () => new TypeError("fetch failed") })
    );

    expect(timedOut.status).toBe(504);
    expect(failed.status).toBe(502);
  });

  it("sends the refresh wait with a failed fetch, since the fetch started the cooldown", async () => {
    const response = await respondWithList(ID, {
      client: clientFor(
        fakeEasyArmy({ json: () => new Response("oops", { status: 500 }) }),
        () => 0
      ),
      refresh: true,
    });

    expect(await bodyOf(response)).toMatchObject({
      status: 502,
      body: { refreshableInMs: REFRESH_COOLDOWN_MS },
    });
  });

  it("answers 429 when the throttle queue is full", async () => {
    const fetchSpy = fakeEasyArmy({ json: jsonOk });
    const throttle = new Throttle({ intervalMs: 2000, maxWaitMs: 0 });
    await throttle.acquire();

    const response = await respondWithList(ID, {
      client: new EasyArmyClient({ fetch: fetchSpy, throttle }),
    });

    expect(await bodyOf(response)).toMatchObject({
      status: 429,
      body: { error: { code: "busy" }, refreshableInMs: 0 },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
