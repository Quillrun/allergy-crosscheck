// Reads OFF JSON lines on stdin, prints one JSON summary. Run: node --experimental-strip-types measure.mjs
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkProduct } from "../src/engine.ts";
import { ALL_ALLERGENS, FREE_FROM_LABELS, OFF_ALLERGEN_TAGS, TERMS, normalize } from "../src/catalog.ts";

// OLD_ENGINE=<package dir> also runs that engine on every record and counts what the new one drops or weakens.
const OLD = process.env.OLD_ENGINE ? (await import(pathToFileURL(resolve(process.env.OLD_ENGINE, "src/engine.ts")).href)).checkProduct : null;

const MISSING = "ingredient list is missing";
const fam = (a) => (a === "wheat" || a === "gluten" ? "gluten" : a);
const FAMS = [...new Set(ALL_ALLERGENS.map(fam))];
const people = [{ name: "all", allergies: ALL_ALLERGENS }];

// Strict count: only these catalogue terms, fixed before the run (see README). Everything else (flour, oat, malt, wine, nut, shellfish, dishes...) is out.
const W = (s) => s.split(",").map((x) => x.trim());
const STRICT = Object.fromEntries(Object.entries({
  gluten: "wheat, durum, semolina, spelt, kamut, rye, barley, triticale, couscous, bulgur, seitan, gluten, durum wheat, wheat flour, wheat gluten",
  milk: "milk, buttermilk, milk powder, milkfat, butterfat, butter, ghee, cream, sour cream, creme fraiche, cheese, parmesan, parmigiano, pecorino, mozzarella, cheddar, ricotta, feta, mascarpone, gouda, brie, camembert, gruyere, halloumi, paneer, burrata, quark, skyr, whey, casein, caseinate, lactose, lactalbumin, yogurt, yoghurt, kefir",
  egg: "egg, yolk, albumen, ovalbumin, lysozyme",
  soy: "soy, soya, soybean, tofu, edamame, miso, tempeh, soy sauce",
  peanut: "peanut, groundnut",
  tree_nut: "almond, hazelnut, filbert, walnut, cashew, pecan, pistachio, brazil nut, macadamia, tree nut",
  sesame: "sesame, tahini, tahina",
  fish: "fish, salmon, tuna, cod, anchovy, anchovies, sardine, haddock, trout, mackerel, tilapia, halibut, pollock, hake, herring, sea bass, swordfish, snapper, plaice, pangasius, catfish, carp, perch, eel, bonito, codfish, saltfish, barramundi, bacalao, baccala, fish sauce, nam pla",
  crustacean: "shrimp, prawn, crab, lobster, crayfish, crawfish, langoustine, krill, scampi, crustacean",
  mollusc: "clam, mussel, oyster, scallop, squid, calamari, octopus, snail, escargot, cuttlefish, abalone, whelk, cockle, conch, mollusc",
  mustard: "mustard, dijon, mustard seed",
  celery: "celery, celeriac, celery salt, celery seed",
  lupin: "lupin, lupine, lupini",
  sulphites: "sulphite, sulfite, sulphur dioxide, sulfur dioxide, metabisulphite, metabisulfite, bisulphite, bisulfite, e220, e221, e222, e223, e224, e225, e226, e227, e228",
}).map(([f, s]) => [f, new Set(W(s).map(normalize))]));
const CATALOGUE = new Set(TERMS.flatMap((t) => t.terms.map(normalize)));
export const STRICT_NOT_IN_CATALOGUE = Object.entries(STRICT).flatMap(([f, set]) => [...set].filter((t) => !CATALOGUE.has(t)).map((t) => `${f}:${t}`));
const OIL = (t) => new RegExp(`(^| )${t}(s|es)? (oil|oils|flavour|flavours|flavouring|flavourings|flavor|flavors|flavoring|flavorings|extract|extracts|aroma|aromas|essence|essences)( |$)`);
const EXCLUDE = { gluten: /\b(glucose|dextrose|maltodextrin)\b/, fish: /\b(gelatin|gelatine|isinglass)\b/, soy: /\b(tocopherol|sterol|stanol)|glycerides?/, milk: /\bculture/ };
// Round 3: hit-level rules. A hit counts only if at least one occurrence of its term in its source text survives R1-R3.
// "Item" = text between top-level commas/semicolons, brackets ( ) [ ] { } respected.
const CTX_OIL = /\b(oil|oils|fat|fats|shortening|margarine)\b/;
const CTX_ALT = /\band ?\/ ?or\b|\band or\b|\bor\b/;
const CTX_NAT = /naturally occurring in|except for those/;
// foldM is fold with sentence ends kept as "|" (a full stop before whitespace or the end, or a line break); fold is the same text with each "|" a space, so every rule up to R13 reads exactly what it read before.
const foldM = (s) => s.replace(/[|\u200B-\u200D\u2060\uFEFF\u00AD]/g, (c) => (c === "|" ? " " : "")).replace(/\s*(?:\.(?:\s+|$)|\n\s*)/g, "|").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9()\[\]{},;:\/|]+/g, " ").replace(/\be[ |](\d{3,4}[a-z]?)\b/g, "e$1").replace(/ +/g, " ").replace(/ ?\|[ |]*/g, "|");
const fold = (s) => foldM(s).replace(/\|/g, " ");
// Round 4 item-level rules (R7, round 5: flavour/aroma word anywhere in the item). R4b: free-from phrase for the occurrence's family. R5: E220-E228 needs a sulphite word in its item. R6: caramel colour (sulphite ammonia / caustic sulphite).
const FREE_PHRASE = {
  gluten: /\bgluten free\b/, milk: /\b(milk|dairy) free\b/, egg: /\begg free\b/, soy: /\bsoya? free\b/,
  tree_nut: /\bnut free\b/, peanut: /\b(pea)?nut free\b/, sesame: /\bsesame free\b/,
};
const E_SULPHITE = /^e22[0-8][a-z]?$/;
const SULPHITE_WORD = /(sulphite|sulfite|bisulphite|bisulfite|metabisulphite|metabisulfite|sulphur dioxide|sulfur dioxide)(s)?/;
const E_CODE = /(?<![a-z0-9])e22[0-8][a-z]?(?![a-z0-9])/g;
const E_ONLY = /^[\s()\[\]{},;:\/]*$/;
const FLAVOUR = /\b(flavou?r|flavou?ring|aroma)(s)?\b/; // R7
const CARAMEL = /\b(sulphite|sulfite) ammonia\b|\bcaustic (sulphite|sulfite)\b/;
// Round 7. R8: term directly followed by "free". R9: precaution wording in the item. R10a: base-named miso. R10b: substitute wording next to the term.
const FREE_AFTER = /^ ?free(?![a-z0-9])/;
const PRECAUTION = /\bmay (also )?contain\b|\btraces\b|\bcontain traces\b/;
const MISO_BASE = /(chick ?pea|adzuki|azuki|soya? free) $/;
const SUBST_AFTER = /^ ?(replacements?|replacers?|substitutes?|alternatives?|analogues?|analogs?)(?![a-z0-9])/;
const SUBST_BEFORE = /(imitation|non dairy|dairy free) $/;
// Round 8. R11: OCR-damaged "may contain" in the item. R12: term directly followed by a colon (a heading, not an ingredient). fold() keeps ":" for R12; it changes no other rule's reading.
const OCR_PRECAUTION = /\bmay (?:also )?cont[a-z]*/;
const HEADING_AFTER = /^ *:/;
// Round 9. R13: a sulphite term directly preceded by "ferrous" (the iron fortificant, "ferrous sulfite" is a typo for ferrous sulfate).
const FERROUS_BEFORE = /ferrous $/;
// Round 10. R9 (extended): factory wording in the item is a precaution too. R1 (extended): a term followed by a prefix of "oil" ("o", "oi") at the very end of the text is a truncated oil.
const FACTORY = /\bmade in a\b|\bfacility\b|\bfactory\b|\bmanufactured (?:in|on)\b/;
const TRUNCATED_OIL = /^ (?:o|oi) *$/;
// Round 10. R14: a term inside a "contains" declaration is not an ingredient entry. The declaration starts at the word "contains" opening a sentence (up to three label words before it: "allergy advice: contains", "dried contains") or an item, outside brackets, and runs to the end of the sentence. "contains less than 2% of", "contains 2% or less", "contains no", "contains one or more of the following" and "contains only" open ingredient lists, not declarations.
const DECLARATION = /(?:^|[,;|] ?)(?:[a-z0-9]+:? ){0,3}contains\b(?! ?:? ?(?:less|no\b|only|up to|\d|<|one or more|the following))/g;
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let strictUnlocated = 0; // hits whose term could not be found in the folded source text: dropped, and counted
// Items and, per position, the stack of open-bracket positions.
function splitItems(f) {
  const open = { "(": 1, "[": 1, "{": 1 }, close = { ")": 1, "]": 1, "}": 1 };
  const items = [], stacks = []; let start = 0, stack = [];
  for (let i = 0; i < f.length; i++) {
    stacks[i] = stack;
    const c = f[i];
    if (open[c]) stack = [...stack, i];
    else if (close[c]) stack = stack.slice(0, -1);
    else if ((c === "," || c === ";") && !stack.length) { items.push([start, i]); start = i + 1; }
  }
  items.push([start, f.length]);
  return { items, stacks };
}
// R14 helper: is the position inside a "contains" declaration? gM is the folded text with sentence ends as "|".
function inDeclaration(gM, stacks, pos) {
  const start = gM.lastIndexOf("|", pos - 1) + 1;
  for (const m of gM.slice(start, pos).matchAll(DECLARATION)) {
    const at = start + m.index + m[0].length - m[0].match(/contains\b$/)[0].length; // position of "contains"
    if (!(stacks[at] ?? []).length) return true;
  }
  return false;
}
// The engine reports a hit's source as a fragment of the text (e.g. "and celery seed}"), so an item can reach beyond it.
// `full` is the record's whole English text: the fragment is located in it (first match) and each occurrence's item, bracket stack and R1-R7 context are read there.
// Not found: the fragment's own text is used (the pre-round-5 behaviour).
export function survivingOccurrences(source, term, family, full) {
  const f = fold(source), at = [];
  const ff = full ? fold(full) : "", off = ff ? ff.indexOf(f) : -1;
  const g = off >= 0 ? ff : f, base = off >= 0 ? off : 0;
  const gM = off >= 0 ? foldM(full) : foldM(source); // g with sentence ends as "|", same length
  const { items, stacks } = splitItems(g);
  const re = new RegExp(`(?<![a-z0-9])${esc(term)}(?:s|es)?(?![a-z0-9])`, "g");
  for (const m of f.matchAll(re)) at.push([m.index, m[0].length]);
  if (!at.length) { strictUnlocated++; return -1; }
  let n = 0;
  for (const [p, len] of at) {
    const pos = base + p;
    const [a, b] = items.find(([x, y]) => pos >= x && pos < y);
    const item = g.slice(a, b);
    if (CTX_OIL.test(item)) continue; // R1: oil or fat in the item
    if ((stacks[pos] ?? []).some((o) => CTX_OIL.test(g.slice(Math.max(0, g.slice(0, o).search(/[^,;()\[\]{}]*$/)), o)))) continue; // R1: inside brackets whose head names an oil or fat
    if (TRUNCATED_OIL.test(g.slice(pos + len))) continue; // R1: "soybean oi" cut off at the end of the text
    if (CTX_ALT.test(item)) continue; // R2: alternatives
    const nat = item.search(CTX_NAT);
    if (nat >= 0 && pos - a > nat) continue; // R3: after "naturally occurring in" / "except for those"
    if (family && FREE_PHRASE[family]?.test(item)) continue; // R4b: free-from phrase in the item
    if (E_SULPHITE.test(term) && !SULPHITE_WORD.test(item)) { // R5: E-number consistency
      const rest = item.replace(E_CODE, " ").replace(/\b(preservatives?|antioxidants?|e)\b/g, " ");
      if (!E_ONLY.test(rest)) continue;
    }
    if (family === "sulphites" && CARAMEL.test(item)) continue; // R6: caramel colour
    if (FLAVOUR.test(item)) continue; // R7: flavour context
    const after = g.slice(pos + len), before = g.slice(0, pos);
    if (FREE_AFTER.test(after)) continue; // R8: "lactose-free": this occurrence only
    if (PRECAUTION.test(item) || FACTORY.test(item)) continue; // R9: "may contain" / traces / "made in a" / facility / factory / "manufactured in|on" in the item
    if (OCR_PRECAUTION.test(item)) continue; // R11: "may contairi milk" and other OCR-damaged precautions in the item
    if (HEADING_AFTER.test(after)) continue; // R12: "MILK CHOCOLATE EGG:" is a heading: this occurrence only
    if (family === "sulphites" && FERROUS_BEFORE.test(before)) continue; // R13: "ferrous sulfite" is the iron fortificant, not a sulphite
    if (inDeclaration(gM, stacks, pos)) continue; // R14: "Contains: milk, soy." names an allergen but is not an ingredient entry
    if (term === "miso" && MISO_BASE.test(before)) continue; // R10a: chickpea / adzuki / soy-free miso
    if (SUBST_AFTER.test(after) || SUBST_BEFORE.test(before)) continue; // R10b: replacement, substitute, imitation, non-dairy...
    n++;
  }
  return n;
}
const freeFams = (labels) => new Set((labels ?? []).flatMap((l) => (FREE_FROM_LABELS[l] ?? []).map(fam)));
const strictKeep = (h, free = new Set(), full = "") => {
  const f = fam(h.allergen);
  if (!STRICT[f]?.has(h.term)) return false;
  if (free.has(f)) return false; // R4a: the record's labels claim this family free
  const line = normalize(h.source);
  if (OIL(h.term).test(line) || EXCLUDE[f]?.test(line)) return false;
  return survivingOccurrences(h.source, h.term, f, full) > 0; // unlocated (-1) is dropped: the rules cannot vouch for it
};

