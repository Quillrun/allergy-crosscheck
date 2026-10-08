import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_ALLERGENS, checkIngredients, checkProduct, resolveAllergies, scanIngredient, suggestSwaps } from "../src/index.ts";
import type { AllergenId, Person } from "../src/index.ts";

const person = (name: string, ...allergies: AllergenId[]): Person => ({ name, allergies });
const verdict = (ingredient: string, ...allergies: AllergenId[]) => checkIngredients([ingredient], [person("X", ...allergies)]).people[0].verdict;

// The one property that matters: a dangerous ingredient is never waved through.
const MUST_NOT_PASS: [string, AllergenId][] = [
  ["2 tbsp peanut butter", "peanut"], ["satay sauce", "peanut"], ["groundnut oil", "peanut"],
  ["pine nuts", "tree_nut"], ["pesto", "tree_nut"], ["marzipan", "tree_nut"], ["mixed nuts", "tree_nut"], ["mixed nuts", "peanut"],
  ["400ml Creme Fraiche", "milk"], ["50g Parmesan Cheese", "milk"], ["ghee", "milk"], ["whey protein", "milk"], ["butter", "milk"], ["Crème fraîche", "milk"],
  ["mayonnaise", "egg"], ["2 eggs", "egg"], ["meringue", "egg"], ["fresh pasta", "egg"],
  ["500g Lasagne Sheets", "wheat"], ["plain flour", "wheat"], ["soy sauce", "wheat"], ["couscous", "gluten"], ["oats", "gluten"], ["malt vinegar", "gluten"], ["doughnut", "gluten"],
  ["tofu", "soy"], ["soya lecithin", "soy"], ["lecithin", "soy"], ["miso paste", "soy"],
  ["2 tbsp tahini", "sesame"], ["hummus", "sesame"], ["za'atar", "sesame"],
  ["Worcestershire sauce", "fish"], ["fish sauce", "fish"], ["anchovies", "fish"],
  ["king prawns", "crustacean"], ["shellfish stock", "mollusc"], ["oyster sauce", "mollusc"],
  ["1 Stick Celery", "celery"], ["chicken stock", "celery"], ["dijon", "mustard"], ["lupin flour", "lupin"], ["red wine", "sulphites"],
  ["curry paste", "peanut"], ["dark chocolate", "milk"], ["granola", "tree_nut"], ["BBQ sauce", "mustard"],
  ["amaretto", "tree_nut"], ["amaretti biscuits", "tree_nut"], ["macarons", "tree_nut"], ["baklava", "tree_nut"], ["romesco sauce", "tree_nut"], ["rye bread", "wheat"], ["rye bread", "gluten"],
];

test("dangerous ingredients never come back as 'no listed allergens'", () => {
  for (const [ingredient, allergen] of MUST_NOT_PASS) {
    assert.notEqual(verdict(ingredient, allergen), "no_listed_allergens", `${ingredient} passed for ${allergen}`);
  }
});

test("look-alikes are not flagged", () => {
  const all = ALL_ALLERGENS;
  for (const harmless of ["butter beans", "coconut milk", "nutmeg", "oyster mushrooms", "eggplant", "rice flour", "coconut", "cream of tartar", "butternut squash", "basil leaves", "olive oil"]) {
    assert.equal(verdict(harmless, ...all), "no_listed_allergens", harmless);
  }
});

test("definite hits are unsafe; hidden-allergen ingredients are cannot_confirm", () => {
  assert.equal(verdict("peanuts", "peanut"), "unsafe");
  assert.equal(verdict("chocolate", "milk"), "cannot_confirm");
  assert.equal(verdict("vegetable stock", "celery"), "cannot_confirm");
});

test("an empty ingredient list cannot be confirmed", () => {
  assert.equal(checkIngredients([], [person("X", "milk")]).overall, "cannot_confirm");
});

