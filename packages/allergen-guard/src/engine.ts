// Fail-closed allergen checks. The engine has three answers and none of them is "safe":
//   unsafe              — a listed allergen, or a "may contain" warning for it
//   cannot_confirm      — the data is missing, ambiguous, or an ingredient often hides the allergen
//   no_listed_allergens — nothing found; the caller still has to check the label

import { ALLERGENS, ALL_ALLERGENS, FILLER_WORDS, FOREIGN_ALLERGEN_WORDS, FREE_FROM_LABELS, GENERIC_CATEGORIES, OFF_ALLERGEN_TAGS, PLAIN_FOODS, TERMS, normalize, resolveAllergies } from "./catalog.ts";
import type { AllergenId, Term } from "./catalog.ts";

export type Verdict = "unsafe" | "cannot_confirm" | "no_listed_allergens";
export type HitKind = "contains" | "may_contain" | "possible";

/** `unknown`: a possible hit because the engine doesn't recognise the word, not because the word is known to hide it. */
export type Hit = { allergen: AllergenId; kind: HitKind; source: string; term: string; unknown?: boolean };
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
// The trailing space is a lookahead, not consumed, so a phrase repeated after a single space ("coconut milk coconut milk") matches both times.
const wordRe = (phrase: string) => new RegExp(`(^| )${/[^aeiou]y$/.test(phrase) ? `${phrase.slice(0, -1)}(?:y|ies|ys)` : `${phrase}(?:s|es)?`}(?= |$)`);
const COMPILED: Compiled[] = TERMS.flatMap((entry) =>
  entry.terms.map((t) => {
    const term = normalize(t);
    return { term, re: wordRe(term), entry, unless: (entry.unless ?? []).map((u) => wordRe(normalize(u))) };
  }),
);

// "cheddar cheese flavour", "prawn cocktail flavour": a named flavour is not the food, but it can contain it.
const FLAVOURED_FOODS: AllergenId[] = ["milk", "crustacean", "fish", "mollusc"];
const ALLERGEN_NAMES = ["crustacean", "crustacea", "mollusc", "mollusk", "cephalopod"]; // "crustaceans flavouring" names the allergen itself
const flavouredRe = (term: string) => new RegExp(`(^| )${term}(s|es)?(?: [a-z0-9]+){0,2} flavou?r(?:ing)?s?(?= |$)`, "g");

const hasSoyFreeMiso = (line: string) => {
  const bracket = /\bmiso\b[^()]*\(([^)]*)\)/i.exec(line)?.[1];
  return bracket !== undefined && !/\b(?:soy|soya|soja|soyabeans?|soybeans?|edamame)\b/i.test(bracket);
};

// Glued spellings ("brazilnuts", "milkpowder", "sesameseeds") are split into the words the catalogue knows before matching, so the terms still apply.
// Only a word that is neither known nor a term word is split, and only into words that are known or in a term; one part must be in a term.
const termWord = (w: string) => TERM_WORDS.has(w) || TERM_WORDS.has(w.replace(/es$/, "")) || TERM_WORDS.has(w.replace(/s$/, "")) || TERM_WORDS.has(w.replace(/ies$/, "y"));
const wordOf = (w: string) => w.length >= 3 && (termWord(w) || (w.length >= 4 && known(w)));
function splitGlued(w: string, depth = 0): string[] | null {
  for (let i = w.length - 3; i >= 3; i--) {
    const [a, b] = [w.slice(0, i), w.slice(i)];
    if (!wordOf(a)) continue;
    const rest = wordOf(b) ? [b] : depth < 2 ? splitGlued(b, depth + 1) : null;
    if (rest && [a, ...rest].some(termWord)) return [a, ...rest];
  }
  return null;
}
const deglue = (text: string) => text.split(" ").map((w) => (w.length >= 6 && /^[a-z]+$/.test(w) && !wordOf(w) ? (splitGlued(w) ?? [w]).join(" ") : w)).join(" ");

