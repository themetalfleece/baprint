import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeLoadError,
  fetchListById,
  ListRouteError,
} from "@/features/army-list/components/ArmyListWorkbench/ArmyListWorkbench.data";
import { ListId } from "@/features/army-list/lib/ListId";
import { ListParseError } from "@/features/army-list/lib/ListParseError";

const ID = "0b6c1a52-3f0e-4d7a-9c21-5e8f4a7b9d13";
const sampleText = readFileSync(
  new URL("../../fixtures/easyarmy-sample-list.json", import.meta.url),
  "utf8"
);

function listId(): ListId {
  const id = ListId.fromId(ID);

  if (id === null) {
    throw new Error("The test id should be valid.");
  }

  return id;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchListById", () => {
  it("loads through the list route with the caller's signal", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        list: JSON.parse(sampleText),
        rules: [{ name: "Assault", text: "No penalty." }],
      })
    );
    const controller = new AbortController();

    const { list, glossary } = await fetchListById(listId(), {
      signal: controller.signal,
    });

    expect(list.points).toBe(998);
    expect(glossary?.entries).toEqual([
      { name: "Assault", text: "No penalty." },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(`/api/lists/${ID}`, {
      signal: controller.signal,
    });
  });

  it("asks the route to refresh with a POST", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ list: JSON.parse(sampleText), rules: null })
      );
    const controller = new AbortController();

    await fetchListById(listId(), {
      signal: controller.signal,
      refresh: true,
    });

    expect(fetchSpy).toHaveBeenCalledWith(`/api/lists/${ID}`, {
      signal: controller.signal,
      method: "POST",
    });
  });

  it("reads when the list was fetched and when it may be refreshed", async () => {
    vi.spyOn(Date, "now").mockReturnValue(50_000);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        list: JSON.parse(sampleText),
        rules: null,
        fetchedAt: 1000,
        refreshableInMs: 2000,
      })
    );

    const { freshness } = await fetchListById(listId(), {
      signal: new AbortController().signal,
    });

    expect(freshness).toEqual({
      fetchedAt: new Date(1000),
      refreshableAt: 52_000,
    });
  });

  it("has no freshness when the route sends none", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ list: JSON.parse(sampleText), rules: null })
    );

    const { freshness } = await fetchListById(listId(), {
      signal: new AbortController().signal,
    });

    expect(freshness).toBeNull();
  });

  it("has no glossary when the route could not read the PDF", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ list: JSON.parse(sampleText), rules: null })
    );

    const { glossary } = await fetchListById(listId(), {
      signal: new AbortController().signal,
    });

    expect(glossary).toBeNull();
  });

  it("surfaces the route's error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { error: { code: "not_found", message: "No such list." } },
        { status: 404 }
      )
    );

    await expect(
      fetchListById(listId(), { signal: new AbortController().signal })
    ).rejects.toThrow(new ListRouteError("No such list.", null));
  });

  it("carries the route's refresh wait on a failed answer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          error: { code: "timeout", message: "Too slow." },
          refreshableInMs: 600_000,
        },
        { status: 504 }
      )
    );

    const failure = fetchListById(listId(), {
      signal: new AbortController().signal,
      refresh: true,
    });

    await expect(failure).rejects.toBeInstanceOf(ListRouteError);
    await expect(failure).rejects.toMatchObject({
      message: "Too slow.",
      refreshableInMs: 600_000,
    });
  });

  it("has no refresh wait when the failed answer sends none", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Bad gateway", { status: 502 })
    );

    await expect(
      fetchListById(listId(), { signal: new AbortController().signal })
    ).rejects.toMatchObject({ refreshableInMs: null });
  });

  it("falls back to a generic message when the error body is unreadable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Bad gateway", { status: 502 })
    );

    await expect(
      fetchListById(listId(), { signal: new AbortController().signal })
    ).rejects.toThrow("EasyArmy could not provide that list.");
  });
});

describe("describeLoadError", () => {
  it("ignores a cancelled load", () => {
    expect(describeLoadError(new DOMException("", "AbortError"))).toBeNull();
  });

  it("shows a parse error's own message", () => {
    expect(describeLoadError(new ListParseError("Bad list."))).toBe(
      "Bad list."
    );
  });

  it("shows a generic message for anything else", () => {
    expect(describeLoadError(new TypeError("Failed to fetch"))).toContain(
      "could not be loaded"
    );
  });
});
