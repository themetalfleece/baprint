import { TtlCache } from "@/lib/ttlCache";

interface CooldownOptions {
  /** How long a key stays cooling down after it starts. */
  periodMs: number;
  /** Past this many keys the least recently used one is forgotten. */
  maxKeys: number;
  now?: () => number;
}

/** Remembers when each key last started, so an action per key runs at most once per period. */
export class Cooldown {
  readonly #periodMs: number;
  readonly #now: () => number;
  readonly #startedAt: TtlCache<number>;

  constructor(options: CooldownOptions) {
    this.#periodMs = options.periodMs;
    this.#now = options.now ?? Date.now;
    this.#startedAt = new TtlCache<number>({
      maxEntries: options.maxKeys,
      now: this.#now,
    });
  }

  /** Starts the period for `key` from now. */
  start(key: string): void {
    this.#startedAt.set(key, this.#now(), this.#periodMs);
  }

  /** How long until `key` may start again, or 0 when it may start now. */
  remainingMs(key: string): number {
    const startedAt = this.#startedAt.get(key);

    if (startedAt === undefined) {
      return 0;
    }

    return Math.max(0, startedAt + this.#periodMs - this.#now());
  }
}