// Diagnostic: foreign-language allergen words in English text that the engine called clean while OFF's own lists are empty.
const FOREIGN = new Set(W("trigo, hvete, hvetemel, weizen, weizenmehl, tarwe, harina, farine, ble, lait, leche, melk, milch, latte, huevo, huevos, eier, ei, oeuf, oeufs, uovo, soja, soia, cacahuete, cacahuetes, mani, erdnuss, almendra, almendras, avellana, avellanas, noisette, noisettes, haselnuss, haselnusse, nocciole, sesamo, ajonjoli, apio, selleri, sellerie, moutarde, senf, mostaza, sulfitos, solfiti, pescado, poisson, fisk, pesce"));
const FOREIGN_N = 50;
const foreignEx = { all: [], popular: [] };

const KEEP = 5000; // per-family frequency entries kept per shard (merge trims to 200)

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(42);

const cut = () => ({ total: 0, A: 0, allergens_empty: 0, english: 0, B: 0, B_traces_only: 0, B_by_family: {}, strict_unreadable_lists: 0, strict_not_english_or_unparsed: 0, strict_checked: 0, strict_hits_unlocated: 0, strict_named: 0, strict_named_by_family: {}, strict_missed: 0, strict_missed_list_empty: 0, strict_missed_list_partial: 0, strict_missed_by_family: {}, foreign_exposed: 0, ...(OLD ? { compared: 0, vanished: {}, weakened: {}, changed: 0, to_none: 0 } : {}) });
const all = cut(), pop = cut();
const rev = Object.fromEntries(FAMS.map((f) => [f, { count: 0, words: new Map() }]));
const sample = []; let seen = 0;
const SAMPLE_N = 200;
const randS = rng(29), strictSample = []; let strictSeen = 0;
const randC = rng(11), changeSample = []; let changeSeen = 0;
const groups = new Map(); // "family|oldTerm|phrase" -> { n, ex }
const bump = (o, f) => { o[f] = (o[f] ?? 0) + 1; };
const reservoir = (arr, rnd, seenN, rec) => { if (arr.length < SAMPLE_N) arr.push(rec); else { const j = Math.floor(rnd() * seenN); if (j < SAMPLE_N) arr[j] = rec; } };

