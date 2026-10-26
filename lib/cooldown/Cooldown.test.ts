import { describe, expect, it } from "vitest";
import { Cooldown } from "@/lib/cooldown";

function cooldownAt(clock: { now: number }, maxKeys = 10) {
  return new Cooldown({ periodMs: 1000, maxKeys, now: () => clock.now });
}

describe("Cooldown", () => {
  it("lets a key that never started go straight away", () => {
    expect(cooldownAt({ now: 0 }).remainingMs("a")).toBe(0);
  });

  it("counts down from the last start", () => {
    const clock = { now: 0 };
    const cooldown = cooldownAt(clock);

    cooldown.start("a");
    clock.now = 400;
    expect(cooldown.remainingMs("a")).toBe(600);

    clock.now = 1000;
    expect(cooldown.remainingMs("a")).toBe(0);
  });

  it("keeps each key's period apart", () => {
    const clock = { now: 0 };
    const cooldown = cooldownAt(clock);

    cooldown.start("a");
    clock.now = 500;
    cooldown.start("b");

    expect(cooldown.remainingMs("a")).toBe(500);
    expect(cooldown.remainingMs("b")).toBe(1000);
  });

  it("restarts the period when a key starts again", () => {
    const clock = { now: 0 };
    const cooldown = cooldownAt(clock);

    cooldown.start("a");
    clock.now = 1500;
    cooldown.start("a");

    expect(cooldown.remainingMs("a")).toBe(1000);
  });
});
