// Fail-closed allergen checks. The engine has three answers and none of them is "safe":
//   unsafe              — a listed allergen, or a "may contain" warning for it
//   cannot_confirm      — the data is missing, ambiguous, or an ingredient often hides the allergen
//   no_listed_allergens — nothing found; the caller still has to check the label

import { ALLERGENS, ALL_ALLERGENS, OFF_ALLERGEN_TAGS, TERMS, normalize } from "./catalog.ts";
import type { AllergenId, Term } from "./catalog.ts";

export type Verdict = "unsafe" | "cannot_confirm" | "no_listed_allergens";
export type HitKind = "contains" | "may_contain" | "possible";

export type Hit = { allergen: AllergenId; kind: HitKind; source: string; term: string };
export type Person = { name: string; allergies: AllergenId[] };
export type PersonResult = { name: string; verdict: Verdict; reasons: string[]; speech: string };
export type CheckResult = {
  overall: Verdict;
  people: PersonResult[];
  hits: Hit[];
  dataIssues: string[];
  speech: string;
};

const RANK: Record<Verdict, number> = { no_listed_allergens: 0, cannot_confirm: 1, unsafe: 2 };
export const worst = (a: Verdict, b: Verdict): Verdict => (RANK[a] >= RANK[b] ? a : b);

type Compiled = { term: string; re: RegExp; entry: Term; unless: RegExp[] };
const wordRe = (phrase: string) => new RegExp(`(^| )${phrase.split(" ").join(" ")}(s|es)?( |$)`);
const COMPILED: Compiled[] = TERMS.flatMap((entry) =>
  entry.terms.map((t) => {
    const term = normalize(t);
    return { term, re: wordRe(term), entry, unless: (entry.unless ?? []).map((u) => wordRe(normalize(u))) };
  }),
);

/** Find allergen hits in one ingredient line ("2 tbsp tahini", "skimmed milk powder 8.7%"). */
export function scanIngredient(line: string, kind: "contains" | "may_contain" = "contains"): Hit[] {
  const text = normalize(line);
  if (!text) return [];
  const hits: Hit[] = [];
  for (const c of COMPILED) {
    let masked = ` ${text} `;
    for (const u of c.unless) masked = masked.replace(new RegExp(u.source, "g"), "  ");
    if (!c.re.test(masked.trim())) continue;
    for (const a of c.entry.contains) hits.push({ allergen: a, kind, source: line.trim(), term: c.term });
    const possible = c.entry.possible === "all" ? ALL_ALLERGENS : (c.entry.possible ?? []);
    for (const a of possible) hits.push({ allergen: a, kind: "possible", source: line.trim(), term: c.term });
  }
  return dedupe(hits);
}

/** Split recipe text into ingredient lines (quantities stay: they don't affect matching). */
export function splitIngredients(input: string | string[]): string[] {
  const parts = Array.isArray(input) ? input : input.split(/\n|;|,(?![^()]*\))/);
  return parts.map((p) => p.replace(/^[\s\-*•]+/, "").trim()).filter(Boolean);
}

export function checkIngredients(input: string | string[], people: Person[]): CheckResult & { lines: { text: string; hits: Hit[] }[] } {
  const lines = splitIngredients(input).map((text) => ({ text, hits: scanIngredient(text) }));
  const dataIssues = lines.length === 0 ? ["No ingredients were given, so nothing could be checked."] : [];
  const result = evaluate(lines.flatMap((l) => l.hits), people, dataIssues);
  return { ...result, lines };
}

/** The fields this engine reads from an Open Food Facts product record. */
export type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  allergens_tags?: string[];
  traces_tags?: string[];
  ingredients_tags?: string[];
  ingredients_text_en?: string;
  ingredients_text?: string;
};

/**
 * Check a packaged product. Allergen tags are not trusted on their own: real records
 * omit allergens that the ingredient list plainly contains, so the English ingredient
 * text and the language-neutral ingredient taxonomy are scanned too.
 */