/** Find allergen hits in one ingredient line ("2 tbsp tahini", "skimmed milk powder 8.7%"). */
export function scanIngredient(line: string, kind: "contains" | "may_contain" = "contains"): Hit[] {
  // A claim ("Contains no almonds.") belongs to its own sentence: it must not downgrade a hit in the one before it.
  const sentences = line.split(/(?<=[.!?])\s+(?=\S)/);
  if (sentences.length > 1) return dedupe(sentences.flatMap((s) => scanIngredient(s, kind)));
  const text = deglue(normalize(line));
  if (!text) return [];
  const hits: Hit[] = [];
  // An explicit "contains milk" or "(milk)" in the same item keeps the flavour's food a definite hit.
  const stated = /\bcontains?\b/.test(text);
  const bracketed = new Set([...line.matchAll(/\(([^)]*)\)/g)].flatMap((m) => resolveAllergies([m[1]]).ids));
  // "miso (rice, water, salt, koji)": a bracketed composition naming no soy is not soy for sure, but it can still be cross-contaminated.
  const soyFreeMiso = hasSoyFreeMiso(line);
  for (const c of COMPILED) {
    let masked = ` ${text} `;
    for (const u of c.unless) masked = masked.replace(new RegExp(u.source, "g"), "  ");
    if (!c.re.test(masked.trim())) continue;
    const flavour = kind === "contains" && !stated && !ALLERGEN_NAMES.includes(c.term) && !c.re.test(masked.replace(flavouredRe(c.term), " ").trim());
    for (const a of c.entry.contains) {
      const downgrade = (flavour && FLAVOURED_FOODS.includes(a) && !bracketed.has(a)) || (soyFreeMiso && c.term === "miso" && a === "soy" && kind === "contains");
      hits.push({ allergen: a, kind: downgrade ? "possible" : kind, source: line.trim(), term: c.term });
    }
    const possible = c.entry.possible === "all" ? ALL_ALLERGENS : (c.entry.possible ?? []);
    for (const a of possible) hits.push({ allergen: a, kind: "possible", source: line.trim(), term: c.term });
  }
  // "til"/"teel" is sesame in Hindi, and "until" in English ("fry 'til golden"): on its own, it is sesame only as a whole item ("til", "2 tbsp til").
  if (/^(?:\d[a-z0-9]* )*(?:(?:g|kg|oz|lb|tsp|tbsp|cup|cups) )?(?:til|teel)$/.test(text)) hits.push({ allergen: "sesame", kind, source: line.trim(), term: text.split(" ").pop()! });
  // "egg-free mayonnaise", "free from milk": a free-from claim can't be verified here, so "check the label", not "contains".
  // "lactose free milk" is still milk.
  // Also "not from milk", "not derived from milk", "contains no nuts", and the same word in other languages ("sans gluten", "ohne ei").
  const claimed = [...text.matchAll(/\b(?:([a-z]+) free(?! range| (?:from|of)\b)|free (?:from|of) ([a-z]+)|not (?:derived |made )?from ([a-z]+)|(?:sans|sin|senza|ohne|uten|zonder) ([a-z]+)|contains? no ([a-z]+)|(?:does not|do not|doesn t|don t) contain ([a-z]+))\b/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? m[6]).filter((w) => w !== "lactose");
  const freeFrom = new Set(resolveAllergies(claimed).ids);
  // "dairy free chocolate (contains milk)": an explicit "contains X" in the same item beats the free-from wording.
  const explicit = new Set([...text.matchAll(/(?<!\b(?:not|may|might|t) )\bcontains? (?!no\b)((?:[a-z]+ ?){1,4})/g)].flatMap((m) => resolveAllergies(m[1].trim().split(" ")).ids));
  return dedupe(hits.map((h) => (h.kind === "contains" && freeFrom.has(h.allergen) && !explicit.has(h.allergen) ? { ...h, kind: "possible" as const } : h)));
}

const TERM_WORDS = new Set(TERMS.flatMap((t) => [...t.terms, ...(t.unless ?? [])]).flatMap((t) => normalize(t).split(" ")));
const KNOWN = new Set([...PLAIN_FOODS, ...FILLER_WORDS].map((w) => normalize(w)));
const FILLER = new Set(FILLER_WORDS.map((w) => normalize(w)));
const PHRASES = TERMS.flatMap((t) => [...t.terms, ...(t.unless ?? [])])
  .map((t) => normalize(t))
  .sort((a, b) => b.length - a.length) // "sour cream" before "cream"
  .map((t) => wordRe(t));
