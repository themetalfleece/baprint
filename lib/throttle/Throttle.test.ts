import { describe, expect, it } from "vitest";
import { Throttle } from "@/lib/throttle";

/** A throttle on a fake clock that records each wait instead of sleeping. */
function fakeThrottle(maxWaitMs = 10_000) {
  const clock = { now: 0 };
  const waits: number[] = [];
  const throttle = new Throttle({
    intervalMs: 2000,
    maxWaitMs,
    now: () => clock.now,
    wait: async (ms) => {
      waits.push(ms);
    },
  });

  return { clock, waits, throttle };
}

describe("Throttle", () => {
  it("lets the first caller through at once", async () => {
    const { waits, throttle } = fakeThrottle();

    expect(await throttle.acquire()).toBe(true);
    expect(waits).toEqual([]);
  });

  it("spaces callers one interval apart, in order", async () => {
    const { waits, throttle } = fakeThrottle();

    const results = await Promise.all([
      throttle.acquire(),
      throttle.acquire(),
      throttle.acquire(),
    ]);

    expect(results).toEqual([true, true, true]);
    expect(waits).toEqual([2000, 4000]);
  });

  it("does not make a caller wait once the interval has passed", async () => {
    const { clock, waits, throttle } = fakeThrottle();

    await throttle.acquire();
    clock.now = 2500;
    await throttle.acquire();

    expect(waits).toEqual([]);
  });

  it("waits only for what is left of the interval", async () => {
    const { clock, waits, throttle } = fakeThrottle();

    await throttle.acquire();
    clock.now = 1500;
    await throttle.acquire();

    expect(waits).toEqual([500]);
  });

  it("turns a caller away when the wait would pass the limit, without taking a slot", async () => {
    const { waits, throttle } = fakeThrottle(3000);

    expect(await throttle.acquire()).toBe(true);
    expect(await throttle.acquire()).toBe(true);
    expect(await throttle.acquire()).toBe(false);
    expect(await throttle.acquire()).toBe(false);
    expect(waits).toEqual([2000]);
  });
});
