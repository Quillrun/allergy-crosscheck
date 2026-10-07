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
