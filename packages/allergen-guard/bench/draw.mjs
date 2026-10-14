// The seeded draw of nonelisted-2026-10-13.md (rules in that file). Usage: node draw.mjs <run dir with shards/cand_*.jsonl from nonelisted.mjs>; the hand-check files of rounds 1 to 10 are read from $C.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const D = process.argv[2];
const C = process.env.HOME + "/Library/Caches/allergy-crosscheck";
const SEED = 20261017;
const QUOTA = { milk: 34, peanut_treenut: 33, milk_celery: 33 };
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = mulberry32(SEED);
const shuffle = (arr) => { for (let i = 0; i < arr.length - 1; i++) { const j = i + Math.floor(rng() * (arr.length - i)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
// exclusions: rounds 1-10
const excl = new Set();
const perRun = {};
for (const run of ["run3", "run4", "run5", "run6", "run7", "run9", "run10", "run11", "run12", "run13"]) {
  perRun[run] = new Set();
  for (const f of ["hc_a.json", "hc_b.json"]) for (const r of JSON.parse(readFileSync(`${C}/${run}/${f}`, "utf8"))) { excl.add(String(r.code)); perRun[run].add(String(r.code)); }
}
const recs = new Map();
for (const f of readdirSync(`${D}/shards`).filter((f) => f.startsWith("cand_"))) {
  for (const line of readFileSync(`${D}/shards/${f}`, "utf8").split("\n")) { if (!line) continue; const r = JSON.parse(line); if (!recs.has(r.code)) recs.set(r.code, r); }
}
const stats = { excluded_codes: excl.size, per_run: Object.fromEntries(Object.entries(perRun).map(([k, v]) => [k, v.size])), pools: {}, pools_before_exclusion: {} };
const drawn = new Set(); const sample = [];
for (const p of Object.keys(QUOTA)) {
  const all = [...recs.values()].filter((r) => r.v[p].verdict === "no_listed_allergens");
  const pool = all.filter((r) => !excl.has(r.code)).sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  stats.pools_before_exclusion[p] = all.length; stats.pools[p] = pool.length;
  shuffle(pool);
  let n = 0;
  for (const r of pool) { if (n === QUOTA[p]) break; if (drawn.has(r.code)) continue; drawn.add(r.code); n++; sample.push({ r, p }); }
}
shuffle(sample);
const lines = sample.map(({ r, p }) => JSON.stringify({ code: r.code, profile: p, allergies: { milk: ["milk"], peanut_treenut: ["peanut", "tree_nut"], milk_celery: ["milk", "celery"] }[p], verdict: r.v[p].verdict, reasons: r.v[p].reasons, data_issues: r.v[p].dataIssues, speech: r.v[p].speech, ingredients_text_en: r.ingredients_text_en, allergens_tags: r.allergens_tags, traces_tags: r.traces_tags, labels_tags: r.labels_tags, lang: r.lang }));
writeFileSync(`${D}/sample.jsonl`, lines.join("\n") + "\n");
writeFileSync(`${D}/sample_a.jsonl`, lines.slice(0, 50).join("\n") + "\n");
writeFileSync(`${D}/sample_b.jsonl`, lines.slice(50).join("\n") + "\n");
stats.sample_by_profile = sample.reduce((m, { p }) => ((m[p] = (m[p] || 0) + 1), m), {});
stats.records_with_any_none = recs.size;
writeFileSync(`${D}/draw_stats.json`, JSON.stringify(stats, null, 1));
console.log(JSON.stringify(stats));
