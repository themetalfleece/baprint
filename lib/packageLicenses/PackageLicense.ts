import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isRecord, readText } from "@/lib/wireValues";
import { findPackageDir } from "./findPackageDir";

const LICENSE_FILE = /^licen[cs]e(\.md|\.txt)?$/i;

/** An installed package's name, version and licence, read from its folder. */
export class PackageLicense {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  /** The package's licence file, or null when it ships none. */
  readonly text: string | null;

  private constructor(
    name: string,
    version: string,
    license: string,
    text: string | null
  ) {
    this.name = name;
    this.version = version;
    this.license = license;
    this.text = text;
  }

  /**
   * Reads the package reached through `chain` from `root`. The first name is
   * resolved from `root` and each later one from the package before it, so
   * `["next", "@swc/helpers"]` reads the copy Next.js itself loads.
   *
   * @param bundledAt A folder inside the last package that holds a package
   * it ships precompiled, such as `dist/compiled/@vercel/og` in Next.js.
   */
  static async resolve(
    root: string,
    chain: readonly string[],
    bundledAt = ""
  ): Promise<PackageLicense> {
    const dir = await chain.reduce<Promise<string>>(
      async (from, name) => findPackageDir(await from, name),
      Promise.resolve(root)
    );
    return PackageLicense.read(path.join(dir, bundledAt));
  }

  /** Reads the package installed in `dir`. */
  static async read(dir: string): Promise<PackageLicense> {
    const manifest: unknown = JSON.parse(
      await readFile(path.join(dir, "package.json"), "utf8")
    );
    if (!isRecord(manifest)) {
      throw new Error(`${dir}/package.json is not a JSON object.`);
    }
    const file = (await readdir(dir)).find((name) => LICENSE_FILE.test(name));
    const text =
      file === undefined
        ? null
        : (await readFile(path.join(dir, file), "utf8")).trim();

    return new PackageLicense(
      readText(manifest.name),
      readText(manifest.version),
      readText(manifest.license),
      text
    );
  }

  /** The package as a plain text notice: a heading line, then its licence. */
  toText(): string {
    const heading = `${this.name} ${this.version} (${this.license})`;
    const body =
      this.text ??
      `This package ships no licence file. Its package.json declares the ${this.license} licence.`;
    return `${heading}\n\n${body}`;
  }
}
