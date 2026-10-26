import { setTimeout as sleep } from "node:timers/promises";

interface ThrottleOptions {
  /** The least time between the start of two tasks. */
  intervalMs: number;
  /** A caller who would wait longer than this is turned away instead. */
  maxWaitMs: number;
  now?: () => number;
  wait?: (ms: number) => Promise<unknown>;
}

/**
 * Spaces tasks out to one per interval, across every caller in the process.
 * Each caller reserves the next free slot and waits for it, so the queue is
 * first come, first served and bounded by `maxWaitMs`.
 */
export class Throttle {
  readonly #intervalMs: number;
  readonly #maxWaitMs: number;
  readonly #now: () => number;
  readonly #wait: (ms: number) => Promise<unknown>;
  #nextSlot = Number.NEGATIVE_INFINITY;

  constructor(options: ThrottleOptions) {
    this.#intervalMs = options.intervalMs;
    this.#maxWaitMs = options.maxWaitMs;
    this.#now = options.now ?? Date.now;
    this.#wait = options.wait ?? sleep;
  }

  /**
   * Waits for this caller's slot. Resolves `false` straight away, reserving
   * nothing, when the slot is further off than `maxWaitMs`.
   */
  async acquire(): Promise<boolean> {
    const now = this.#now();
    const slot = Math.max(now, this.#nextSlot);
    const delay = slot - now;

    if (delay > this.#maxWaitMs) {
      return false;
    }

    this.#nextSlot = slot + this.#intervalMs;

    if (delay > 0) {
      await this.#wait(delay);
    }

    return true;
  }
}
