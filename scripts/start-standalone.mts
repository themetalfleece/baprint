import { cp } from "node:fs/promises";

// `next build` leaves the client assets out of the standalone folder; copy them in, then start its server.
const root = new URL("../", import.meta.url);
const standalone = new URL(".next/standalone/", root);

await cp(new URL(".next/static/", root), new URL(".next/static/", standalone), {
  recursive: true,
});
await import(new URL("server.js", standalone).href);
