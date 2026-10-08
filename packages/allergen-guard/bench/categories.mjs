// Reads OFF JSON lines on stdin; for each category-only `en:` tag (in ingredients_tags, not on the label) counts the allergens it would add. Run: node --experimental-strip-types categories.mjs
import { createInterface } from "node:readline";
import { scanIngredient, splitIngredients } from "../src/engine.ts";
import { OFF_ALLERGEN_TAGS } from "../src/catalog.ts";

const TOP = 40;
const text = (t) => t.slice(3).replace(/-/g, " ");
const cache = new Map();
const scan = (t) => { let h = cache.get(t); if (!h) cache.set(t, (h = scanIngredient(text(t)))); return h; };

const cats = new Map();
let rows = 0, withOriginal = 0;

function consume(row) {
  rows++;
  const label = new Set(row.ingredients_original_tags ?? []);
  if (label.size === 0) return;
  withOriginal++;
  const only = [...new Set((row.ingredients_tags ?? []).filter((t) => t.startsWith("en:") && !label.has(t)))];
  if (only.length === 0) return;
  const given = new Set();
  for (const tag of [...(row.allergens_tags ?? []), ...(row.traces_tags ?? [])]) for (const a of OFF_ALLERGEN_TAGS[tag] ?? []) given.add(a);
  for (const l of splitIngredients(row.ingredients_text_en ?? "")) for (const h of scanIngredient(l)) given.add(h.allergen);
  for (const t of label) if (t.startsWith("en:")) for (const h of scan(t)) given.add(h.allergen);
  for (const t of only) {
    const c = cats.get(t) ?? { tag: t, records: 0, adds_contains: 0, adds_possible: 0, allergens: {}, examples: [] };
    cats.set(t, c);
    c.records++;
    const added = new Map();
    for (const h of scan(t)) if (!given.has(h.allergen) && added.get(h.allergen) !== "contains") added.set(h.allergen, h.kind);
    if (added.size === 0) continue;
    if ([...added.values()].includes("contains")) c.adds_contains++; else c.adds_possible++;
    for (const a of added.keys()) c.allergens[a] = (c.allergens[a] ?? 0) + 1;
    if (c.examples.length < 3) c.examples.push({ code: row.code, label: [...label].slice(0, 8) });
  }
}

const t0 = Date.now(); let n = 0;
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  if (!line) continue;
  consume(JSON.parse(line));
  if (++n % 100000 === 0) process.stderr.write(`${n} rows\n`);
}
const categories = [...cats.values()].filter((c) => c.adds_contains + c.adds_possible > 0)
  .sort((a, b) => b.adds_contains + b.adds_possible - (a.adds_contains + a.adds_possible)).slice(0, TOP);
process.stdout.write(JSON.stringify({ rows, with_original: withOriginal, categories, seconds: (Date.now() - t0) / 1000 }) + "\n");