const TERM_PHRASES = TERMS.filter((t) => t.contains.length).flatMap((t) => t.terms) // allergen terms only: "gluten free" is not a list item
  .map((t) => normalize(t))
  .sort((a, b) => b.length - a.length)
  .map((t) => wordRe(t));
const known = (w: string) => /^\d/.test(w) || KNOWN.has(w) || KNOWN.has(w.replace(/es$/, "")) || KNOWN.has(w.replace(/s$/, "")) || KNOWN.has(w.replace(/ies$/, "y"));

/** Words in an ingredient line that are neither plain foods, allergen terms nor filler ("2 tbsp korma paste" -> ["korma", "paste"]). */
export function unrecognised(line: string): string[] {
  // Words covered by a catalogue phrase ("tikka masala", "coconut milk") are accounted for; a stray part of one ("masala") is not.
  let text = ` ${normalize(line)} `;
  for (const re of PHRASES) text = text.replace(new RegExp(re.source, "g"), "  ");
  return text.split(" ").filter((w) => w && !known(w));
}

// Words of a placeholder where the list should be ("see pack", "ingredients not listed", "n/a").
const PLACEHOLDER = new Set("see refer to label back side packaging package ingredient ingredients not listed available applicable na none unknown tbc tba".split(" "));

/**
 * False for text that is not a list we can read: no word but numbers, single letters and filler ("-", "100%", "n/a"), only placeholder words
 * ("see pack"), or a list whose every word is unknown and that has letters English doesn't use ("Storfekjøtt", "Menthe poivrée").
 * A list of unknown English words ("xylitol", "soursop, ascorbic acid") is left to the other checks.
 */
function readable(text: string): boolean {
  const content: string[] = [];
  const odd = new Set<string>();
  for (const line of splitIngredients(text)) {
    content.push(...normalize(line).split(" ").filter((w) => w.length > 1 && !/^\d+$/.test(w) && !FILLER.has(w)));
    unrecognised(line).forEach((w) => odd.add(w));
  }
  if (!content.length || content.every((w) => PLACEHOLDER.has(w))) return false;
  return content.some((w) => !odd.has(w)) || !/[^\x00-\x7f]/.test(text.replace(/[^\p{L}]/gu, ""));
}

/** The food a line names, without quantities and preparation words ("2 tbsp garam masala" -> "garam masala"). */
const foodName = (line: string) => normalize(line).split(" ").filter((w) => w && !/^\d/.test(w) && !FILLER.has(w)).join(" ");

// UK "Allergy Advice: For allergens, including cereals containing gluten, see ingredients in bold." is a pointer, not an ingredient.
// Only these template words go; any named allergen after "see" stays.
const ADVICE_TEMPLATE = /\bfor allergens,?\s+(?:including\s+cereals\s+containing\s+gluten,?\s+)?see\b(?:\s+ingredients)?(?:\s+in(?:\s+bold(?:\s+type)?)?)?/gi;
const stripAdvice = (text: string) => text.replace(ADVICE_TEMPLATE, " ");

/** Split recipe text into ingredient lines (quantities stay: they don't affect matching). */
export function splitIngredients(input: string | string[]): string[] {
  const parts = Array.isArray(input) ? input : stripAdvice(input).split(/\n|;|,(?![^()]*\))/);
  return parts.map((p) => p.replace(/^[\s\-*•]+/, "").trim()).filter(Boolean);
}