function tally(c, r) {
  c.total++; if (r.A) c.A++; if (r.aEmpty) c.allergens_empty++;
  if (r.english) { c.english++; }
  if (r.missed.length) {
    c.B++; if (r.tracesOnly) c.B_traces_only++;
    for (const f of r.missed) bump(c.B_by_family, f);
  }
  if (r.foreign) c.foreign_exposed++;
  if (r.strictSkipped) c.strict_not_english_or_unparsed++;
  if (r.strictBadLists) c.strict_unreadable_lists++;
  if (r.strictChecked) c.strict_checked++;
  c.strict_hits_unlocated += r.strictUnlocated;
  if (r.strictFams.length) {
    c.strict_named++; for (const f of r.strictFams) bump(c.strict_named_by_family, f);
    if (r.strictMissed.length) {
      c.strict_missed++; c[r.aEmpty ? "strict_missed_list_empty" : "strict_missed_list_partial"]++;
      for (const f of r.strictMissed) bump(c.strict_missed_by_family, f);
    }
  }
  if (r.cmp) {
    c.compared++;
    for (const f of r.cmp.vanished) bump(c.vanished, f);
    for (const f of r.cmp.weakened) bump(c.weakened, f);
    if (r.cmp.vanished.length || r.cmp.weakened.length) c.changed++;
    if (r.cmp.toNone) c.to_none++;
  }
}

