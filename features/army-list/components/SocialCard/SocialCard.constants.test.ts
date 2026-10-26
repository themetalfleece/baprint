import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SOCIAL_CARD_PALETTE } from "./SocialCard.constants";

const tokens = readFileSync(
  new URL("../../../../components/ui/tokens.css", import.meta.url),
  "utf8"
);

describe("SOCIAL_CARD_PALETTE", () => {
  it.each(Object.entries(SOCIAL_CARD_PALETTE))(
    "matches %s in tokens.css",
    (token, value) => {
      expect(tokens).toContain(`${token}: ${value};`);
    }
  );
});
