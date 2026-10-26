import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { ListId } from "@/features/army-list/lib/ListId";
import {
  EasyArmyClient,
  LIST_WITHOUT_RULES_TTL_MS,
} from "@/features/army-list/server/EasyArmyClient";
import { UpstreamListError } from "@/features/army-list/server/UpstreamListError";
import { Throttle } from "@/lib/throttle";

const LIST_ID = ListId.fromId("0b6c1a52-3f0e-4d7a-9c21-5e8f4a7b9d13");
const OTHER_ID = ListId.fromId("7d2e9f40-1a3b-4c5d-8e6f-0a1b2c3d4e5f");
const sampleJson = readFileSync(
  new URL("../fixtures/easyarmy-sample-list.json", import.meta.url),
  "utf8"
);
const samplePdf = readFileSync(
  new URL("../fixtures/easyarmy-sample-list.pdf", import.meta.url)
);

function requireId(id: ListId | null): ListId {
  if (id === null) {
    throw new Error("test id is not a GUID");
  }

  return id;
}

/** EasyArmy answering every request, with the PDF optionally broken. */
function fakeEasyArmy(options: { pdfOk?: boolean } = {}) {
  return vi.fn<typeof fetch>(async (input) => {
    if (String(input).endsWith("?ps=1")) {
      return new Response(sampleJson);
    }

    return options.pdfOk === false
      ? new Response(null, { status: 500 })
      : new Response(new Uint8Array(samplePdf));
  });
}

/** A client on a fake clock, with a throttle that never delays. */
function clientWith(fetchFn: typeof fetch, throttle?: Throttle) {
  const clock = { now: 0 };
  const client = new EasyArmyClient({
    fetch: fetchFn,
    throttle: throttle ?? new Throttle({ intervalMs: 0, maxWaitMs: 0 }),
    now: () => clock.now,
  });

  return { clock, client };
}

describe("EasyArmyClient", () => {
  it("serves a repeat load from memory with no time limit", async () => {
    const fetchSpy = fakeEasyArmy();
    const { clock, client } = clientWith(fetchSpy);
    const id = requireId(LIST_ID);

    const first = await client.loadList(id);
    clock.now = 365 * 24 * 60 * 60_000;
    const second = await client.loadList(id);

    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("shares one fetch between loads of the same list in flight", async () => {
    const fetchSpy = fakeEasyArmy();
    const { client } = clientWith(fetchSpy);
    const id = requireId(LIST_ID);

    const [a, b] = await Promise.all([
      client.loadList(id),
      client.loadList(id),
    ]);

    expect(a).toBe(b);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("keeps a list without rule descriptions only briefly", async () => {
    const fetchSpy = fakeEasyArmy({ pdfOk: false });
    const { clock, client } = clientWith(fetchSpy);
    const id = requireId(LIST_ID);

    expect((await client.loadList(id)).rules).toBeNull();
    clock.now = LIST_WITHOUT_RULES_TTL_MS;
    await client.loadList(id);

    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it("does not keep a failed load", async () => {
    const fetchSpy = vi.fn<typeof fetch>(
      async () => new Response("oops", { status: 500 })
    );
    const { client } = clientWith(fetchSpy);
    const id = requireId(LIST_ID);

    await expect(client.loadList(id)).rejects.toBeInstanceOf(UpstreamListError);
    await expect(client.loadList(id)).rejects.toBeInstanceOf(UpstreamListError);

    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it("takes a throttle slot only on a cache miss", async () => {
    const throttle = new Throttle({ intervalMs: 2000, maxWaitMs: 0 });
    const acquire = vi.spyOn(throttle, "acquire");
    const { client } = clientWith(fakeEasyArmy(), throttle);
    const id = requireId(LIST_ID);

    await client.loadList(id);
    await client.loadList(id);

    expect(acquire).toHaveBeenCalledTimes(1);
  });

  it("refuses a new list while the throttle queue is full", async () => {
    const throttle = new Throttle({ intervalMs: 2000, maxWaitMs: 0 });
    const fetchSpy = fakeEasyArmy();
    const { client } = clientWith(fetchSpy, throttle);

    await client.loadList(requireId(LIST_ID));

    await expect(client.loadList(requireId(OTHER_ID))).rejects.toMatchObject({
      code: "busy",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
