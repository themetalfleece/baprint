/** A list id: a GUID, the form EasyArmy uses in its share links. */
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHARE_HOST = "wg.easyarmy.com";

/** The id of a saved EasyArmy list. Only a strict GUID is ever accepted. */
export class ListId {
  /** Lower case, so one list always has one id. */
  readonly value: string;

  private constructor(value: string) {
    this.value = value.toLowerCase();
  }

  /** The share link EasyArmy shows for the list. */
  get shareUrl(): string {
    return `https://${SHARE_HOST}/BoltAction/ViewL/${this.value}`;
  }

  /** The URL that serves the list as JSON. */
  get dataUrl(): string {
    return `${this.shareUrl}?ps=1`;
  }

  /** This app's page that opens the list, a link to share or bookmark. */
  get pagePath(): string {
    return `/list/${this.value}`;
  }

  /** Reads a bare id, or returns `null` when it is not a GUID. */
  static fromId(id: string): ListId | null {
    const trimmed = id.trim();

    return GUID.test(trimmed) ? new ListId(trimmed) : null;
  }

  /**
   * Reads what a user pastes: the bare id, or any EasyArmy link to the list,
   * such as `https://wg.easyarmy.com/BoltAction/ViewL/<id>` or
   * `.../BoltAction/Platoon/<id>/1`, with or without the scheme, any letter
   * case or a query. The id is the one path segment that is a GUID. Links to
   * another host, or with no GUID or several in the path, are rejected.
   */
  static fromUserInput(input: string): ListId | null {
    const trimmed = input.trim();
    const bare = ListId.fromId(trimmed);

    if (bare !== null) {
      return bare;
    }

    const url = ListId.#parseUrl(trimmed);

    if (url === null || url.hostname !== SHARE_HOST) {
      return null;
    }

    const [id, ...others] = url.pathname
      .split("/")
      .filter((segment) => GUID.test(segment));

    return id === undefined || others.length > 0 ? null : ListId.fromId(id);
  }

  static #parseUrl(text: string): URL | null {
    const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`;

    if (!URL.canParse(withScheme)) {
      return null;
    }

    const url = new URL(withScheme);

    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  }
}
