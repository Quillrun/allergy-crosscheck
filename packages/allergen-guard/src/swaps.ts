// Swap suggestions. Each swap declares what it contains, so a swap that fixes one
// person's allergy is never offered if it would trip someone else's. A swap is never a
// plant relative of what it replaces (fennel for celery, horseradish for mustard): those
// are known cross-reactions.

import { ALLERGENS, GLUTEN_FREE_MAY_CONTAIN } from "./catalog.ts";
import type { AllergenId } from "./catalog.ts";
import type { Hit, Person } from "./engine.ts";

/** `legume`: a pulse that is no listed allergen itself but cross-reacts with peanut, soy and lupin. */
export type SwapOption = { use: string; contains: AllergenId[]; legume?: boolean };
export type Swap = { replace: string; because: string; options: string[] };

const MILK_CHEESE: SwapOption[] = [{ use: "nutritional yeast", contains: [] }];
const SOFT_CHEESE: SwapOption[] = [{ use: "dairy-free cheese (check its label)", contains: ["soy", "tree_nut"] }];
const NUT_SEEDS: SwapOption[] = [{ use: "pumpkin seeds", contains: [] }, { use: "sunflower seeds", contains: [] }];
// Gluten-free is not wheat-free (wheat starch is allowed), so a wheat allergy rules these out as well as the nut and legume flours.
const GF: AllergenId[] = [...GLUTEN_FREE_MAY_CONTAIN, "wheat"];
const GF_PASTA: SwapOption[] = [{ use: "rice pasta", contains: [] }, { use: "certified gluten-free pasta (check its label)", contains: GF }];

// Peanut, soy and lupin are all legumes and cross-react: with any of them in the household, no legume is offered.
const LEGUME_ALLERGENS: AllergenId[] = ["peanut", "soy", "lupin"];

// Keyed by the catalogue term that matched. Every option is re-scanned by the engine in the tests and must declare what the scan finds.
export const BY_TERM: Record<string, SwapOption[]> = {
  milk: [{ use: "oat milk", contains: ["gluten"] }, { use: "rice milk", contains: [] }, { use: "soya milk", contains: ["soy"] }],
  buttermilk: [{ use: "rice milk with a squeeze of lemon", contains: [] }],
  butter: [{ use: "olive oil", contains: [] }, { use: "dairy-free spread (check its label)", contains: ["soy"] }],
  ghee: [{ use: "olive oil", contains: [] }],
  cream: [{ use: "coconut cream", contains: [] }],
  "sour cream": [{ use: "coconut yoghurt", contains: [] }],
  "creme fraiche": [{ use: "coconut cream", contains: [] }],
  yogurt: [{ use: "coconut yoghurt", contains: [] }],
  yoghurt: [{ use: "coconut yoghurt", contains: [] }],
  cheese: MILK_CHEESE,
  parmesan: MILK_CHEESE,
  parmigiano: MILK_CHEESE,
  pecorino: MILK_CHEESE,
  mozzarella: SOFT_CHEESE,
  ricotta: SOFT_CHEESE,
  feta: SOFT_CHEESE,
  mascarpone: [{ use: "coconut cream", contains: [] }],
  egg: [{ use: "flaxseed gel (1 tbsp ground flaxseed + 3 tbsp water)", contains: [] }, { use: "chickpea-water foam (3 tbsp chickpea water)", contains: [], legume: true }],
  mayonnaise: [{ use: "vegan mayonnaise (check its label)", contains: ["soy", "mustard"] }],
  mayo: [{ use: "vegan mayonnaise (check its label)", contains: ["soy", "mustard"] }],
  flour: [{ use: "rice flour", contains: [] }, { use: "certified gluten-free flour blend (check its label)", contains: GF }],
  pasta: GF_PASTA,
  spaghetti: GF_PASTA,
  penne: GF_PASTA,
  lasagne: [{ use: "gluten-free lasagne sheets (check the label)", contains: GF }, { use: "thin courgette slices", contains: [] }],
  lasagna: [{ use: "gluten-free lasagna sheets (check the label)", contains: GF }, { use: "thin zucchini slices", contains: [] }],
  "lasagne sheet": [{ use: "thin courgette slices", contains: [] }],
  bread: [{ use: "certified gluten-free bread (check its label)", contains: GF }],
  breadcrumb: [{ use: "crushed plain rice cakes", contains: [] }],
  panko: [{ use: "crushed plain rice cakes", contains: [] }],
  couscous: [{ use: "quinoa", contains: [] }],
  "soy sauce": [{ use: "coconut aminos", contains: [] }, { use: "tamari labelled gluten-free (check its label)", contains: ["soy", ...GF] }],
  peanut: [{ use: "sunflower seed butter", contains: [] }, { use: "toasted pumpkin seeds", contains: [] }],
  "pine nut": NUT_SEEDS,
  almond: NUT_SEEDS,
  walnut: NUT_SEEDS,
  cashew: NUT_SEEDS,
  hazelnut: NUT_SEEDS,
  pecan: NUT_SEEDS,
  pistachio: NUT_SEEDS,
  nut: NUT_SEEDS,
  pesto: [{ use: "basil oil (basil, olive oil, garlic, salt)", contains: [] }],
  tahini: [{ use: "sunflower seed butter", contains: [] }],
  sesame: [{ use: "olive oil (for sesame oil) or pumpkin seeds (for seeds)", contains: [] }],
  hummus: [{ use: "white bean dip", contains: [], legume: true }],
  tofu: [{ use: "chicken", contains: [] }, { use: "king oyster mushrooms", contains: [] }], // a legume would be a relative of soy
  "fish sauce": [{ use: "seaweed and mushroom broth", contains: ["celery", "wheat", "gluten"] }],
  worcestershire: [{ use: "balsamic vinegar with a dash of soy sauce (check the labels)", contains: ["soy", "wheat", "gluten", "sulphites"] }],
  shrimp: [{ use: "chicken", contains: [] }, { use: "king oyster mushrooms", contains: [] }],
  prawn: [{ use: "chicken", contains: [] }, { use: "king oyster mushrooms", contains: [] }],
  celery: [{ use: "extra onion or leek", contains: [] }],
  mustard: [{ use: "lemon juice", contains: [] }],
  wine: [{ use: "water with a squeeze of lemon juice", contains: [] }, { use: "grape juice (check its label)", contains: ["sulphites"] }],
};

