import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { RuleGlossary } from "@/features/army-list/lib/RuleGlossary";
import { readPdfTextLines } from "@/lib/pdfText";

const FIXTURES = path.join("features", "army-list", "fixtures");

/**
 * Answers `GET /api/lists/sample` with the list the page opens on, in the same
 * `{ list, rules }` shape as a list from EasyArmy. It reads the saved copy in
 * `fixtures/`, so the sample never depends on EasyArmy still having the list.
 *
 * @param root The repo root the fixtures are read from.
 */
export async function respondWithSampleList(
  root: string = process.cwd()
): Promise<Response> {
  const [json, pdf] = await Promise.all([
    readFile(path.join(root, FIXTURES, "easyarmy-sample-list.json"), "utf8"),
    readFile(path.join(root, FIXTURES, "easyarmy-sample-list.pdf")),
  ]);
  const glossary = RuleGlossary.fromPdfLines(
    await readPdfTextLines(new Uint8Array(pdf))
  );

  return Response.json({
    list: JSON.parse(json),
    rules: glossary.entries,
  });
}