const enTextOf = (row) => (row.ingredients_text_en ?? "").trim();
const hitsIn = (hits, f, kind) => hits.filter((h) => fam(h.allergen) === f && (!kind || h.kind === kind));

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
  // Strict: English text only (no ingredient tags), strict terms only, readable lists only.
  // Round 2: main language English, and OFF parsed the ingredients cleanly (at most 10% unknown).
  const strictSkipped = !!enTextOf(row) && !(row.lang === "en" && row.ingredients_n > 0 && row.unknown_ingredients_n <= 0.1 * row.ingredients_n);
  const unlocated0 = strictUnlocated;
  let strictChecked = false, strictBadLists = false, strictHits = [], strictFams = [], strictMissed = [];
  if (enTextOf(row) && !strictSkipped) {
    if ([...aTags, ...tTags].some((t) => !(t in OFF_ALLERGEN_TAGS))) strictBadLists = true;
    else {
      strictChecked = true;
      const t = checkProduct({ ...row, ingredients_tags: [], ingredients_original_tags: [] }, people);
      strictHits = t.hits.filter((h) => h.kind === "contains" && h.source !== "allergen list" && h.source !== "may contain" && strictKeep(h, freeFams(row.labels_tags), enTextOf(row)));
      strictFams = [...new Set(strictHits.map((h) => fam(h.allergen)))];
      strictMissed = strictFams.filter((f) => !listed.has(f) && !traced.has(f));
    }
  }
  const strictUnlocatedHere = strictUnlocated - unlocated0;
  const enText = (row.ingredients_text_en ?? "").trim();
  const foreign = !!enText && aEmpty && tTags.length === 0 && res.overall === "no_listed_allergens" && normalize(enText).split(" ").some((w) => FOREIGN.has(w));
  let cmp = null;
  if (OLD) {
    const o = OLD(row, people);
    const vanished = [], weakened = [];
    for (const f of FAMS) {
      const oh = hitsIn(o.hits, f), nh = hitsIn(res.hits, f);
      if (oh.length && !nh.length) vanished.push(f);
      if (hitsIn(oh, f, "contains").length && !hitsIn(nh, f, "contains").length) weakened.push(f);
    }
    cmp = { vanished, weakened, toNone: o.overall !== "no_listed_allergens" && res.overall === "no_listed_allergens", old: o.hits };
  }
  return { A, aEmpty, english, foreign, missed, tracesOnly, reverse, derived, strictChecked, strictSkipped, strictBadLists, strictHits, strictFams, strictMissed, strictUnlocated: strictUnlocatedHere, cmp, res };
}

