import { createInterface } from "node:readline";
import { checkProduct } from "../src/engine.ts";
const profiles = { milk: ["milk"], peanut_treenut: ["peanut", "tree_nut"], milk_celery: ["milk", "celery"] };
const mk = () => ({ unsafe: 0, no_listed_allergens: 0, cannot_confirm: 0 });
const out = { scanned: 0, with_text: 0, no_text: 0, by: {} };
for (const p in profiles) out.by[p] = { with_text: mk(), no_text: mk() };
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  if (!line) continue;
  const row = JSON.parse(line);
  if (!((row.unique_scans_n ?? 0) > 0)) continue;
  out.scanned++;
  const t = !!(row.ingredients_text_en ?? "").trim();
  out[t ? "with_text" : "no_text"]++;
  for (const p in profiles) {
    const r = checkProduct(row, [{ name: p, allergies: profiles[p] }]);
    out.by[p][t ? "with_text" : "no_text"][r.overall]++;
  }
}
process.stdout.write(JSON.stringify(out) + "\n");
