// Reads OFF JSON lines (off_rows.py) on stdin. Base = unique_scans_n > 0 and non-empty English text.
// Counts verdicts per profile; writes (to argv[2]) one JSON line per base record where at least one profile is "no_listed_allergens".
import { createInterface } from "node:readline";
import { createWriteStream } from "node:fs";
import { checkProduct } from "../src/engine.ts";
const profiles = { milk: ["milk"], peanut_treenut: ["peanut", "tree_nut"], milk_celery: ["milk", "celery"] };
const out = { base: 0, scanned: 0, by: {} };
for (const p in profiles) out.by[p] = { unsafe: 0, no_listed_allergens: 0, cannot_confirm: 0 };
const ws = createWriteStream(process.argv[2]);
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  if (!line) continue;
  const row = JSON.parse(line);
  if (!((row.unique_scans_n ?? 0) > 0)) continue;
  out.scanned++;
  if (!(row.ingredients_text_en ?? "").trim()) continue;
  out.base++;
  const v = {};
  let any = false;
  for (const p in profiles) {
    const r = checkProduct(row, [{ name: "Guest", allergies: profiles[p] }]);
    out.by[p][r.overall]++;
    v[p] = { verdict: r.overall, reasons: r.people[0].reasons, speech: r.people[0].speech, dataIssues: r.dataIssues };
    if (r.overall === "no_listed_allergens") any = true;
  }
  if (any) ws.write(JSON.stringify({ code: row.code, ingredients_text_en: row.ingredients_text_en, allergens_tags: row.allergens_tags, traces_tags: row.traces_tags, labels_tags: row.labels_tags, lang: row.lang, unique_scans_n: row.unique_scans_n, v }) + "\n");
}
await new Promise((r) => ws.end(r));
process.stdout.write(JSON.stringify(out) + "\n");
