# wgeaprint

Prints an EasyArmy Bolt Action list as a clean, black and grey A4 sheet. Unit cards never split across pages, and a quick reference mode fits a typical list on one page.

## Run it

Needs Node 24.2 or newer and pnpm 12 (`npx pnpm@12` works if pnpm is not installed).

```bash
pnpm install
pnpm dev                 # http://localhost:3000
```

For production, build the standalone server and start it. `PORT` and `HOSTNAME` pick where it listens.

```bash
pnpm build
PORT=3000 pnpm start
```

## Loading a list

Paste the list's share link, such as `https://wg.easyarmy.com/BoltAction/ViewL/<id>`, or just the id, and press **Load list**.

EasyArmy does not let browsers read its lists, so the app fetches them on its own server through `GET /api/lists/<id>`. That route accepts only a list id, builds the EasyArmy URLs itself, does not follow redirects, and gives up after 10 seconds. It reads two things:

- the list as JSON (`?ps=1`, capped at 1 MB), for the units and points;
- the PDF at the share link (capped at 5 MB), for the special-rule descriptions, which the JSON does not carry.

If the PDF cannot be read, the list still loads and the rules show their names and pages only.

## Special rules

The full sheet lists each special rule with its description as EasyArmy prints it, the book and page to read it in, and the units that carry it. Where EasyArmy prints a variant under the same rule, such as "(75mm) HE (2")", it follows the main text. The quick reference keeps to names and pages so it fits on one page.

## Checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
