export { ALLERGENS, ALL_ALLERGENS, OFF_ALLERGEN_TAGS, TERMS, normalize, resolveAllergies } from "./catalog.ts";
export type { AllergenId, Term } from "./catalog.ts";
export { checkIngredients, checkProduct, evaluate, scanIngredient, splitIngredients, worst } from "./engine.ts";
export type { CheckResult, Hit, HitKind, OffProduct, Person, PersonResult, Verdict } from "./engine.ts";
export { BY_TERM as SWAP_OPTIONS, suggestSwaps } from "./swaps.ts";
export type { Swap, SwapOption } from "./swaps.ts";
