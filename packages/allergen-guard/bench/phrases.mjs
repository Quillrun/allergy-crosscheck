// Reads OFF JSON lines on stdin; counts the phrases behind "contains" hits whose family the label does not list. Run: node --experimental-strip-types phrases.mjs
import { createInterface } from "node:readline";
import { checkProduct } from "../src/engine.ts";
import { ALL_ALLERGENS, OFF_ALLERGEN_TAGS, normalize } from "../src/catalog.ts";

const fam = (a) => (a === "wheat" || a === "gluten" ? "gluten" : a);
const people = [{ name: "all", allergies: ALL_ALLERGENS }];
const text = (t) => t.slice(3).replace(/-/g, " ");

function phrase(src, term) {
  const w = normalize(src).split(" "), t = normalize(term).split(" ");
  for (let i = 0; i + t.length <= w.length; i++) {
    if (t.every((x, j) => w[i + j] === x)) return w.slice(Math.max(0, i - 2), i + t.length + 1).join(" ");
  }
  return normalize(src);
}

const counts = new Map();
const t0 = Date.now(); let n = 0;
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  if (!line) continue;
  const row = JSON.parse(line); n++;
  const res = checkProduct(row, people);
  const listed = new Set([...(row.allergens_tags ?? []), ...(row.traces_tags ?? [])].flatMap((t) => (OFF_ALLERGEN_TAGS[t] ?? []).map(fam)));
  let tags = null; const rowKeys = new Set();
  for (const h of res.hits) {
    if (h.kind !== "contains" || h.source === "allergen list" || h.source === "may contain" || listed.has(fam(h.allergen))) continue;
    tags ??= new Set((row.ingredients_tags ?? []).filter((t) => t.startsWith("en:")).map((t) => normalize(text(t))));
    const origin = tags.has(normalize(h.source)) ? "tag" : "text";
    const key = `${fam(h.allergen)}|${h.term}|${phrase(h.source, h.term)}|${origin}`;
    if (rowKeys.has(key)) continue;
    rowKeys.add(key);
    const e = counts.get(key) ?? { count: 0, codes: [] };
    counts.set(key, e);
    e.count++;
    if (e.codes.length < 2 && !e.codes.includes(row.code)) e.codes.push(row.code);
  }
}
const all = [...counts].map(([k, e]) => { const [family, term, phrase, origin] = k.split("|"); return { family, term, phrase, origin, count: e.count, codes: e.codes }; });
all.sort((a, b) => b.count - a.count || (a.phrase < b.phrase ? -1 : 1));
process.stdout.write(JSON.stringify({ rows: n, top: all.slice(0, 300), flour: all.filter((x) => x.term === "flour").slice(0, 150), seconds: (Date.now() - t0) / 1000 }) + "\n");
