import "server-only";
import type { ListId } from "@/features/army-list/lib/ListId";
import type { RuleText } from "@/features/army-list/lib/RuleGlossary";
import { Cooldown } from "@/lib/cooldown";
import { Throttle } from "@/lib/throttle";
import { TtlCache } from "@/lib/ttlCache";
import { fetchEasyArmyList, fetchEasyArmyRules } from "./fetchEasyArmyList";
import { UpstreamListError } from "./UpstreamListError";

/** At most one list is fetched from EasyArmy every two seconds. */
export const UPSTREAM_INTERVAL_MS = 2000;
/** A load that would queue longer than this is refused rather than kept waiting. */
export const MAX_QUEUE_WAIT_MS = 10_000;
/** A list whose PDF could not be read is kept briefly, so the descriptions get another try soon. */
export const LIST_WITHOUT_RULES_TTL_MS = 60_000;
/** The least time between two fetches of one list, so a refresh asks EasyArmy at most this often. */
export const REFRESH_COOLDOWN_MS = 10 * 60_000;
const MAX_CACHED_LISTS = 200;
const MAX_COOLDOWN_KEYS = 1000;

/** A list's JSON and the rule descriptions from its PDF, or `null` when the PDF could not be read. */
export interface EasyArmyListData {
  list: unknown;
  rules: readonly RuleText[] | null;
  /** When the list was fetched from EasyArmy, in epoch milliseconds. */
  fetchedAt: number;
}

interface EasyArmyClientOptions {
  fetch?: typeof fetch;
  throttle?: Throttle;
  now?: () => number;
}

/**
 * Fetches lists from EasyArmy without hammering it: a fetched list stays in
 * memory until it is refreshed or pushed out by newer lists, concurrent loads
 * of one list share a single fetch, a list is refreshed at most once per
 * cooldown, and fetches across the whole server are spaced out by a throttle.
 */
export class EasyArmyClient {
  readonly #fetch: typeof fetch | undefined;
  readonly #throttle: Throttle;
  readonly #now: () => number;
  readonly #cache: TtlCache<EasyArmyListData>;
  readonly #refreshCooldown: Cooldown;
  readonly #inFlight = new Map<string, Promise<EasyArmyListData>>();

  constructor(options: EasyArmyClientOptions = {}) {
    this.#fetch = options.fetch;
    this.#throttle =
      options.throttle ??
      new Throttle({
        intervalMs: UPSTREAM_INTERVAL_MS,
        maxWaitMs: MAX_QUEUE_WAIT_MS,
      });
    this.#now = options.now ?? Date.now;
    this.#cache = new TtlCache<EasyArmyListData>({
      maxEntries: MAX_CACHED_LISTS,
      now: this.#now,
    });
    this.#refreshCooldown = new Cooldown({
      periodMs: REFRESH_COOLDOWN_MS,
      maxKeys: MAX_COOLDOWN_KEYS,
      now: this.#now,
    });
  }

  /**
   * The list, from memory when it was fetched before.
   *
   * @throws UpstreamListError when EasyArmy cannot provide it or the throttle queue is full.
   */
  loadList(listId: ListId): Promise<EasyArmyListData> {
    const cached = this.#cache.get(listId.value);

    if (cached !== undefined) {
      return Promise.resolve(cached);
    }

    return this.#sharedFetch(listId);
  }

  /**
   * The list, fetched from EasyArmy again. A failed refresh keeps the copy
   * already in memory. A refresh while the list is being fetched joins that fetch.
   *
   * @throws UpstreamListError `refresh_too_soon` within the cooldown of the list's last fetch.
   */
  refreshList(listId: ListId): Promise<EasyArmyListData> {
    const pending = this.#inFlight.get(listId.value);

    if (pending !== undefined) {
      return pending;
    }

    if (this.refreshWaitMs(listId) > 0) {
      return Promise.reject(new UpstreamListError("refresh_too_soon"));
    }

    return this.#sharedFetch(listId);
  }

  /** How long until the list may be refreshed, or 0 when it may be refreshed now. */
  refreshWaitMs(listId: ListId): number {
    return this.#refreshCooldown.remainingMs(listId.value);
  }

  #sharedFetch(listId: ListId): Promise<EasyArmyListData> {
    const key = listId.value;
    const pending = this.#inFlight.get(key);

    if (pending !== undefined) {
      return pending;
    }

    const load = this.#fetchAndCache(listId).finally(() => {
      this.#inFlight.delete(key);
    });
    this.#inFlight.set(key, load);

    return load;
  }

  async #fetchAndCache(listId: ListId): Promise<EasyArmyListData> {
    if (!(await this.#throttle.acquire())) {
      throw new UpstreamListError("busy");
    }

    // Every fetch that reaches EasyArmy starts the cooldown, even one that fails.
    this.#refreshCooldown.start(listId.value);
    const options = { fetch: this.#fetch };
    // Both downloads run at once; a missing PDF only costs the descriptions.
    const rules = fetchEasyArmyRules(listId, options).then(
      (glossary): readonly RuleText[] | null => glossary.entries,
      () => null
    );
    const list = await fetchEasyArmyList(listId, options);
    const data: EasyArmyListData = {
      list,
      rules: await rules,
      fetchedAt: this.#now(),
    };

    this.#cache.set(
      listId.value,
      data,
      data.rules === null ? LIST_WITHOUT_RULES_TTL_MS : Number.POSITIVE_INFINITY
    );

    return data;
  }
}
