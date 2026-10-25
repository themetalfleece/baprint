# wgeaprint

A Next.js App Router app that renders EasyArmy Bolt Action lists for print. It follows the conventions of `themetalfleece.dev` as a single-app repo: read that repo's `.agents/skills/` for the long-form rules when you touch their area.

## Layout

- `app/`: routes only. A route file calls into a feature and holds no logic of its own.
- `features/army-list/`: the business logic. `lib/` holds the parser classes (`ArmyList`, `Platoon`, `Unit`, `SpecialRuleIndex`, `RuleGlossary`, `ListId`), `components/` the sheets and the client workbench, `server/` the EasyArmy fetch behind the list route (`server-only`).
- `components/ui/`: the design system primitives and `tokens.css`. Reuse a primitive before writing a bare `<button>` or `<input>`.
- `lib/<concern>/`: generic helpers with no knowledge of Bolt Action. `lib/pdfText` reads positioned text lines from a PDF, server side.
- Import with `@/`, never `../../`. Shared code never imports features or routes; lint enforces it.

## Rules

- **The input is the list's share link, fetched on the server.** EasyArmy sends no CORS headers, so the browser cannot read a list itself. `output: "standalone"` builds a Node server and `GET /api/lists/<id>` fetches EasyArmy's `?ps=1` JSON. Do not add PDF upload or a paste box: the board removed them to keep the app simple.
- **Rule descriptions come from the list's PDF, read on the server.** The JSON has none. The route also fetches the PDF at the share link and `RuleGlossary` reads its SPECIAL RULES section (bold line = rule name). A PDF that cannot be read only drops the descriptions, never the list.
- **Read PDF text through `lib/pdfText`, not `getTextContent`.** EasyArmy's PDFs (Select.Pdf) paint the whole list on every page and clip each page to its slice, and map the hyphen glyph to a soft hyphen. pdf.js text content ignores the clip and drops soft hyphens; `TextRunCollector` honours both. `pdfjs-dist` stays in `serverExternalPackages` with its legacy build traced into the standalone output.
- **The list route only reaches EasyArmy's list endpoint.** It accepts a bare GUID (`ListId`), builds the URL itself, does not follow redirects, and caps time and size. Keep it that way.
- **The wire format stops at the parser.** Only `features/army-list/lib` reads EasyArmy field names, string booleans and the `ItemPEN`/`ItemPen` split. Components take the parsed classes.
- **Show rule text exactly as EasyArmy prints it.** The board chose to show the full descriptions. Do not rewrite or summarise them, and keep the book and page reference next to each one.
- **Print is black and grey only.** Every colour is a token in `components/ui/tokens.css`, and those are greys.
- **A unit card never splits across a page** (`break-inside: avoid`). Check a print change with a PDF, not just the screen.
- **Every parsed entity has a stable `id`** for React keys; lint bans index keys.
- **Fixtures stay byte for byte as EasyArmy served them.** Biome skips `fixtures/`.
- **Tests import server modules directly.** `vitest.config.mts` aliases `server-only` to its empty server entry. Inject `fetch` into server code so tests never reach the network.
- **No em dashes, no nested ternaries, no `switch`, no inline JSX handlers, no conditional spreads.** Biome and the plugins in `biome-plugins/` enforce most of these.
- **Pin a new dependency to its latest stable release**, exact version, in `package.json`.

## Before you finish

All must pass:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Browser checks use Google Chrome or Playwright's bundled Chromium, never Edge, against `pnpm start` on a port other than 3100.
