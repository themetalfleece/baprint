interface Entry<V> {
  value: V;
  expiresAt: number;
}

/**
 * An in-memory cache whose entries expire after their own time to live. Past
 * `maxEntries` it drops the least recently used entry.
 */
export class TtlCache<V> {
  readonly #entries = new Map<string, Entry<V>>();
  readonly #maxEntries: number;
  readonly #now: () => number;

  constructor(options: { maxEntries: number; now?: () => number }) {
    this.#maxEntries = options.maxEntries;
    this.#now = options.now ?? Date.now;
  }

  get size(): number {
    return this.#entries.size;
  }

  /** The value for `key`, or `undefined` when it is missing or expired. */
  get(key: string): V | undefined {
    const entry = this.#entries.get(key);

    if (entry === undefined) {
      return undefined;
    }

    this.#entries.delete(key);

    if (entry.expiresAt <= this.#now()) {
      return undefined;
    }

    // Re-inserting moves the key to the end, so the map stays in recency order.
    this.#entries.set(key, entry);

    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    this.#entries.delete(key);
    this.#entries.set(key, { value, expiresAt: this.#now() + ttlMs });

    for (const oldest of this.#entries.keys()) {
      if (this.#entries.size <= this.#maxEntries) {
        break;
      }

      this.#entries.delete(oldest);
    }
  }
}
