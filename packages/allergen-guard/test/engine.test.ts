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
});

test("swaps never introduce another person's allergen", () => {
  const people = [person("A", "milk"), person("B", "gluten"), person("C", "soy")];
  const r = checkIngredients(["milk"], people);
  const options = suggestSwaps(r.lines, people)[0].options;
  assert.ok(!options.includes("oat milk"), "oat milk has gluten");
  assert.ok(!options.includes("soya milk"), "soya milk has soy");
  assert.ok(options.includes("rice milk"));
});

test("product: allergen tags are not trusted alone (real Nutella record omits milk and soy)", () => {
  const nutella = {
    code: "3017624010701",
    product_name: "Nutella",
    allergens_tags: ["en:nuts"],
    traces_tags: [],
    ingredients_text_en: "sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin",
  };
  const r = checkProduct(nutella, [person("Leo", "milk"), person("Sam", "soy")]);
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
  assert.equal(checkProduct({ product_name: "Nutella" }, people).overall, "cannot_confirm");
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