// "may contain traces of nuts", "made in a factory that also handles milk": a warning, not an ingredient.
const PRECAUTION_EN = [
    "may (?:also )?contain", "could contain", "contains traces of", "traces of", "may be present",
    "(?:made|produced|manufactured|packed|processed|prepared) (?:in|at) (?:an? |the |our )?(?:\\w+ ){0,2}(?:factory|facility|site|kitchen|environment) (?:that (?:also )?(?:handles|uses|processes)|(?:also )?(?:handling|using|processing))",
    "made on (?:shared )?equipment", "shares (?:the same )?(?:equipment|facility|production line|line) with", "produced on equipment shared with", "made on a line that also", "processed on shared equipment",
    "(?:made|produced|processed|manufactured) on machinery that also (?:processes|handles)",
    "(?:manufactured|made|produced|processed|packed|packaged) on equipment exposed to",
    "\\b(?:plant|factory|facility|site|line|lines|equipment|premises|bakery|kitchen|environment) (?:that|which|where) (?:also )?(?:processes|handles|uses|manufactures|packs|produces|makes)",
    "\\b(?:plant|factory|facility|site|line|lines|equipment|premises|bakery|kitchen|environment) (?:also )?(?:handling|processing|using)\\b",
    "(?:in|on) the same (?:facility|equipment|line|lines|premises)", "shared (?:equipment|facility|line)", "may also use", "contains one or more of",
];
// The same warnings in other languages: found, but the allergens after them are only read when they are words the catalogue knows.
const PRECAUTION_FOREIGN = [
    "kan inneholde", "kan inneh[aåá]lla", "kan indeholde", "mo[zż]e zawiera[cć]", "mo[zž]e obsahovat", "m[oô][zž]e obsahova[tť]", "gali b[uūü]ti", "pode conter",
    "(?:l[ií]neas?|planta|f[aá]brica) que (?:tambi[eé]n )?(?:procesa|procesan|elabora|elaboran|utiliza|utilizan)", "(?:fabriqu|emball|conditionn)[ée]e? dans un atelier qui",
    "peut contenir", "traces [ée]ventuelles", "traces de", "kann spuren", "spuren von", "kann\\b(?=[^.]*\\benthalten)",
    "pu[òo] contenere", "tracce di", "puede contener", "trazas de", "kan sporen", "sporen van",
    // Found in English-labelled Open Food Facts text, 2026-10-11 (bench/README.md): Czech, Slovak and Polish plurals, Hungarian, Romanian,
    // Finnish, Slovene, Croatian/Serbian, Baltic, Turkish, Dutch, Vietnamese, Indonesian/Malay. Verb-final ones (Hungarian, Turkish) start the
    // warning after the allergens: those are then read as ingredients, which only ever adds a flag.
    "m[ůu][žz]e obsahovat", "mohou obsahovat", "m[ôo][žz]u obsahova[tť]", "mog[ąa] zawiera[cć]", "mo[żz]liwa obecno[śs][cć]",
    "tartalmazhat", "nyomokban", "poate con[țţt]ine", "pot con[țţt]ine", "urme de", "saattaa sis[äa]lt[äa][äa]", "voi sis[äa]lt[äa][äa]",
    "lahko vsebuje", "mo(?:[žz]e|gu) sadr[žz]a(?:va)?ti", "v[õo]ib sisaldada", "var satur[ēe]t", "gali tur[ėeé]ti",
    "i[çc]erebilir", "eser miktarda", "kan\\b(?=[^.]*\\bbevatten)", "(?:gemaakt|geproduceerd|bereid|verpakt) in een (?:\\w+ ){0,2}(?:bedrijf|omgeving|fabriek|ruimte) waar(?:in)?\\b", "c[óo] th[ểe] ch[ứu]a", "(?:dapat|mungkin|boleh) mengandung",
];
const PRECAUTION = new RegExp([...PRECAUTION_EN, ...PRECAUTION_FOREIGN].join("|"), "gi");
const FOREIGN_PRECAUTION = new RegExp(`^(?:${PRECAUTION_FOREIGN.join("|")})`, "i");