/**
 * Suggest swaps for ingredients that definitely contain an allergen of someone being checked.
 * Options are also filtered against everyone in `household`, so a swap for one guest never
 * trips anyone else at home. "Possible" hits get no swap: the right move there is to check the label.
 */
export function suggestSwaps(lines: { text: string; hits: Hit[] }[], people: Person[], household: Person[] = people): Swap[] {
  const allAllergies = new Set(people.flatMap((p) => p.allergies));
  const avoid = new Set([...people, ...household].flatMap((p) => p.allergies));
  const noLegumes = LEGUME_ALLERGENS.some((a) => avoid.has(a));
  const swaps: Swap[] = [];
  for (const line of lines) {
    const bad = line.hits.filter((h) => h.kind === "contains" && allAllergies.has(h.allergen));
    if (bad.length === 0) continue;
    const terms = [...new Set(bad.map((h) => h.term))];
    const known = terms.flatMap((t) => BY_TERM[t] ?? []);
    // A swap that fixes only some of the flagged terms leaves the rest in the dish: an option must be offered for every term, and with a term that has no swap there is none.
    const offered = terms.map((t) => (BY_TERM[t] ?? []).map((o) => o.use));
    const options = (terms.some((t) => !BY_TERM[t]) ? [] : known.filter((o) => offered.every((uses) => uses.includes(o.use))))
      .filter((o) => o.contains.every((a) => !avoid.has(a)) && !(noLegumes && (o.legume || o.contains.some((a) => LEGUME_ALLERGENS.includes(a)))))
      .map((o) => o.use);
    const who = people.filter((p) => bad.some((h) => p.allergies.includes(h.allergen))).map((p) => p.name);
    const allergens = [...new Set(bad.map((h) => ALLERGENS[h.allergen].spoken))];
    swaps.push({
      replace: line.text,
      because: `${allergens.join(" and ")} for ${who.join(" and ")}`,
      options: options.length ? [...new Set(options)] : [known.length ? "Leave it out (no swap fits everyone)" : "Leave it out (no known swap)"],
    });
  }
  return swaps;
}
