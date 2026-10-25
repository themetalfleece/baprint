import type { TextLine, TextRun } from "./pdfText.types";

/** How far apart two baselines may be, as a share of the font size, and still be one line. */
const BASELINE_TOLERANCE = 0.3;
/** A horizontal gap wider than this share of the font size reads as a space. */
const WORD_GAP = 0.15;

/**
 * Groups a page's runs into lines, top to bottom, each read left to right.
 * Runs on one line can sit a fraction of a point apart when a writer centres
 * cells of different heights, so baselines within a tolerance are merged.
 */
export function groupRunsIntoLines(runs: readonly TextRun[]): TextLine[] {
  const sorted = runs.toSorted(
    (first, second) => second.y - first.y || first.x - second.x
  );
  const groups: TextRun[][] = [];

  for (const run of sorted) {
    const current = groups.at(-1);
    const anchor = current?.[0];

    if (
      current !== undefined &&
      anchor !== undefined &&
      anchor.y - run.y <= BASELINE_TOLERANCE * anchor.fontSize
    ) {
      current.push(run);
      continue;
    }

    groups.push([run]);
  }

  return groups.map(toLine);
}

function toLine(runs: readonly TextRun[]): TextLine {
  const ordered = runs.toSorted((first, second) => first.x - second.x);

  return { y: runs[0]?.y ?? 0, runs: ordered, text: joinRuns(ordered) };
}

/** Joins runs left to right, adding a space only where the page shows a gap. */
function joinRuns(runs: readonly TextRun[]): string {
  let text = "";
  let previous: TextRun | undefined;

  for (const run of runs) {
    const gap =
      previous === undefined ? 0 : run.x - (previous.x + previous.width);
    const needsSpace = previous !== undefined && gap > WORD_GAP * run.fontSize;
    text += needsSpace ? ` ${run.text}` : run.text;
    previous = run;
  }

  return text.replace(/\s+/g, " ").trim();
}
