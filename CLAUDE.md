# baprint

A Next.js App Router app that renders EasyArmy Bolt Action lists for print. The repo is open source under the MIT License, so everything in it is public.

## Layout

- `app/`: routes only. A route file calls into a feature and holds no logic of its own.
- `features/army-list/`: the business logic. `lib/` holds the parser classes (`ArmyList`, `Platoon`, `Unit`, `SpecialRuleIndex`, `RuleGlossary`, `ListId`), `components/` the page (`ArmyListPage`), the sheets and the client workbench, `server/` the EasyArmy fetch behind the list route (`server-only`).
- `components/ui/`: the design system primitives and `tokens.css`. Reuse a primitive before writing a bare `<button>` or `<input>`.
- `lib/<concern>/`: generic helpers with no knowledge of Bolt Action. `lib/pdfText` reads positioned text lines from a PDF, server side. `lib/packageLicenses` reads an installed package's licence. `lib/ttlCache` and `lib/throttle` back the EasyArmy client. `lib/siteOrigin` works out the site's public origin. `lib/printFit` scales blocks so each prints on one page.
- Import with `@/`, never `../../`. Shared code never imports features or routes; lint enforces it.

## Rules

- **The input is the list's share link, fetched on the server.** EasyArmy sends no CORS headers, so the browser cannot read a list itself. `output: "standalone"` builds a Node server and `GET /api/lists/<id>` fetches EasyArmy's `?ps=1` JSON. Do not add PDF upload or a paste box: the maintainer removed them to keep the app simple.
- **Rule descriptions come from the list's PDF, read on the server.** The JSON has none. The route also fetches the PDF at the share link and `RuleGlossary` reads its SPECIAL RULES section (bold line = rule name). A PDF that cannot be read only drops the descriptions, never the list.
- **Read PDF text through `lib/pdfText`, not `getTextContent`.** EasyArmy's PDFs (Select.Pdf) paint the whole list on every page and clip each page to its slice, and map the hyphen glyph to a soft hyphen. pdf.js text content ignores the clip and drops soft hyphens; `TextRunCollector` honours both. `pdfjs-dist` stays in `serverExternalPackages` with its legacy build traced into the standalone output.
- **The page opens on the sample list, served from `fixtures/`.** The maintainer wants a first visit to show a finished sheet. `GET /api/lists/sample` is built statically from the fixture JSON and PDF, because the original EasyArmy list no longer exists there. Only the home page shows the sample. A sample that fails to load shows no error.
- **Every list has its own page, `/list/<id>`.** The maintainer asked for deeplinks. "Load list" navigates there and that page does the load; it never loads a link in place. The id in the path is a strict GUID: anything else is a 404, and another letter case redirects to the lower case path.
- **The server goes easy on EasyArmy.** `EasyArmyClient` keeps a fetched list in memory with no time limit (1 minute when the PDF failed), up to 200 lists with the least recently used dropped first. It shares one fetch between concurrent loads of a list, and spaces fetches server-wide at least 2 seconds apart, answering 429 when the queue would pass 10 seconds. Failed loads are not cached. Use the one shared client in `sharedEasyArmyClient.ts`, so every request shares its cache and throttle; tests pass their own.
- **A cached list is never refetched, so there is no refresh.** The maintainer's call: a shared list is locked on EasyArmy, and an edited list gets a new id and link, so a cached copy cannot go stale. Do not add a refresh button, a refetch route or a cache TTL for lists with rules. A list preview image is cached for a day for the same reason.
- **Every page has a title, description and preview image.** The maintainer asked for link previews, consistent and lean. `server/pageMetadata.ts` builds the metadata and `server/socialImage.tsx` draws `SocialCard` with `next/og`; the `opengraph-image.tsx` route files only call them. A list page names the army (its first platoon's name, as `ArmyList.name`), countries and points through `ListPreview`, loaded via the shared client so a preview never adds an EasyArmy fetch. A list that cannot be loaded falls back to the generic preview, and its image is sent `no-store`.
- **Absolute URLs come from `lib/siteOrigin`.** The Docker image needs no configuration, so the root layout reads the origin per request: `SITE_URL` if set, else the proxy's `X-Forwarded-*` headers or `Host`, with the host checked against a plain host name pattern.
- **`SocialCard` colours are copies of the chrome tokens.** `next/og` cannot read CSS variables, so `SOCIAL_CARD_PALETTE` repeats the `--ds-chrome-*` values and a test fails when they drift. Change a colour in `tokens.css` first.
- **The sample must never show while a list loads.** The maintainer's call. A load in flight hides the current sheet and its toolbar and shows `LoadingSheet`, a grey outline of a sheet; a failed load brings the previous list back. The sample sits under a tinted banner with a "Sample" tag and a large "Showing a sample list" heading, so it cannot be mistaken for the user's list.
- **Keep the share link steps next to the link field.** Open the list on wg.easyarmy.com, View > Output > Lock to Share, then Output > copy the Share link. Update them if EasyArmy changes its menus.
- **The link field takes any wg.easyarmy.com link that holds the id.** The maintainer asked for it, so `/BoltAction/Platoon/<id>/1` and `/BoltAction/View/<id>/1` work as well as the share link. `ListId.fromUserInput` checks the host and takes the one path segment that is a GUID; a path with none or several is rejected.
- **A click on the link field selects the whole link.** The maintainer asked for it, with a pointer cursor over the field. `TextInput` does both with `selectOnFocus`; a second click still places the caret.
- **The list route only reaches EasyArmy's list endpoint.** It accepts a bare GUID (`ListId`), builds the URL itself, does not follow redirects, and caps time and size. Keep it that way.
- **The wire format stops at the parser.** Only `features/army-list/lib` reads EasyArmy field names, string booleans and the `ItemPEN`/`ItemPen` split. Components take the parsed classes.
- **A missing weapon stat prints as "-", never "n/a".** The maintainer's call. `Unit` converts EasyArmy's "n/a" while parsing, so no component has to.
- **There is one view, printed a platoon per page.** The maintainer removed the continuous and quick reference modes. Page one holds the summary, the quick reference table (print only) and the pick list; then each platoon and the special rules start a new page (`.sheet > section`). Do not add layout modes back without the maintainer.
- **Show rule text exactly as EasyArmy prints it.** The maintainer chose to show the full descriptions. Do not rewrite or summarise them, and keep the book and page reference next to each one.
- **The app is called "baprint".** Use that name in the UI, docs, package name and Docker tag; "Bolt Action list printer" is only its description. A local checkout may sit in a folder with an older name; never use that name in the repo. A loaded list sets the page title to `ArmyList.title`, which Chrome uses as the saved PDF's file name.
- **Print is black and grey only.** Every colour is a token in `components/ui/tokens.css`. The sheet uses only the grey `--ds-color-*` tokens.
- **The screen chrome should look polished, not plain.** The maintainer asked for it. The header, form, toolbar, banners and footer use the olive `--ds-chrome-*` tokens, cards and shadows, and on screen the sheet sits on a white paper card over a tinted backdrop. All of it is screen only: print hides the chrome and drops the card, backdrop and accents. Mix transparency from a token with `color-mix`, never a literal colour.
- **Focus is a real outline.** `reset.css` sets one `:focus-visible` outline for the whole app; do not swap it for a box-shadow or set `outline: none`. Forced-colors mode drops shadows, and a hover shadow would replace the ring.
- **A unit card never splits across a page** (`break-inside: avoid`). Check a print change with a PDF, not just the screen.
- **A platoon prints on one page, shrunk if it has to be.** The maintainer asked for it. On `beforeprint`, `lib/printFit` lays the sheet out at the page's width, zooms each `[data-fit-page]` platoon down until it measures no taller than the page and sets `--print-fit`, which only the print style reads. It stops at `MIN_PLATOON_SCALE` (0.65), below which a platoon runs onto a second page. The printable areas in `ArmyListSheet.constants.ts` copy the `@page` margins in `reset.css`, and a test fails when they drift.
- **Pick the paper size with a named page, not a runtime `<style>`.** `reset.css` declares `@page a4` and `@page letter`, and a sheet opts in with the `page` property.
- **Every parsed entity has a stable `id`** for React keys; lint bans index keys.
- **Fixtures stay as EasyArmy served them, except for the rule text.** The sample PDF's special-rule descriptions are lorem ipsum placeholders, so the public repo does not redistribute Warlord Games' rule wording. Each placeholder word has the same length as the word it replaced, and page refs, numbers, punctuation, soft hyphens and all-caps terms are unchanged, so the PDF keeps the layout and quirks the parser tests rely on. Never commit real rule descriptions, in fixtures or in test strings. Biome skips `fixtures/`.
- **Tests import server modules directly.** `vitest.config.mts` aliases `server-only` to its empty server entry. Inject `fetch` into server code so tests never reach the network.
- **No em dashes, no nested ternaries, no `switch`, no inline JSX handlers, no conditional spreads.** Biome and the plugins in `biome-plugins/` enforce most of these.
- **Pin a new dependency to its latest stable release**, exact version, in `package.json`.
- **Keep the repo publishable.** No personal data, secrets, local paths, internal tracker ids or references to private repos in code, comments, tests or fixtures. Test list ids are made-up GUIDs, not real EasyArmy lists.
- **Keep the legal notices true.** The screen footer (`LegalNotice`) and `NOTICE.md` say the app is unofficial, name Warlord Games as owner of the game content, and promise no cookies or analytics, and say a list stays only in the server's memory, until newer lists push it out or the server restarts. Update both if that changes. The footer stays off the printed sheet.
- **A new runtime dependency goes in the licence list.** Add it to `SHIPPED_PACKAGES` in `features/army-list/server/thirdPartyLicensesRoute.ts` and to the `NOTICE.md` table. A package Next.js carries precompiled (such as `@vercel/og` for `next/og`) goes in `BUNDLED_PACKAGES` instead. The client bundles strip licence comments, so `GET /third-party-licenses.txt` (built statically from `node_modules`) is where the site meets the MIT and Apache attribution terms. `lib/packageLicenses` reads them. After a build, every package in `.next/standalone/node_modules/.pnpm` must be in that list. Keep versions out of `NOTICE.md`: the txt reads them from `node_modules`.
- **The site links to the source on GitHub.** The maintainer asked for it: a GitHub pill in the header banner and a line in the footer, both through `SourceLink`, screen only. `SOURCE_REPOSITORY_URL` holds the address; `package.json` (`homepage`, `repository`, `bugs`) and the README repeat it, and a test fails when they drift.
- **sharp stays out of the server build.** The app has no `next/image`, so `outputFileTracingExcludes` drops sharp and its native libvips binary (LGPL, platform specific). Remove the exclusion, and list sharp's packages, only if you add `next/image`. It also drops `semver` and `detect-libc` for every route, because only sharp needs them: a new runtime dependency that needs either one means removing those excludes, or the server fails with `Cannot find module` on that code path.

## Docker image

The root `Dockerfile` builds the standalone server for Dokploy or any Docker host.

- **pnpm comes from corepack, installed with npm.** Node 25+ no longer bundles corepack, and corepack reads the version from `packageManager`.
- **Install with `--ignore-scripts`.** No dependency needs a build script.
- **The runtime files stay root-owned.** Only `.next/cache` belongs to the `node` user.
- **A file read at request time must be traced.** The sample list and the licence text are prerendered, so `fixtures/` and the licence files are not in the image; a dynamic route that reads files needs `outputFileTracingIncludes`.
- **pdf.js warns that `@napi-rs/canvas` is missing at startup.** That is expected: the server only reads text, never renders a page.
- Check a Dockerfile change with a real `docker build` and a request to `/` and `/api/lists/sample` on the running container.

## Before you finish

All must pass:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Browser checks use Google Chrome or Playwright's bundled Chromium, never Edge, against `pnpm start`.
