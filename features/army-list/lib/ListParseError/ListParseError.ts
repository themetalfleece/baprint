/** Thrown when input is not an EasyArmy list. The message is safe to show to the user. */
export class ListParseError extends Error {
  override readonly name = "ListParseError";
}
