import "server-only";

export type UpstreamFailure = "not_found" | "bad_upstream" | "timeout";

const STATUS: Readonly<Record<UpstreamFailure, number>> = {
  not_found: 404,
  bad_upstream: 502,
  timeout: 504,
};

const MESSAGES: Readonly<Record<UpstreamFailure, string>> = {
  not_found: "EasyArmy has no list with that id.",
  bad_upstream: "EasyArmy did not send a readable list. Try again later.",
  timeout: "EasyArmy took too long to answer. Try again.",
};

/** A failed fetch from EasyArmy. The message is safe to show to the user. */
export class UpstreamListError extends Error {
  override readonly name = "UpstreamListError";
  readonly code: UpstreamFailure;

  constructor(code: UpstreamFailure) {
    super(MESSAGES[code]);
    this.code = code;
  }

  /** The HTTP status the list route answers with. */
  get status(): number {
    return STATUS[this.code];
  }
}
