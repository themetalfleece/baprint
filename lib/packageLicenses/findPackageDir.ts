import { realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Finds the folder of package `name` as Node resolves it from `fromDir`: the
 * nearest `node_modules/<name>` above it, with symlinks (pnpm's store) followed.
 *
 * @throws Error when no folder above `fromDir` has the package installed.
 */
export async function findPackageDir(
  fromDir: string,
  name: string
): Promise<string> {
  return lookUp(await realpath(fromDir), name, fromDir);
}

async function lookUp(
  dir: string,
  name: string,
  fromDir: string
): Promise<string> {
  // Node never looks in `node_modules/node_modules`.
  if (path.basename(dir) !== "node_modules") {
    const candidate = path.join(dir, "node_modules", name);
    if (await isDirectory(candidate)) {
      return realpath(candidate);
    }
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    throw new Error(`Package "${name}" is not installed above ${fromDir}.`);
  }
  return lookUp(parent, name, fromDir);
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory();
  } catch (error) {
    if (isMissingPathError(error)) {
      return false;
    }
    throw error;
  }
}

function isMissingPathError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR")
  );
}
