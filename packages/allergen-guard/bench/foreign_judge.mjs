// node --experimental-strip-types foreign_judge.mjs < rows.jsonl [engine package dir, default ..]
// For someone allergic to all 15, counts per matched phrase or language how many rows the engine calls "no listed allergens".
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const dir = resolve(process.argv[2] ?? new URL("..", import.meta.url).pathname);
const { checkProduct } = await import(pathToFileURL(`${dir}/src/engine.ts`).href);
const { ALL_ALLERGENS } = await import(pathToFileURL(`${dir}/src/catalog.ts`).href);
const people = [{ name: "all", allergies: ALL_ALLERGENS }];
const by = {};
let total = 0, open = 0, openScanned = 0;
for (const line of readFileSync(0, "utf8").split("\n")) {
  if (!line) continue;
  const r = JSON.parse(line);
  total++;
  const none = checkProduct(r, people).overall === "no_listed_allergens";
  if (none) { open++; if (r.unique_scans_n > 0) openScanned++; }
  for (const p of r.phrases ?? ["all"]) {
    const b = (by[p] ??= { rows: 0, none: 0, examples: [] });
    b.rows++;
    if (none) { b.none++; if (b.examples.length < 3) b.examples.push(r.code); }
  }
}
console.log(JSON.stringify({ total, none: open, none_scanned: openScanned, by: Object.fromEntries(Object.entries(by).sort((a, b) => b[1].none - a[1].none)) }, null, 1));
