import "server-only";
import type { ListId } from "@/features/army-list/lib/ListId";
import type { RuleText } from "@/features/army-list/lib/RuleGlossary";
import { Throttle } from "@/lib/throttle";
import { TtlCache } from "@/lib/ttlCache";
import { fetchEasyArmyList, fetchEasyArmyRules } from "./fetchEasyArmyList";
import { UpstreamListError } from "./UpstreamListError";

/** At most one list is fetched from EasyArmy every two seconds. */
export const UPSTREAM_INTERVAL_MS = 2000;
/** A load that would queue longer than this is refused rather than kept waiting. */
export const MAX_QUEUE_WAIT_MS = 10_000;
/** How long a fetched list is served from memory before EasyArmy is asked again. */
export const LIST_TTL_MS = 10 * 60_000;
/** A list whose PDF could not be read is kept briefly, so the descriptions get another try soon. */
export const LIST_WITHOUT_RULES_TTL_MS = 60_000;
const MAX_CACHED_LISTS = 200;

/** A list's JSON and the rule descriptions from its PDF, or `null` when the PDF could not be read. */
export interface EasyArmyListData {
  list: unknown;
  rules: readonly RuleText[] | null;
}

interface EasyArmyClientOptions {
  fetch?: typeof fetch;
  throttle?: Throttle;
  cache?: TtlCache<EasyArmyListData>;
}

/**
 * Fetches lists from EasyArmy without hammering it: a fetched list is kept in
 * memory for a while, concurrent loads of one list share a single fetch, and
 * fetches across the whole server are spaced out by a throttle.
 */
export class EasyArmyClient {
  readonly #fetch: typeof fetch | undefined;
  readonly #throttle: Throttle;
  readonly #cache: TtlCache<EasyArmyListData>;
  readonly #inFlight = new Map<string, Promise<EasyArmyListData>>();

  constructor(options: EasyArmyClientOptions = {}) {
    this.#fetch = options.fetch;
    this.#throttle =
      options.throttle ??
      new Throttle({
        intervalMs: UPSTREAM_INTERVAL_MS,
        maxWaitMs: MAX_QUEUE_WAIT_MS,
      });
    this.#cache =
      options.cache ??
      new TtlCache<EasyArmyListData>({ maxEntries: MAX_CACHED_LISTS });
  }

  /**
   * The list, from memory when it was fetched recently.
   *
   * @throws UpstreamListError when EasyArmy cannot provide it or the throttle queue is full.
   */
  loadList(listId: ListId): Promise<EasyArmyListData> {
    const key = listId.value;
    const cached = this.#cache.get(key);

    if (cached !== undefined) {
      return Promise.resolve(cached);
    }

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

    const options = { fetch: this.#fetch };
    // Both downloads run at once; a missing PDF only costs the descriptions.
    const rules = fetchEasyArmyRules(listId, options).then(
      (glossary): readonly RuleText[] | null => glossary.entries,
      () => null
    );
    const data: EasyArmyListData = {
      list: await fetchEasyArmyList(listId, options),
      rules: await rules,
    };

    this.#cache.set(
      listId.value,
      data,
      data.rules === null ? LIST_WITHOUT_RULES_TTL_MS : LIST_TTL_MS
    );

    return data;
  }
}
