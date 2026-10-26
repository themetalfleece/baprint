import "server-only";
import { PackageLicense } from "@/lib/packageLicenses";

/**
 * The packages the built app runs on, server or browser. Each is a chain
 * resolved from the repo root, so a dependency of a dependency is read where
 * its parent loads it. Build tools are left out because they do not ship.
 */
const SHIPPED_PACKAGES: readonly (readonly string[])[] = [
  ["next"],
  ["next", "@next/env"],
  ["next", "@swc/helpers"],
  ["next", "styled-jsx"],
  ["next", "styled-jsx", "client-only"],
  ["react"],
  ["react-dom"],
  ["react-dom", "scheduler"],
  ["clsx"],
  ["pdfjs-dist"],
  ["server-only"],
];

const INTRO = `baprint: third-party software notices

The app ships the open source packages below. Each is listed with its version
and licence, followed by the licence text from the package.`;

const SEPARATOR = `\n\n${"=".repeat(72)}\n\n`;

/**
 * Answers `GET /third-party-licenses.txt` with the licence of every package the
 * app ships, read from the installed packages so it follows version bumps.
 *
 * @param root The repo root the packages are resolved from.
 */
export async function respondWithThirdPartyLicenses(
  root: string = process.cwd()
): Promise<Response> {
  const licenses = await Promise.all(
    SHIPPED_PACKAGES.map((chain) => PackageLicense.resolve(root, chain))
  );
  const body = [INTRO, ...licenses.map((license) => license.toText())].join(
    SEPARATOR
  );

  return new Response(`${body}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