// "Not suitable for Nut, Peanut and Sesame allergy sufferers.", "It may not be suitable for those with peanut allergy.", "Allergy advice: Not suitable for customers with an allergy to soya.": a sentence of its own (or the text after an allergy-advice label), only a precaution when it speaks of allergy.
const NOT_SUITABLE = /(?<=^|[.\n]\s*|\ballerg(?:y|en|ens|ic) (?:advice|information|warning|note)\s*:\s*)(?:(?:(?:it|this|this product|the product) )?(?:may|might) not be suitable|not suitable|unsuitable) for\b(?=(?:[^.\n]|\.(?!\s|$))*\ballerg(?:y|ic|ies)\b)/gi;
// Words that only dress up a warning ("may contain traces of other nuts", "not suitable for nut allergy sufferers"): not an item to place.
const WARNING_WORDS = /\b(?:trace amounts?|traces?|amounts?|other|following|all|any|products?|ingredients?|allerg(?:y|ies|ic|ens?)|sufferers?|customers?|people|persons?|anyone|those|who|are|is|handled|present|that|which|where|also|processe[sd]|handles|uses|manufactures|packs|produces|makes|cross contamination|contaminat(?:ed|ion))\b/gi;
const SENTENCE_END = /\.(?=\s|$)|\n/;

/** True for a sentence made only of allergen terms joined by spaces, commas, "and", "or", "&" ("egg peanuts and nuts"). */
function onlyAllergenTerms(sentence: string): boolean {
  if (!scanIngredient(sentence, "may_contain").length) return false;
  let rest = ` ${normalize(sentence)} `;
  for (const re of TERM_PHRASES) rest = rest.replace(new RegExp(re.source, "g"), "  ");
  return rest.split(" ").every((w) => !w || w === "and" || w === "or" || w === "&");
}

/** Split label text into the ingredients and the precautionary statements ("may contain …") in it. */
function splitPrecautions(text: string): { ingredients: string; warnings: string[] } {
  const warnings: string[] = [];
  let ingredients = "";
  let at = 0;
  const found = [...text.matchAll(PRECAUTION), ...text.matchAll(NOT_SUITABLE)].sort((a, b) => a.index - b.index);
  for (const m of found) {
    if (m.index < at) continue;
    let end = text.length, next = end;
    if (/\bsuitable\b/i.test(m[0])) {
      const stop = SENTENCE_END.exec(text.slice(m.index));
      if (stop) { end = m.index + stop.index; next = end + stop[0].length; }
    } else {
      let base = 0;
      for (const c of text.slice(0, m.index)) base += c === "(" ? 1 : c === ")" ? -1 : 0;
      let depth = base;
      for (let i = m.index; i < text.length; i++) {
        const c = text[i];
        if (c === "(") depth++;
        else if (c === ")" && --depth < base) { end = next = i; break; }
        else if (c === "." && depth <= base && !(/\d/.test(text[i - 1] ?? "") && /\d/.test(text[i + 1] ?? ""))) { end = i; next = i + 1; break; }
      }
    }
    // A stray full stop can cut the list ("May contain traces of gluten. egg peanuts and nuts."): a next sentence of only allergen terms belongs to it.
    if (text[end] === "." && next === end + 1) {
      const tail = /^\s*([^.()]+)(?:\.|$)/.exec(text.slice(next));
      if (tail && onlyAllergenTerms(tail[1])) {
        end = next + tail[0].replace(/\.$/, "").length;
        next += tail[0].length;
      }
    }
    ingredients += end === next ? `${text.slice(at, m.index)} ` : `${text.slice(at, m.index).replace(/[\s.]+$/, "")}, `;
    warnings.push(text.slice(m.index, end));
    at = next;
  }
  return { ingredients: ingredients + text.slice(at), warnings };
}

/** True when the text has a letter from a script this catalogue can't read (CJK, Cyrillic, Arabic, Greek…). The micro sign is a unit, not a letter. */
const NON_LATIN = /(?![µμ])(?!\p{Script=Latin})\p{L}/u;
const unreadable = (text: string) => NON_LATIN.test(text.normalize("NFKD"));