function consume(row) {
  const r = analyse(row);
  tally(all, r);
  const popular = (row.unique_scans_n ?? 0) > 0;
  if (popular) tally(pop, r);
  if (r.foreign) { if (foreignEx.all.length < FOREIGN_N) foreignEx.all.push(row.code); if (popular && foreignEx.popular.length < FOREIGN_N) foreignEx.popular.push(row.code); }
  for (const f of r.reverse) {
    const e = rev[f]; e.count++;
    for (const t of row.ingredients_tags ?? []) if (t.startsWith("en:")) e.words.set(t, (e.words.get(t) ?? 0) + 1);
  }
  if (r.missed.length) {
    seen++;
    reservoir(sample, rand, seen, {
      code: row.code, ingredients_text_en: (row.ingredients_text_en ?? "").slice(0, 400),
      allergens_tags: row.allergens_tags, traces_tags: row.traces_tags, missed: r.missed,
      hit_terms: [...new Set(r.derived.filter((h) => r.missed.includes(fam(h.allergen))).map((h) => `${h.allergen}:${h.term}`))],
    });
  }
  if (r.strictMissed.length) {
    strictSeen++;
    reservoir(strictSample, randS, strictSeen, {
      code: row.code, popular, list_empty: r.aEmpty, ingredients_text_en: row.ingredients_text_en.slice(0, 4000),
      allergens_tags: row.allergens_tags ?? [], traces_tags: row.traces_tags ?? [], labels_tags: row.labels_tags ?? [], missed: r.strictMissed,
      hits: [...new Map(r.strictHits.map((h) => [`${fam(h.allergen)}|${h.term}|${h.source}`, { family: fam(h.allergen), term: h.term, source: h.source }])).values()],
    });
  }
  const c = r.cmp;
  if (c && (c.vanished.length || c.weakened.length)) {
    changeSeen++;
    const fams = [...new Set([...c.vanished, ...c.weakened])];
    for (const f of c.vanished) for (const h of hitsIn(c.old, f)) {
      const k = `${f}|${h.term}|${normalize(h.source).slice(0, 50)}`;
      const g = groups.get(k) ?? { n: 0, ex: [] }; g.n++; if (g.ex.length < 2) g.ex.push(row.code); groups.set(k, g);
    }
    const slim = (hs) => hs.filter((h) => fams.includes(fam(h.allergen))).map((h) => ({ allergen: h.allergen, kind: h.kind, term: h.term, source: h.source.slice(0, 80) }));
    reservoir(changeSample, randC, changeSeen, {
      code: row.code, families: fams.map((f) => `${f}:${c.vanished.includes(f) ? "vanished" : "weakened"}`),
      old_hits: slim(c.old), new_hits: slim(r.res.hits), text: (row.ingredients_text_en ?? "").slice(0, 1000),
    });
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
  const vanished_groups = Object.fromEntries([...groups].sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1)).slice(0, KEEP));
  process.stdout.write(JSON.stringify({ all, popular: pop, reverse, B_seen: seen, sample, foreign_examples: foreignEx, strict_seen: strictSeen, strict_sample: strictSample, change_seen: changeSeen, change_sample: changeSample, vanished_groups, strict_terms_not_in_catalogue: STRICT_NOT_IN_CATALOGUE, seconds: (Date.now() - t0) / 1000 }) + "\n");
}
