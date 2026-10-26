import { describe, expect, it } from "vitest";
import { siteOrigin } from "@/lib/siteOrigin";

function origin(headers: Record<string, string>, configured?: string) {
  return siteOrigin(new Headers(headers), configured)?.href;
}

describe("siteOrigin", () => {
  it("prefers the configured URL, trimmed to its origin", () => {
    expect(
      origin({ host: "internal:3000" }, "https://baprint.example/some/path")
    ).toBe("https://baprint.example/");
  });

  it("ignores a configured URL that is not http or https", () => {
    expect(origin({ host: "baprint.example" }, "ftp://files.example")).toBe(
      "http://baprint.example/"
    );
    expect(origin({ host: "baprint.example" }, "not a url")).toBe(
      "http://baprint.example/"
    );
  });

  it("reads the first hop of the proxy's forwarded headers", () => {
    expect(
      origin({
        host: "127.0.0.1:3000",
        "x-forwarded-host": "baprint.example, proxy.internal",
        "x-forwarded-proto": "https, http",
      })
    ).toBe("https://baprint.example/");
  });

  it("falls back to the Host header over http", () => {
    expect(origin({ host: "localhost:3000" })).toBe("http://localhost:3000/");
    expect(
      origin({ host: "localhost:3000", "x-forwarded-proto": "gopher" })
    ).toBe("http://localhost:3000/");
  });

  it("rejects a host that is not a plain host name", () => {
    expect(origin({ host: "evil.example/path" })).toBeUndefined();
    expect(origin({ host: "user@evil.example" })).toBeUndefined();
    expect(origin({})).toBeUndefined();
  });
});