export function checkIngredients(input: string | string[], people: Person[]): CheckResult & { lines: { text: string; hits: Hit[] }[] } {
  const lines = splitIngredients(input).map((text) => {
    const hits = scanIngredient(text);
    const odd = unrecognised(text);
    // A line that normalises to nothing ("—", "牛奶") or holds letters we can't read is not "no allergens found": it is unread.
    if (!normalize(text) || unreadable(text)) odd.push(text.trim());
    // A word the engine doesn't know could be anything: it blocks "none listed" for everyone.
    if (odd.length) for (const a of ALL_ALLERGENS) hits.push({ allergen: a, kind: "possible", source: text.trim(), term: foodName(text) || text.trim(), unknown: true });
    return { text, hits };
  });
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
  /** The label's own ingredients; `ingredients_tags` adds their parent categories. */
  ingredients_original_tags?: string[];
  ingredients_text_en?: string;
  ingredients_text?: string;
  labels_tags?: string[];
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
    else ALL_ALLERGENS.forEach((a) => hits.push({ allergen: a, kind: "possible", source: "allergen list", term: tag, unknown: true }));
  }
  for (const tag of product.traces_tags ?? []) {
    const ids = OFF_ALLERGEN_TAGS[tag];
    if (ids) ids.forEach((a) => hits.push({ allergen: a, kind: "may_contain", source: "may contain", term: tag }));
    else ALL_ALLERGENS.forEach((a) => hits.push({ allergen: a, kind: "possible", source: "may contain", term: tag, unknown: true }));
  }
  const english = stripAdvice(product.ingredients_text_en ?? "").trim();
  const original = product.ingredients_original_tags?.length ? product.ingredients_original_tags : undefined;
  const labelTags = original ?? product.ingredients_tags ?? [];
  const enTags = [...new Set([...(product.ingredients_tags ?? []), ...(original ?? [])])].filter((t) => t.startsWith("en:"));
  const taxonomy = enTags
    .filter((t) => !original || original.includes(t) || !GENERIC_CATEGORIES.has(t.slice(3).replace(/-/g, " ")))
    .map((t) => t.slice(3).replace(/-/g, " "));
  const { ingredients, warnings } = splitPrecautions(english);
  // "-", "n/a", "see pack", "100%", or a whole list in another language: text with no word the catalogue knows is not a clean list.
  if (english && !readable(ingredients)) dataIssues.push("I couldn't read the ingredient list.");
  const claimed = new Set((product.labels_tags ?? []).flatMap((t) => FREE_FROM_LABELS[t] ?? []));
  const fromLabel: Hit[] = [];
  splitIngredients(ingredients).forEach((l) => fromLabel.push(...scanIngredient(l)));
  taxonomy.forEach((t) => fromLabel.push(...scanIngredient(t)));
  hits.push(...fromLabel.map((h) => (h.kind === "contains" && claimed.has(h.allergen) ? { ...h, kind: "possible" as const } : h)));
  // A warning in another language that names nothing we can read ("Kann Spuren von Nüssen enthalten") is not a clean one.
  let unreadWarning = false;
  for (const w of warnings) {
    const found = splitIngredients(w).flatMap((l) => scanIngredient(l, "may_contain"));
    hits.push(...found);
    if (!found.length && FOREIGN_PRECAUTION.test(w)) unreadWarning = true;
    // An English warning is read word by word too: "may contain Brazilnuts" names something we can't place, which is not "nothing".
    else if (!FOREIGN_PRECAUTION.test(w) && unrecognised(w.replace(PRECAUTION, " ").replace(NOT_SUITABLE, " ").replace(WARNING_WORDS, " ")).length) unreadWarning = true;
  }
  if (!english && enTags.length === 0) {
    dataIssues.push(
      (product.ingredients_text ?? "").trim()
        ? "The ingredient list isn't available in English, so I can't read it."
        : "The ingredient list is missing from the product data.",
    );
  } else if (!english && labelTags.some((t) => !t.startsWith("en:"))) {
    dataIssues.push("Part of the ingredient list isn't in English, so I can't read it.");
  } else if (english && (unreadable(english) || unreadWarning || normalize(english).split(" ").some((w) => FOREIGN_ALLERGEN_WORDS.has(w)))) {
    dataIssues.push("Part of the ingredient list isn't in English, so I can't read it.");
  }
  return evaluate(dedupe(hits), people, dataIssues);
}