test("nobody saved means nothing can be confirmed", () => {
  const r = checkIngredients(["peanuts"], []);
  assert.equal(r.overall, "cannot_confirm");
  assert.match(r.speech, /Nobody's allergies are saved/);
});

test("never says the word 'safe' as a positive verdict", () => {
  const r = checkIngredients(["tomato", "basil"], [person("Maya", "peanut")]);
  assert.equal(r.overall, "no_listed_allergens");
  assert.doesNotMatch(r.speech, /\bis safe\b|\bsafe to eat\b|\bit's safe\b/i);
  assert.match(r.speech, /check the label/);
});

test("lasagne: per-person verdicts and a household-aware swap list", () => {
  const people = [person("Maya", "peanut", "tree_nut"), person("Leo", "milk", "celery")];
  const lasagne = ["1 tblsp Olive Oil", "1 Stick Celery", "500g Minced Beef", "500g Lasagne Sheets", "400ml Creme Fraiche", "125g Mozzarella Balls", "50g Parmesan Cheese"];
  const r = checkIngredients(lasagne, people);
  assert.equal(r.overall, "unsafe");
  assert.equal(r.people.find((p) => p.name === "Maya")?.verdict, "no_listed_allergens");
  assert.equal(r.people.find((p) => p.name === "Leo")?.verdict, "unsafe");
  const swaps = suggestSwaps(r.lines, people);
  assert.deepEqual(swaps.map((s) => s.replace), ["1 Stick Celery", "400ml Creme Fraiche", "125g Mozzarella Balls", "50g Parmesan Cheese"]);
  const mozzarella = swaps.find((s) => s.replace.includes("Mozzarella"));
  // Dairy-free cheese is often cashew-based; Maya can't have tree nuts, so it must not be offered.
  assert.ok(mozzarella?.options.every((o) => !/dairy-free cheese/.test(o)));
  assert.deepEqual(mozzarella?.options, ["Leave it out (no swap fits everyone)"]);
});

test("swaps never introduce another person's allergen", () => {
  const people = [person("A", "milk"), person("B", "gluten"), person("C", "soy")];
  const r = checkIngredients(["milk"], people);
  const options = suggestSwaps(r.lines, people)[0].options;
  assert.ok(!options.includes("oat milk"), "oat milk has gluten");
  assert.ok(!options.includes("soya milk"), "soya milk has soy");
  assert.ok(options.includes("rice milk"));
});

test("a check for one person never offers a swap that trips someone else in the household", () => {
  const leo = person("Leo", "milk"), maya = person("Maya", "tree_nut");
  const lines = checkIngredients(["125g mozzarella"], [leo]).lines;
  // Dairy-free cheese is often cashew-based: fine for Leo alone, not in a house with Maya.
  assert.ok(suggestSwaps(lines, [leo])[0].options.some((o) => /dairy-free cheese/.test(o)));
  assert.deepEqual(suggestSwaps(lines, [leo], [leo, maya])[0].options, ["Leave it out (no swap fits everyone)"]);
});

test("swaps are never relatives or hidden sources of the allergen they replace", () => {
  const optionsFor = (line: string, ...people: Person[]) => suggestSwaps(checkIngredients([line], people).lines, people)[0].options;
  // Fennel shares celery's plant family, horseradish and wasabi share mustard's: known cross-reactions.
  const celery = optionsFor("1 stick celery", person("Leo", "celery"));
  assert.ok(celery.every((o) => !/fennel|celeriac|parsley|lovage|carrot|dill|anise/i.test(o)), celery.join(", "));
  const mustard = optionsFor("1 tsp mustard", person("Ana", "mustard"));
  assert.ok(mustard.every((o) => !/horseradish|wasabi|rapeseed|canola/i.test(o)), mustard.join(", "));
  // Anything sold as gluten-free may contain nut or lupin flour, so it isn't offered when someone can't have them.
  assert.deepEqual(optionsFor("200g plain flour", person("Bea", "gluten"), person("Tom", "tree_nut")), ["rice flour"]);
  assert.deepEqual(optionsFor("200g plain flour", person("Bea", "gluten")), ["rice flour", "certified gluten-free flour blend (check its label)"]);
});

test("product: allergen tags are not trusted alone (real chocolate hazelnut spread record omits milk and soy)", () => {
  const spread = {
    code: "3017624010701",
    product_name: "chocolate hazelnut spread",
    allergens_tags: ["en:nuts"],
    traces_tags: [],
    ingredients_text_en: "sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin",
  };
  const r = checkProduct(spread, [person("Leo", "milk"), person("Sam", "soy")]);
  assert.equal(r.people.find((p) => p.name === "Leo")?.verdict, "unsafe");
  assert.equal(r.people.find((p) => p.name === "Sam")?.verdict, "unsafe");
});

test("product: 'may contain' is unsafe", () => {
  const r = checkProduct({ product_name: "Biscuits", allergens_tags: [], traces_tags: ["en:peanuts"], ingredients_text_en: "rice flour, sugar" }, [person("Maya", "peanut")]);
  assert.equal(r.overall, "unsafe");
  assert.match(r.speech, /may contain peanuts/);
});

test("product: missing or non-English ingredients cannot be confirmed", () => {
  const people = [person("Maya", "peanut")];
  assert.equal(checkProduct({ product_name: "chocolate hazelnut spread" }, people).overall, "cannot_confirm");
  const french = checkProduct({ product_name: "Biscuit", allergens_tags: [], ingredients_text: "farine de blé, sucre" }, people);
  assert.equal(french.overall, "cannot_confirm");
  assert.match(french.speech, /isn't available in English/);
});

test("product: lookup failures and unknown products cannot be confirmed", () => {
  const people = [person("Maya", "peanut")];
  assert.equal(checkProduct(null, people, "the food database timed out").overall, "cannot_confirm");
  assert.equal(checkProduct(null, people).overall, "cannot_confirm");
});

test("product: an unrecognised allergen tag blocks a clean answer", () => {
  const r = checkProduct({ product_name: "X", allergens_tags: ["en:something-new"], ingredients_text_en: "water" }, [person("Maya", "peanut")]);
  assert.equal(r.overall, "cannot_confirm");
});

test("resolveAllergies maps everyday words and reports unknown ones", () => {
  assert.deepEqual(resolveAllergies(["dairy", "shellfish"]).ids.sort(), ["crustacean", "milk", "mollusc"]);
  assert.deepEqual(resolveAllergies(["kiwi"]).unknown, ["kiwi"]);
  assert.deepEqual(resolveAllergies(["Tree Nuts"]).ids, ["tree_nut"]);
});

test("scanIngredient keeps the source line for explanations", () => {
  const hits = scanIngredient("2 tbsp tahini");
  assert.equal(hits[0].source, "2 tbsp tahini");
  assert.equal(hits[0].allergen, "sesame");
});

test("people who would hear the same sentence hear it once", () => {
  const people: Person[] = [
    { name: "Maya", allergies: ["peanut"] },
    { name: "Leo", allergies: ["milk"] },
  ];
  const r = checkProduct({ code: "1", product_name: "Mystery" }, people);
  assert.equal(r.overall, "cannot_confirm");
  assert.equal(r.speech, "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data. Treat it as unsafe and check the label.");
  assert.match(r.people[1].speech, /^I can't confirm this is OK for Leo:/);
});

test("defined sauces don't get the generic 'sauce can hide anything' warning", () => {
  const people: Person[] = [{ name: "Zed", allergies: ["milk", "celery", "peanut"] }];
  assert.equal(checkIngredients(["2 tbsp fish sauce", "1 tbsp soy sauce"], people).overall, "no_listed_allergens");
});

test("allergies the way people say them", () => {
  const cases: [string, AllergenId[]][] = [
    ["seafood", ["fish", "crustacean", "mollusc"]], ["lactose intolerant", ["milk"]], ["cow's milk", ["milk"]], ["casein", ["milk"]],
    ["gluten intolerant", ["gluten"]], ["gluten-free", ["gluten"]], ["egg whites", ["egg"]], ["sesame seeds", ["sesame"]],
    ["sulphur dioxide", ["sulphites"]], ["pine nuts", ["tree_nut"]], ["shell fish", ["crustacean", "mollusc"]],
    ["nut allergy", ["tree_nut", "peanut"]], ["peanuts and tree nuts", ["peanut", "tree_nut"]], ["dairy, eggs", ["milk", "egg"]], ["Crème fraîche", []],
  ];
  for (const [said, ids] of cases) {
    const r = resolveAllergies([said]);
    if (ids.length) assert.deepEqual(r.ids.sort(), [...ids].sort(), said);
    else assert.deepEqual(r.unknown, [said], said);
  }
  assert.deepEqual(resolveAllergies(["coconut"]).unknown, ["coconut"]); // not tracked: refused out loud, never dropped
});

test("a word it doesn't recognise means 'can't confirm', never 'none listed'", () => {
  const maya: Person[] = [{ name: "Maya", allergies: ["peanut"] }];
  for (const dish of ["chicken korma", "2 tbsp garam masala", "brioche bun", "paella", "1 tsp harissa", "zorblax"]) {
    assert.notEqual(checkIngredients([dish], maya).overall, "no_listed_allergens", dish);
  }
  const r = checkIngredients(["2 tsp garam masala"], maya);
  assert.match(r.speech, /I don't know what's in garam masala/);
  // plain recipes stay plain
  assert.equal(checkIngredients(["1 tblsp Olive Oil", "1 finely chopped Onion", "500g Minced Beef", "800g Chopped Tomatoes", "Topping Basil Leaves", "1 banana"], maya).overall, "no_listed_allergens");
});

test("words found missing by a run over Open Food Facts are caught", () => {
  // bench/: products listing these allergens whose ingredient words the engine didn't recognise
  for (const [word, a] of [["gluten", "gluten"], ["milkfat", "milk"], ["butterfat", "milk"],
    ["cereals containing gluten", "gluten"], ["natural crustaceans flavouring", "crustacean"]] as [string, AllergenId][])
    assert.equal(verdict(word, a), "unsafe", word);
  assert.equal(verdict("emulsifier (e322)", "soy"), "cannot_confirm");
  assert.equal(verdict("gluten free oats", "gluten"), "cannot_confirm");
});

test("a free-from claim is 'check the label', not 'contains'", () => {
  const sam: Person[] = [{ name: "Sam", allergies: ["egg", "milk"] }];
  const r = checkIngredients(["egg-free mayonnaise", "dairy free butter"], sam);
  assert.equal(r.overall, "cannot_confirm");
});

test("look-alike characters can't sneak an allergen past", () => {
  const leo: Person[] = [{ name: "Leo", allergies: ["milk"] }];
  for (const tricky of ["Ｍｉｌｋ", "m\u200Bilk", "MILK", "Crème fraîche"]) assert.equal(checkIngredients([tricky], leo).overall, "unsafe", tricky);
  assert.equal(checkIngredients(["water chestnuts"], [{ name: "T", allergies: ["tree_nut"] }]).overall, "no_listed_allergens");
});

const off = (tags: string[], original?: string[], extra: object = {}) => ({ product_name: "X", allergens_tags: [], traces_tags: [], ingredients_tags: tags, ingredients_original_tags: original, ...extra });
const hit = (tags: string[], original: string[] | undefined, a: AllergenId) => checkProduct(off(tags, original), [person("X", a)]).hits.some((h) => h.allergen === a && h.kind === "contains");

test("product: a parent category OFF adds to a label ingredient is not read as the ingredient", () => {
  const rice = off(["en:rice-flour", "en:flour", "en:rice"], ["en:rice-flour"]);
  for (const a of ["wheat", "gluten"] as const) assert.equal(hit(rice.ingredients_tags, rice.ingredients_original_tags, a), false, a);
  assert.equal(checkProduct(rice, [person("Bea", "wheat")]).overall, "no_listed_allergens");
  assert.equal(hit(["en:flour"], ["en:flour"], "wheat"), true); // the label says flour
});

test("product: nut categories split into the label's own nut", () => {
  const peanut = off(["en:peanut", "en:nut"], ["en:peanut"]);
  const people = [person("Maya", "peanut"), person("Leo", "tree_nut")];
  const r = checkProduct(peanut, people);
  assert.equal(r.people[0].verdict, "unsafe");
  assert.notEqual(r.people[1].verdict, "unsafe");
  assert.equal(hit(["en:peanut", "en:nut"], ["en:peanut"], "tree_nut"), false);
  assert.equal(hit(["en:hazelnut", "en:tree-nut", "en:nut"], ["en:hazelnut"], "tree_nut"), true);
});

test("product: a specific category still catches a label ingredient the catalogue doesn't know", () => {
  // Synthetic: "mystery grain" is not in the catalogue, its parent category "durum wheat" is.
  assert.equal(scanIngredient("mystery grain").length, 0);
  assert.ok(scanIngredient("durum wheat").some((h) => h.allergen === "wheat"));
  assert.equal(hit(["en:mystery-grain", "en:durum-wheat"], ["en:mystery-grain"], "wheat"), true);
});

test("product: without the label's own tags every category is read (fail-closed fallback)", () => {
  assert.equal(hit(["en:rice-flour", "en:flour"], undefined, "wheat"), true);
});

test("product: ingredients OFF couldn't read in English cannot be confirmed", () => {
  const partial = ["en:sugar", "fr:pate-de-truc"];
  const r = checkProduct(off(partial, partial), [person("Maya", "peanut")]);
  assert.equal(r.overall, "cannot_confirm");
  assert.deepEqual(r.dataIssues, ["Part of the ingredient list isn't in English, so I can't read it."]);
  const withText = checkProduct(off(partial, partial, { ingredients_text_en: "sugar, salt" }), [person("Maya", "peanut")]);
  assert.deepEqual(withText.dataIssues, []);
  assert.equal(withText.overall, "no_listed_allergens");
});

const hitsFor = (text: string, a: AllergenId) => checkProduct(off([], undefined, { ingredients_text_en: text }), [person("X", a)]).hits.filter((h) => h.allergen === a);

test("product: 'tree nuts' is a tree nut, not a possible peanut; 'nuts' alone still is", () => {
  assert.ok(hitsFor("tree nuts", "tree_nut").some((h) => h.kind === "contains"));
  assert.equal(hitsFor("tree nuts", "peanut").length, 0);
  assert.ok(hitsFor("nuts", "peanut").length > 0);
});

test("product: an empty original-ingredients list is treated as absent", () => {
  assert.equal(hit(["en:rice-flour", "en:flour"], [], "wheat"), true);
});

test("product: a generic category is read when the label itself names it, not when OFF adds it", () => {
  const flavoured = (tags: string[], original: string[]) => checkProduct(off(tags, original), [person("X", "peanut")]).hits.some((h) => h.term === "flavouring");
  assert.equal(flavoured(["en:flavouring"], ["en:flavouring"]), true);
  assert.equal(flavoured(["en:vanilla", "en:flavouring"], ["en:vanilla"]), false);
});

const text = (t: string, extra: object = {}) => off([], undefined, { ingredients_text_en: t, ...extra });
const kinds = (t: string, a: AllergenId, extra: object = {}) => [...new Set(checkProduct(text(t, extra), [person("X", a)]).hits.filter((h) => h.allergen === a).map((h) => h.kind))].sort();

test("product: precautionary statements are 'may contain', not ingredients", () => {
  const t = "sugar, milk powder. May contain traces of peanuts, hazelnuts.";
  assert.deepEqual(kinds(t, "milk"), ["contains"]);
  assert.deepEqual(kinds(t, "peanut"), ["may_contain"]);
  assert.deepEqual(kinds(t, "tree_nut"), ["may_contain"]);
  assert.ok(kinds("vegetable oil (may contain soybean, canola), salt", "soy").includes("may_contain")); // plus the oil's own "possible"
  assert.ok(!kinds("vegetable oil (may contain soybean, canola), salt", "soy").includes("contains"));
  assert.deepEqual(kinds("Contains: milk, soy.", "milk"), ["contains"]);
  assert.deepEqual(kinds("Contains: milk, soy.", "soy"), ["contains"]);
  assert.deepEqual(kinds("flour. Made in a factory that also handles milk and eggs. Sugar 1.5%", "egg"), ["may_contain"]);
  assert.deepEqual(kinds("sugar, cocoa (min. 2.5%), peut contenir des traces de lait", "milk"), ["may_contain"]);
  assert.deepEqual(kinds("cocoa, kann Spuren von Haselnüssen enthalten, salt", "tree_nut"), []);
  assert.equal(checkProduct(text("sugar. May contain milk."), [person("X", "milk")]).overall, "unsafe");
});

test("a free-from claim also reads 'free from' and 'free of'; lactose-free milk is still milk", () => {
  assert.deepEqual(scanIngredient("free from milk").filter((h) => h.allergen === "milk").map((h) => h.kind), ["possible"]);
  assert.deepEqual(scanIngredient("free of milk").filter((h) => h.allergen === "milk").map((h) => h.kind), ["possible"]);
  assert.deepEqual(scanIngredient("lactose free milk").filter((h) => h.allergen === "milk").map((h) => h.kind), ["contains", "contains"]); // via the terms "milk" and "lactose"
  assert.ok(scanIngredient("dairy free chocolate").every((h) => h.kind !== "contains"));
});

test("E-numbers are one token however they are written", () => {
  for (const e of ["E-220", "E 223", "e220", "Antioxidant (E-223)"]) assert.equal(verdict(e, "sulphites"), "unsafe", e);
  assert.equal(verdict("vitamin e", "sulphites"), "cannot_confirm"); // unrecognised word, as before
  assert.equal(verdict("1 tbsp olive oil", "sulphites"), "no_listed_allergens");
});

test("product: OFF's 'shellfish' category does not add molluscs to a shrimp", () => {
  const tags = ["en:shrimp", "en:crustacean", "en:shellfish"];
  assert.equal(hit(tags, ["en:shrimp"], "crustacean"), true);
  assert.equal(hit(tags, ["en:shrimp"], "mollusc"), false);
  assert.equal(hit(["en:shellfish"], ["en:shellfish"], "mollusc"), true);
  assert.equal(hit(["en:shellfish"], ["en:shellfish"], "crustacean"), true);
  assert.deepEqual(kinds("shellfish", "mollusc"), ["contains"]);
  assert.deepEqual(kinds("shellfish", "crustacean"), ["contains"]);
});

test("product: a free-from label turns an ingredient hit into 'check the label', never the allergen list", () => {
  const claim = (labels: string[], t: string, a: AllergenId, extra: object = {}) => checkProduct(text(t, { labels_tags: labels, ...extra }), [person("X", a)]);
  const vegan = claim(["en:vegan"], "whey", "milk");
  assert.equal(vegan.overall, "cannot_confirm");
  assert.ok(vegan.hits.every((h) => h.kind !== "contains"));
  assert.equal(claim(["en:vegan"], "water", "milk", { allergens_tags: ["en:milk"] }).overall, "unsafe");
  assert.equal(claim(["en:vegan"], "water", "milk", { traces_tags: ["en:milk"] }).overall, "unsafe");
  assert.equal(claim(["en:no-gluten"], "oats", "gluten").overall, "cannot_confirm");
  assert.equal(claim(["en:no-gluten"], "wheat flour", "wheat").overall, "unsafe");
  assert.equal(claim(["en:no-lactose"], "milk", "milk").overall, "unsafe");
  assert.equal(claim(["en:vegan"], "whey", "soy").overall, "no_listed_allergens");
});

test("product: OFF allergen ids for foods this engine doesn't track hide nothing, unknown ones still block", () => {
  const tagged = (tags: string[], a: AllergenId) => checkProduct({ product_name: "X", allergens_tags: tags, ingredients_text_en: "pork, salt" }, [person("X", a)]).overall;
  assert.equal(tagged(["en:pork"], "milk"), "no_listed_allergens");
  assert.equal(tagged(["en:none"], "peanut"), "no_listed_allergens");
  assert.equal(tagged(["fr:lait soja lactose"], "milk"), "cannot_confirm");
  assert.equal(tagged(["en:red-caviar"], "fish"), "unsafe");
});

// Ambiguous or non-wheat words found by ranking false hits over Open Food Facts; each real allergen still fires.
const scanKinds = (t: string) => Object.fromEntries(scanIngredient(t).map((h) => [h.allergen, h.kind]));
test("scan: flours that are not wheat keep their own allergen, plain flour stays wheat", () => {
  assert.deepEqual(scanKinds("carob seed flour"), {});
  assert.deepEqual(scanKinds("flour treatment agent"), {});
  assert.equal(scanKinds("rye flour").gluten, "contains");
  assert.equal(scanKinds("rye flour").wheat, undefined);
  assert.equal(scanKinds("peanut flour").peanut, "contains");
  assert.equal(scanKinds("peanut flour").wheat, undefined);
  assert.equal(scanKinds("mustard flour").mustard, "contains");
  assert.equal(scanKinds("mustard flour").wheat, undefined);
  assert.equal(scanKinds("chestnut flour").tree_nut, "contains");
  assert.equal(scanKinds("chestnut flour").wheat, undefined);
  assert.equal(scanKinds("flour").wheat, "contains");
  assert.equal(scanKinds("wheat flour").wheat, "contains");
});

test("scan: phrases that name no allergen are cleared, the real ones are not", () => {
  assert.equal(scanKinds("nutmeg nut").tree_nut, undefined);
  assert.equal(scanKinds("chestnut mushroom").tree_nut, undefined);
  assert.equal(scanKinds("rice bran").gluten, undefined);
  assert.equal(scanKinds("oat bran").gluten, "contains");
  assert.equal(scanKinds("tart cherry").wheat, undefined);
  assert.equal(scanKinds("apple tart").wheat, "contains");
  assert.equal(scanKinds("milk thistle").milk, undefined);
  assert.equal(scanKinds("coconut butter").milk, undefined);
  assert.equal(scanKinds("rice semolina").wheat, undefined);
  assert.equal(scanKinds("semolina").wheat, "contains");
});

test("scan: butter flavour and mocha are 'possible' milk, butter is not", () => {
  assert.equal(scanKinds("natural butter flavor").milk, "possible");
  assert.equal(scanKinds("butter").milk, "contains");
  assert.equal(scanKinds("mocha").milk, "possible");
});

test("scan: English spellings and Latin names that were missed", () => {
  const cases: [string, AllergenId][] = [
    ["crustacea", "crustacean"], ["molluscs", "mollusc"], ["cephalopods", "mollusc"], ["wheatflour", "wheat"], ["soyabean", "soy"],
    ["treenuts", "tree_nut"], ["chesnuts", "tree_nut"], ["salmo salar", "fish"], ["sodium bisulfite", "sulphites"],
  ];
  for (const [t, a] of cases) assert.equal(scanKinds(t)[a], "contains", t);
});

// Round 2: systematic false hits and missed warnings found by hand-checking the strict count.
test("product: more precautionary wordings are 'may contain'", () => {
  assert.deepEqual(kinds("flour, sugar. Made in a plant that also processes soy.", "soy"), ["may_contain"]);
  assert.deepEqual(kinds("rice. Packed in a factory that processes wheat", "wheat"), ["may_contain"]);
  assert.deepEqual(kinds("sugar, salt. MAY ALSO USE EGG", "egg"), ["may_contain"]);
  assert.deepEqual(kinds("sugar, salt. Produced on the same equipment as milk.", "milk"), ["may_contain"]);
  assert.ok(kinds("vegetable oil (contains one or more of: canola, soybean)", "soy").includes("may_contain"));
  assert.ok(!kinds("vegetable oil (contains one or more of: canola, soybean)", "soy").includes("contains"));
  assert.ok(kinds("sukker. Kan inneholde spor av soya.", "soy").includes("may_contain"));
  assert.ok(!kinds("sukker. Kan inneholde spor av soya.", "soy").includes("contains"));
  assert.ok(kinds("cukr. Może zawierać soja.", "soy").includes("may_contain"));
});

test("scan: 'not from', 'not derived from' and foreign 'without' claims weaken the hit, they never remove it", () => {
  assert.deepEqual(scanIngredient("lactic acid culture [not from milk]").filter((h) => h.allergen === "milk").map((h) => h.kind), ["possible"]);
  assert.deepEqual(scanIngredient("not derived from egg").filter((h) => h.allergen === "egg").map((h) => h.kind), ["possible"]);
  assert.deepEqual(scanIngredient("not made from wheat").filter((h) => h.allergen === "wheat").map((h) => h.kind), ["possible"]);
  assert.ok(scanIngredient("sans gluten").filter((h) => h.allergen === "gluten").every((h) => h.kind === "possible"));
  assert.ok(scanIngredient("sans gluten").some((h) => h.allergen === "gluten"));
  assert.ok(scanIngredient("ohne milch").some((h) => h.allergen === "milk" && h.kind === "contains")); // "milch" isn't a claim word, so it stays a hit
  assert.equal(scanKinds("sans lactose milk").milk, "contains");
});

test("scan: round-2 catalogue exceptions clear the phrase and nothing else", () => {
  assert.equal(scanKinds("corn gluten").gluten, undefined);
  assert.equal(scanKinds("maize gluten").gluten, undefined);
  assert.equal(scanKinds("wheat gluten").gluten, "contains");
  assert.equal(scanKinds("gluten").gluten, "contains");
  assert.equal(scanKinds("egg roll").egg, "possible");
  assert.equal(scanKinds("egg roll").gluten, "possible");
  assert.equal(scanKinds("egg yolk").egg, "contains");
  assert.equal(scanKinds("sulphite ammonia caramel").sulphites, "possible");
  assert.equal(scanKinds("caustic sulfite caramel").sulphites, "possible");
  assert.equal(scanKinds("sodium sulphite").sulphites, "contains");
  assert.equal(scanKinds("yoghurt culture").milk, "possible");
  assert.equal(scanKinds("kefir culture").milk, "possible");
  assert.equal(scanKinds("cheese culture").milk, "possible");
  assert.equal(scanKinds("yogurt alternative").milk, "possible");
  assert.equal(scanKinds("yogurt").milk, "contains");
  assert.equal(scanKinds("parkii butter").milk, undefined);
  assert.equal(scanKinds("butyrospermum parkii butter").milk, undefined);
  assert.equal(scanKinds("butter").milk, "contains");
  assert.equal(scanKinds("crabmeat").crustacean, "contains");
});

test("scan: nut, seed and cocoa butters are not dairy, and nut butters keep their nut", () => {
  const list = "hazelnut butter, organic almond butter, organic cocoa butter";
  assert.equal(scanKinds(list).milk, undefined);
  assert.equal(scanKinds(list).tree_nut, "contains");
  for (const b of ["nut butter", "almond butter", "hazelnut butter", "cashew butter", "pecan butter", "pistachio butter", "walnut butter", "macadamia butter", "brazil nut butter", "sunflower butter", "sunflower seed butter", "seed butter", "pumpkin seed butter", "sesame butter", "soy butter", "soynut butter", "cocoa butter", "cacao butter", "apple butter", "fruit butter"]) {
    assert.equal(scanKinds(b).milk, undefined, b);
  }
  assert.equal(scanKinds("hazelnut butter").tree_nut, "contains");
  assert.equal(scanKinds("cashew butter").tree_nut, "contains");
  assert.equal(scanKinds("sesame butter").sesame, "contains");
  assert.equal(scanKinds("peanut butter").peanut, "contains");
  assert.equal(scanKinds("peanut butter").milk, undefined);
  assert.equal(scanKinds("butter").milk, "contains");
  assert.equal(scanKinds("cocoa butter, butter").milk, "contains");
  assert.equal(scanKinds("cocoa butter butter").milk, "contains");
});

test("product: 'produced in an environment that handles' is a precaution, not an ingredient", () => {
  assert.deepEqual(kinds("Produced in an environment that handles peanuts.", "peanut"), ["may_contain"]);
  assert.deepEqual(kinds("rice. Packed in an environment that also processes peanuts", "peanut"), ["may_contain"]);
  assert.deepEqual(kinds("rice. Prepared in a kitchen that also handles peanuts.", "peanut"), ["may_contain"]);
  const t = "Ingredients: peanuts. Produced in an environment that handles milk.";
  assert.deepEqual(kinds(t, "peanut"), ["contains"]);
  assert.deepEqual(kinds(t, "milk"), ["may_contain"]);
});

test("scan: hydrolyzed vegetable protein with no source may be gluten, wheat or soy", () => {
  for (const t of ["hydrolyzed vegetable protein", "hydrolysed vegetable protein", "hydrolyzed plant protein", "hydrolysed plant protein", "hvp"]) {
    const k = scanKinds(t);
    assert.equal(k.gluten, "possible", t);
    assert.equal(k.wheat, "possible", t);
    assert.equal(k.soy, "possible", t);
  }
  assert.equal(scanKinds("hydrolyzed wheat protein").wheat, "contains");
  assert.equal(scanKinds("hydrolyzed soy protein").soy, "contains");
  assert.equal(scanKinds("hydrolyzed corn gluten").gluten, undefined);
  assert.equal(scanKinds("hydrolyzed vegetable protein hydrolyzed corn gluten").gluten, "possible");
});

test("scan: Latin (INCI) names read like the English ones", () => {
  for (const n of ["prunus amygdalus", "prunus dulcis", "corylus avellana", "juglans regia", "anacardium occidentale", "bertholletia excelsa", "pistacia vera"]) {
    assert.equal(scanKinds(n).tree_nut, "contains", n);
  }
  assert.equal(scanKinds("arachis hypogaea").peanut, "contains");
  assert.equal(scanKinds("sesamum indicum").sesame, "contains");
  assert.equal(scanKinds("glycine max").soy, "contains");
  assert.deepEqual(scanKinds("prunus amygdalus dulcis oil"), scanKinds("sweet almond oil"));
  assert.equal(scanKinds("prunus amygdalus dulcis oil").tree_nut, "contains");
});

test("scan: glycine (the amino acid) is not soy", () => {
  assert.deepEqual(scanIngredient("glycine"), []);
});
