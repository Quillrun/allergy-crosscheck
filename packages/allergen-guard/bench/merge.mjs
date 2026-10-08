// node merge.mjs <outdir> shard_0.json ... -> <outdir>/summary.json, samples.json, strict_sample.json, change_sample.json
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const [outdir, ...files] = process.argv.slice(2);
const shards = files.map((f) => JSON.parse(readFileSync(f, "utf8")));
const addCut = (a, b) => { for (const [k, v] of Object.entries(b)) { if (typeof v === "number") a[k] = (a[k] ?? 0) + v; else { a[k] ??= {}; addCut(a[k], v); } } return a; };
const all = {}, popular = {}, reverse = {}; let B_seen = 0, seconds = 0;
for (const s of shards) {
  addCut(all, s.all); addCut(popular, s.popular); B_seen += s.B_seen; seconds = Math.max(seconds, s.seconds);
  for (const [f, r] of Object.entries(s.reverse)) {
    const e = (reverse[f] ??= { count: 0, words: {} }); e.count += r.count;
    for (const [w, c] of Object.entries(r.words)) e.words[w] = (e.words[w] ?? 0) + c;
  }
}
for (const e of Object.values(reverse)) e.words = Object.fromEntries(Object.entries(e.words).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 200));
// Combine reservoirs: draw each slot from a shard with probability proportional to its remaining qualifying records.
let a = 42; const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const combine = (seenKey, itemsKey) => {
  const pools = shards.map((s) => ({ left: s[seenKey] ?? 0, items: [...(s[itemsKey] ?? [])] }));
  const out = [];
  while (out.length < 200 && pools.some((p) => p.left > 0 && p.items.length)) {
    const tot = pools.reduce((n, p) => n + (p.items.length ? p.left : 0), 0);
    let x = rnd() * tot, p = pools[0];
    for (const q of pools) { if (!q.items.length) continue; if ((x -= q.left) < 0) { p = q; break; } p = q; }
    p.items.splice(Math.floor(rnd() * p.items.length), 1).forEach((i) => out.push(i)); p.left--;
  }
  return out;
};
const samples = combine("B_seen", "sample"), strict_sample = combine("strict_seen", "strict_sample"), change_sample = combine("change_seen", "change_sample");
const sum = (k) => shards.reduce((n, s) => n + (s[k] ?? 0), 0);
const groups = {};
for (const s of shards) for (const [k, g] of Object.entries(s.vanished_groups ?? {})) { const e = (groups[k] ??= { n: 0, ex: [] }); e.n += g.n; for (const c of g.ex) if (e.ex.length < 2 && !e.ex.includes(c)) e.ex.push(c); }
const vanished_groups = Object.fromEntries(Object.entries(groups).sort((x, y) => y[1].n - x[1].n || (x[0] < y[0] ? -1 : 1)).slice(0, 300));
const foreign_examples = { all: shards.flatMap((s) => s.foreign_examples?.all ?? []).slice(0, 50), popular: shards.flatMap((s) => s.foreign_examples?.popular ?? []).slice(0, 50) };
const strict_terms_not_in_catalogue = shards[0]?.strict_terms_not_in_catalogue ?? [];
writeFileSync(join(outdir, "summary.json"), JSON.stringify({ all, popular, reverse, B_seen, strict_seen: sum("strict_seen"), change_seen: sum("change_seen"), foreign_examples, vanished_groups, strict_terms_not_in_catalogue, max_shard_seconds: seconds }, null, 1));
writeFileSync(join(outdir, "samples.json"), JSON.stringify(samples, null, 1));
writeFileSync(join(outdir, "strict_sample.json"), JSON.stringify(strict_sample, null, 1));
writeFileSync(join(outdir, "change_sample.json"), JSON.stringify(change_sample, null, 1));
console.log(JSON.stringify({ all, popular }, null, 1));