/** Turn hits into a verdict per person. Any data issue blocks a "no listed allergens" answer. */
export function evaluate(hits: Hit[], people: Person[], dataIssues: string[] = []): CheckResult {
  const templates = new Map<string, string>(); // name -> speech with NAME in place of the name
  const results = people.map((p): PersonResult => {
    const mine = hits.filter((h) => p.allergies.includes(h.allergen));
    const contains = mine.filter((h) => h.kind === "contains");
    const mayContain = mine.filter((h) => h.kind === "may_contain" && !contains.some((c) => c.allergen === h.allergen));
    const possible = mine.filter((h) => h.kind === "possible");
    const reasons: string[] = [
      ...[...new Set(contains.map((h) => h.allergen))].map((a) => `Contains ${ALLERGENS[a].spoken}: ${unique(contains.filter((h) => h.allergen === a).map((h) => h.source)).join(", ")}`),
      ...mayContain.map((h) => `May contain ${ALLERGENS[h.allergen].spoken}`),
      ...possible.map((h) => (h.unknown ? `I don't know what's in ${isTag(h) ? heard(h) : `"${h.term}"`}` : selfNamed(h) ? `The wording about ${ALLERGENS[h.allergen].spoken} is unclear` : `${cap(h.term)} can contain ${ALLERGENS[h.allergen].spoken}`)),
      ...(contains.length || mayContain.length || possible.length ? [] : dataIssues),
    ];
    let verdict: Verdict = "no_listed_allergens";
    if (contains.length || mayContain.length) verdict = "unsafe";
    else if (possible.length || dataIssues.length) verdict = "cannot_confirm";
    const template = speak({ ...p, name: NAME }, verdict, contains, mayContain, possible, dataIssues);
    templates.set(p.name, template);
    return { name: p.name, verdict, reasons: unique(reasons), speech: template.replace(NAME, p.name) };
  });
  const overall = results.reduce<Verdict>((v, r) => worst(v, r.verdict), "no_listed_allergens");
  const ordered = [...results].sort((a, b) => RANK[b.verdict] - RANK[a.verdict]);
  const speech = people.length === 0
    ? "Nobody's allergies are saved yet, so I have nothing to check against. Tell me who's eating and what they're allergic to."
    : merged(ordered, templates);
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
    const hiding = possible.filter((h) => !h.unknown && !selfNamed(h));
    const named = possible.filter((h) => !h.unknown && selfNamed(h));
    const odd = unique(possible.filter((h) => h.unknown).map(heard)).slice(0, 2);
    const parts = [
      ...(hiding.length ? [`${join(unique(hiding.map((h) => h.term)).slice(0, 2))} can contain ${list(hiding)}`] : []),
      ...(named.length ? [`the wording about ${list(named)} is unclear`] : []),
      ...(odd.length ? [`I don't know what's in ${join(odd)}`] : []),
    ];
    const why = parts.length
      ? parts.join(", and ")
      : (issues[0] ?? "the data is incomplete").replace(/\.$/, "").replace(/^(?!I\b)./, (c) => c.toLowerCase()); // "I couldn't …" keeps its capital
    return `I can't confirm this is OK for ${p.name}: ${why}. Treat it as unsafe and check the label.`;
  }
  return `Nothing listed for ${p.name}'s allergies, but check the label.`;
}

// People who would hear the same sentence share it: "…OK for Maya and Leo: …", said once.
const NAME = "\u0000";
function merged(ordered: PersonResult[], templates: Map<string, string>): string {
  const groups = new Map<string, string[]>();
  for (const r of ordered) {
    const t = templates.get(r.name) ?? r.speech;
    groups.set(t, [...(groups.get(t) ?? []), r.name]);
  }
  return [...groups].map(([t, names]) => t.replace(NAME, join(names))).join(" ");
}

/** What an unknown hit is called aloud: a database tag ("fr:lait") is never read out raw. */
const isTag = (h: Hit) => h.source === "allergen list" || h.source === "may contain";
const heard = (h: Hit) => (isTag(h) ? "an unrecognised allergen label" : h.term);

/** A possible hit whose term already names the allergen ("egg" for egg, after "egg-free"): "egg can contain egg" says nothing. */
const selfNamed = (h: Hit) => resolveAllergies([h.term]).ids.includes(h.allergen);

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
