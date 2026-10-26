import { describe, expect, it } from "vitest";
import { PackageLicense } from "@/lib/packageLicenses";

const root = process.cwd();

describe("PackageLicense", () => {
  it("reads a direct dependency's licence file", async () => {
    const react = await PackageLicense.resolve(root, ["react"]);

    expect(react.name).toBe("react");
    expect(react.license).toBe("MIT");
    expect(react.text).toContain("Meta Platforms");
    expect(react.toText()).toMatch(/^react \S+ \(MIT\)\n\nMIT License/);
  });

  it("resolves a dependency through the package that loads it", async () => {
    const helpers = await PackageLicense.resolve(root, [
      "next",
      "@swc/helpers",
    ]);

    expect(helpers.name).toBe("@swc/helpers");
    expect(helpers.license).toBe("Apache-2.0");
    expect(helpers.text).toContain("Apache License");
  });

  it("falls back to the declared licence when no file ships", async () => {
    const env = await PackageLicense.resolve(root, ["next", "@next/env"]);

    expect(env.text).toBeNull();
    expect(env.toText()).toContain("declares the MIT licence");
  });

  it("fails on a package that is not installed", async () => {
    await expect(
      PackageLicense.resolve(root, ["no-such-package-installed"])
    ).rejects.toThrow('Package "no-such-package-installed" is not installed');
  });
});
