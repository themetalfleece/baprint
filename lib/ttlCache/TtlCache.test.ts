import { describe, expect, it } from "vitest";
import { TtlCache } from "@/lib/ttlCache";

function cacheAt(clock: { now: number }, maxEntries = 10) {
  return new TtlCache<string>({ maxEntries, now: () => clock.now });
}

describe("TtlCache", () => {
  it("returns a value until its time to live runs out", () => {
    const clock = { now: 0 };
    const cache = cacheAt(clock);

    cache.set("a", "one", 1000);
    clock.now = 999;
    expect(cache.get("a")).toBe("one");

    clock.now = 1000;
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("gives each entry its own time to live", () => {
    const clock = { now: 0 };
    const cache = cacheAt(clock);

    cache.set("short", "s", 100);
    cache.set("long", "l", 1000);
    clock.now = 500;

    expect(cache.get("short")).toBeUndefined();
    expect(cache.get("long")).toBe("l");
  });

  it("drops the least recently used entry when full", () => {
    const clock = { now: 0 };
    const cache = cacheAt(clock, 2);

    cache.set("a", "1", 1000);
    cache.set("b", "2", 1000);
    cache.get("a");
    cache.set("c", "3", 1000);

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe("1");
    expect(cache.get("c")).toBe("3");
  });

  it("replaces an entry set twice", () => {
    const clock = { now: 0 };
    const cache = cacheAt(clock, 2);

    cache.set("a", "old", 1000);
    cache.set("a", "new", 1000);

    expect(cache.size).toBe(1);
    expect(cache.get("a")).toBe("new");
  });
});
