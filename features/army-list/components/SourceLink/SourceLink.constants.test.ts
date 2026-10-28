import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SOURCE_REPOSITORY_URL } from "./SourceLink.constants";

const repoRoot = new URL("../../../../", import.meta.url);

describe("SOURCE_REPOSITORY_URL", () => {
  it("matches the repository in package.json", () => {
    const pkg = JSON.parse(
      readFileSync(new URL("package.json", repoRoot), "utf8")
    );

    expect(pkg.homepage).toBe(SOURCE_REPOSITORY_URL);
    expect(pkg.repository.url).toBe(`git+${SOURCE_REPOSITORY_URL}.git`);
    expect(pkg.bugs.url).toBe(`${SOURCE_REPOSITORY_URL}/issues`);
  });

  it("is linked from the README", () => {
    const readme = readFileSync(new URL("README.md", repoRoot), "utf8");

    expect(readme).toContain(`](${SOURCE_REPOSITORY_URL})`);
  });
});
