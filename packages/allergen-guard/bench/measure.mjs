// Reads OFF JSON lines on stdin, prints one JSON summary. Run: node --experimental-strip-types measure.mjs
import { createInterface } from "node:readline";
import { checkProduct } from "../src/engine.ts";
import { ALL_ALLERGENS, OFF_ALLERGEN_TAGS } from "../src/catalog.ts";

const MISSING = "ingredient list is missing";
const fam = (a) => (a === "wheat" || a === "gluten" ? "gluten" : a);
const FAMS = [...new Set(ALL_ALLERGENS.map(fam))];
const people = [{ name: "all", allergies: ALL_ALLERGENS }];
const KEEP = 5000; // per-family frequency entries kept per shard (merge trims to 200)

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(42);

const cut = () => ({ total: 0, A: 0, allergens_empty: 0, english: 0, B: 0, B_traces_only: 0, B_by_family: {} });
const all = cut(), pop = cut();
const rev = Object.fromEntries(FAMS.map((f) => [f, { count: 0, words: new Map() }]));
const sample = []; let seen = 0;
const SAMPLE_N = 200;

function tally(c, r) {
  c.total++; if (r.A) c.A++; if (r.aEmpty) c.allergens_empty++;
  if (r.english) { c.english++; }
  if (r.missed.length) {
    c.B++; if (r.tracesOnly) c.B_traces_only++;
    for (const f of r.missed) c.B_by_family[f] = (c.B_by_family[f] ?? 0) + 1;
  }
}

export function analyse(row) {
  const res = checkProduct(row, people);
  const aTags = row.allergens_tags ?? [], tTags = row.traces_tags ?? [];
  const aEmpty = aTags.length === 0;
  const A = aEmpty && tTags.length === 0 && res.dataIssues.some((d) => d.includes(MISSING));
  const english = !!(row.ingredients_text_en ?? "").trim() || (row.ingredients_tags ?? []).some((t) => t.startsWith("en:"));
  const listed = new Set(aTags.flatMap((t) => (OFF_ALLERGEN_TAGS[t] ?? []).map(fam)));
  const traced = new Set(tTags.flatMap((t) => (OFF_ALLERGEN_TAGS[t] ?? []).map(fam)));
  const derived = res.hits.filter((h) => h.kind === "contains" && h.source !== "allergen list" && h.source !== "may contain");
  const derivedFams = new Set(derived.map((h) => fam(h.allergen)));
  const missed = english ? [...derivedFams].filter((f) => !listed.has(f)) : [];
  const tracesOnly = missed.some((f) => traced.has(f));
  const reverse = english ? [...listed].filter((f) => !derivedFams.has(f)) : [];
  return { A, aEmpty, english, missed, tracesOnly, reverse, derived };
}

function consume(row) {
  const r = analyse(row);
  tally(all, r);
  if ((row.unique_scans_n ?? 0) > 0) tally(pop, r);
  for (const f of r.reverse) {
    const e = rev[f]; e.count++;
    for (const t of row.ingredients_tags ?? []) if (t.startsWith("en:")) e.words.set(t, (e.words.get(t) ?? 0) + 1);
  }
  if (r.missed.length) {
    seen++;
    const rec = {
      code: row.code, ingredients_text_en: (row.ingredients_text_en ?? "").slice(0, 400),
      allergens_tags: row.allergens_tags, traces_tags: row.traces_tags, missed: r.missed,
      hit_terms: [...new Set(r.derived.filter((h) => r.missed.includes(fam(h.allergen))).map((h) => `${h.allergen}:${h.term}`))],
    };
    if (sample.length < SAMPLE_N) sample.push(rec);
    else { const j = Math.floor(rand() * seen); if (j < SAMPLE_N) sample[j] = rec; }
  }
}

if (import.meta.main ?? process.argv[1]?.endsWith("measure.mjs")) {
  const t0 = Date.now(); let n = 0;
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    consume(JSON.parse(line));
    if (++n % 100000 === 0) process.stderr.write(`${n} rows, ${Math.round(n / ((Date.now() - t0) / 60000))} rows/min\n`);
  }
  const reverse = {};
  for (const f of FAMS) {
    const top = [...rev[f].words].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, KEEP);
    reverse[f] = { count: rev[f].count, words: Object.fromEntries(top) };
  }
  process.stdout.write(JSON.stringify({ all, popular: pop, reverse, B_seen: seen, sample, seconds: (Date.now() - t0) / 1000 }) + "\n");
}
