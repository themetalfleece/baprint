# baprint

A Bolt Action list printer. It prints an EasyArmy Bolt Action list as a clean, black and grey sheet. Unit cards never split across pages.

Source code: [github.com/themetalfleece/baprint](https://github.com/themetalfleece/baprint)

## Page layout

The print runs on A4 or US Letter, in this order:

1. The army summary, a quick reference of the whole army (one dense row per unit) and the pick list.
2. One page per platoon, with its unit cards.
3. The special rules.

A platoon or the rules can run over more than one page if they do not fit. The quick reference only appears in print; the screen shows the summary, pick list, platoons and rules.

Weapon stats that EasyArmy gives as "n/a" print as "-".

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

## Deploy

The `Dockerfile` builds the standalone server, for Dokploy or any Docker host. It needs no build arguments or environment variables and listens on port 3000.

```bash
docker build -t baprint .
docker run -p 3000:3000 baprint
```

Link previews need absolute URLs. The server builds them from the `X-Forwarded-Host` and `X-Forwarded-Proto` headers a reverse proxy sets, or from `Host`. Set `SITE_URL` (such as `https://baprint.example`) at runtime to fix the address instead.

## Link previews

Every page has a title, description and preview image for apps that unfurl links. The home page shows the app. A list page, `/list/<id>`, names the army (its first platoon's name), its countries and points, and its image shows the points, order dice, platoons and units. Both read the list through the same server cache as the page, so a shared link costs EasyArmy one fetch. A list that cannot be loaded falls back to the home preview.

## Loading a list

The home page opens on a sample list so you can see what a printed sheet looks like. Loading your own goes to its own page, `/list/<id>`, which you can bookmark or share; open the home page again to see the sample. The app serves the sample from its own copy in `features/army-list/fixtures/` through `GET /api/lists/sample`, built as a static file, so it does not depend on EasyArmy. Its special rules show placeholder text instead of the real descriptions; a list you load shows the real ones.

To get your list's share link:

1. Open your list on [wg.easyarmy.com](https://wg.easyarmy.com/).
2. Press **View**, then **Output**, then **Lock to Share**.
3. Open **Output** again and copy the **Share link**.

Paste the link, such as `https://wg.easyarmy.com/BoltAction/ViewL/<id>`, and press **Load list**. Any other wg.easyarmy.com link with the list's id in its path works too, such as `https://wg.easyarmy.com/BoltAction/Platoon/<id>/1`, and so does the bare id. The list still has to be locked to share.

EasyArmy does not let browsers read its lists, so the app fetches them on its own server through `GET /api/lists/<id>`. That route accepts only a list id, builds the EasyArmy URLs itself, does not follow redirects, and gives up after 10 seconds. It reads two things:

- the list as JSON (`?ps=1`, capped at 1 MB), for the units and points;
- the PDF at the share link (capped at 5 MB), for the special-rule descriptions, which the JSON does not carry.

If the PDF cannot be read, the list still loads and the rules show their names and pages only.

To go easy on EasyArmy, the server keeps each fetched list in memory with no time limit (one minute when its PDF could not be read, so the descriptions get another try soon), up to 200 lists, and loads of the same list at the same moment share one fetch. A shared list is locked on EasyArmy, and editing it gives it a new link, so a cached copy never goes stale. Fetches from EasyArmy across the whole server are spaced at least 2 seconds apart; a load that would have to queue for more than 10 seconds gets a 429 asking to try again.

## Special rules

The full sheet lists each special rule with its description as EasyArmy prints it, the book and page to read it in, and the units that carry it. Where EasyArmy prints a variant under the same rule, such as "(75mm) HE (2")", it follows the main text.

## Legal

This is an unofficial fan tool, not affiliated with, endorsed by or sponsored by Warlord Games Ltd or EasyArmy. Bolt Action is a trademark of Warlord Games Ltd, and the unit, points and rule content the app shows belongs to them. The site says so in its footer.

The code is released under the [MIT License](LICENSE). The sample list in `features/army-list/fixtures/` is EasyArmy output, with its rule descriptions replaced by placeholder text, and is not covered by that licence. [NOTICE.md](NOTICE.md) lists the trademarks, the privacy position and the open source packages the app ships with; the site serves their full licence texts at `/third-party-licenses.txt`.

## Contributing

[Issues](https://github.com/themetalfleece/baprint/issues) and [pull requests](https://github.com/themetalfleece/baprint/pulls) are welcome. Run the checks below before opening a pull request; they must all pass.

## Checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