export function checkProduct(product: OffProduct | null, people: Person[], lookupError?: string): CheckResult {
  const dataIssues: string[] = [];
  const hits: Hit[] = [];
  if (!product) {
    dataIssues.push(lookupError ? `The product lookup failed (${lookupError}).` : "The product wasn't found in the database.");
    return evaluate(hits, people, dataIssues);
  }
  for (const tag of product.allergens_tags ?? []) {
    const ids = OFF_ALLERGEN_TAGS[tag];
    if (ids) ids.forEach((a) => hits.push({ allergen: a, kind: "contains", source: "allergen list", term: tag }));
    else ALL_ALLERGENS.forEach((a) => hits.push({ allergen: a, kind: "possible", source: "allergen list", term: tag }));
  }
  for (const tag of product.traces_tags ?? []) {
    const ids = OFF_ALLERGEN_TAGS[tag];
    if (ids) ids.forEach((a) => hits.push({ allergen: a, kind: "may_contain", source: "may contain", term: tag }));
    else ALL_ALLERGENS.forEach((a) => hits.push({ allergen: a, kind: "possible", source: "may contain", term: tag }));
  }
  const english = (product.ingredients_text_en ?? "").trim();
  const taxonomy = (product.ingredients_tags ?? []).filter((t) => t.startsWith("en:")).map((t) => t.slice(3).replace(/-/g, " "));
  if (english) splitIngredients(english).forEach((l) => hits.push(...scanIngredient(l)));
  taxonomy.forEach((t) => hits.push(...scanIngredient(t)));
  if (!english && taxonomy.length === 0) {
    dataIssues.push(
      (product.ingredients_text ?? "").trim()
        ? "The ingredient list isn't available in English, so I can't read it."
        : "The ingredient list is missing from the product data.",
    );
  }
  return evaluate(dedupe(hits), people, dataIssues);
}

/** Turn hits into a verdict per person. Any data issue blocks a "no listed allergens" answer. */
export function evaluate(hits: Hit[], people: Person[], dataIssues: string[] = []): CheckResult {
  const results = people.map((p): PersonResult => {
    const mine = hits.filter((h) => p.allergies.includes(h.allergen));
    const contains = mine.filter((h) => h.kind === "contains");
    const mayContain = mine.filter((h) => h.kind === "may_contain" && !contains.some((c) => c.allergen === h.allergen));
    const possible = mine.filter((h) => h.kind === "possible");
    const reasons: string[] = [
      ...[...new Set(contains.map((h) => h.allergen))].map((a) => `Contains ${ALLERGENS[a].spoken}: ${unique(contains.filter((h) => h.allergen === a).map((h) => h.source)).join(", ")}`),
      ...mayContain.map((h) => `May contain ${ALLERGENS[h.allergen].spoken}`),
      ...possible.map((h) => `${cap(h.term)} can contain ${ALLERGENS[h.allergen].spoken}`),
      ...(contains.length || mayContain.length || possible.length ? [] : dataIssues),
    ];
    let verdict: Verdict = "no_listed_allergens";
    if (contains.length || mayContain.length) verdict = "unsafe";
    else if (possible.length || dataIssues.length) verdict = "cannot_confirm";
    return { name: p.name, verdict, reasons: unique(reasons), speech: speak(p, verdict, contains, mayContain, possible, dataIssues) };
  });
  const overall = results.reduce<Verdict>((v, r) => worst(v, r.verdict), "no_listed_allergens");
  const ordered = [...results].sort((a, b) => RANK[b.verdict] - RANK[a.verdict]);
  const speech = people.length === 0
    ? "Nobody's allergies are saved yet, so I have nothing to check against. Tell me who's eating and what they're allergic to."
    : ordered.map((r) => r.speech).join(" ");
  return { overall: people.length === 0 ? "cannot_confirm" : overall, people: results, hits, dataIssues, speech };
}

function speak(p: Person, verdict: Verdict, contains: Hit[], may: Hit[], possible: Hit[], issues: string[]): string {
  const list = (hs: Hit[]) => join(unique(hs.map((h) => ALLERGENS[h.allergen].spoken)));
  if (verdict === "unsafe") {
    const parts: string[] = [];
    const terms = unique(contains.filter((h) => h.source !== "allergen list").map((h) => h.term));
    const where = terms.filter((t) => !terms.some((o) => o !== t && o.includes(t))).slice(0, 3);
    if (contains.length) parts.push(`it contains ${list(contains)}${where.length ? `, in the ${join(where)}` : ""}`);
    if (may.length) parts.push(`it may contain ${list(may)}`);
    return `${p.name} should avoid this: ${parts.join(", and ")}.`;
  }
  if (verdict === "cannot_confirm") {
    const why = possible.length
      ? `${join(unique(possible.map((h) => h.term)).slice(0, 2))} can contain ${list(possible)}`
      : (issues[0] ?? "the data is incomplete").replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase());
    return `I can't confirm this is OK for ${p.name}: ${why}. Treat it as unsafe and check the label.`;
  }
  return `I didn't find ${join(p.allergies.map((a) => ALLERGENS[a].spoken))} listed for ${p.name}, but data can be wrong, so check the label.`;
}

const unique = <T,>(xs: T[]) => [...new Set(xs)];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const join = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
function dedupe(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const k = `${h.allergen}|${h.kind}|${h.source}|${h.term}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
}
