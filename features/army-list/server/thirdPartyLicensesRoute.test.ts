import { describe, expect, it } from "vitest";
import { respondWithThirdPartyLicenses } from "@/features/army-list/server/thirdPartyLicensesRoute";

describe("respondWithThirdPartyLicenses", () => {
  it("serves every shipped package's licence as plain text", async () => {
    const response = await respondWithThirdPartyLicenses();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8"
    );
    for (const heading of [
      /^next \S+ \(MIT\)$/m,
      /^react-dom \S+ \(MIT\)$/m,
      /^scheduler \S+ \(MIT\)$/m,
      /^client-only \S+ \(MIT\)$/m,
      /^pdfjs-dist \S+ \(Apache-2\.0\)$/m,
      /^clsx \S+ \(MIT\)$/m,
      /^@vercel\/og \S+ \(MPL-2\.0\)$/m,
    ]) {
      expect(body).toMatch(heading);
    }
  });
});
