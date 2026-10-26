# Notices

## Unofficial fan tool

baprint is an unofficial fan tool. It is not affiliated with, endorsed by or sponsored by Warlord Games Ltd or EasyArmy.

Bolt Action and Warlord Games are trademarks of Warlord Games Ltd. EasyArmy is a trademark of its owner. All other trademarks belong to their owners. The names are used only to say which lists the app reads.

## Game content

Unit names, points, weapon stats and special rule text belong to Warlord Games Ltd. The app reads them from EasyArmy each time a list is loaded and shows them unchanged, with the book and page to read each rule in. It stores none of it. You need the Bolt Action rulebooks to play.

The sample list in `features/army-list/fixtures/` (`easyarmy-sample-list.json` and `easyarmy-sample-list.pdf`) is EasyArmy output. The special-rule descriptions in the PDF have been replaced with placeholder text; the unit names, points and stats are unchanged. That content belongs to Warlord Games, and the EasyArmy logo in the PDF belongs to EasyArmy. Neither is covered by this repository's MIT licence.

## Privacy

The app has no accounts, cookies, analytics or storage. When you load a list, the server fetches it from EasyArmy using the list id you give it and returns it to your browser. Nothing is kept after the response.

## Third-party software

The app is built on these packages. Each keeps its own licence. The site serves the full licence texts and exact versions of every package it ships, including the ones these pull in, at `/third-party-licenses.txt`, built from the installed packages.

| Package                                                    | Licence    | Copyright                           |
| ---------------------------------------------------------- | ---------- | ----------------------------------- |
| [Next.js](https://github.com/vercel/next.js)               | MIT        | Vercel, Inc.                        |
| [React](https://github.com/facebook/react) and React DOM   | MIT        | Meta Platforms, Inc. and affiliates |
| [PDF.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist`) | Apache-2.0 | Mozilla Foundation                  |
| [clsx](https://github.com/lukeed/clsx)                     | MIT        | Luke Edwards                        |
| [server-only](https://www.npmjs.com/package/server-only)   | MIT        | Vercel, Inc.                        |

Development tools (Biome, TypeScript, Vitest, Vite) are not shipped with the app. Nor is sharp: the app does not use `next/image`, so `next.config.ts` keeps it out of the server build.
