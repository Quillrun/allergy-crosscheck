# allergen-guard

A fail-closed allergen checker for recipes and packaged foods. Zero dependencies.

It answers with one of three verdicts, and none of them is "safe":

- `unsafe`: contains a listed allergen, or "may contain" it
- `cannot_confirm`: the data is missing or ambiguous, or an ingredient often hides the allergen (sauce, stock, chocolate, lecithin…)
- `no_listed_allergens`: nothing found; the caller still has to check the label

## Why

Allergen lists in open data are claims, not facts: in Open Food Facts, real records omit allergens that their own ingredient list contains, and most records hold too little to check against (72.3% of the 4,784,317 records in the snapshot measured in [`bench/`](bench/README.md) list no allergens, no "may contain" and no ingredients). So the engine reads the allergen tags, the traces and the ingredient text together, and never trusts one of them alone. Where the data is missing or ambiguous it does not guess: the three verdicts are UNSAFE, CANNOT CONFIRM and NO LISTED ALLERGENS, and "safe" is not one of them.

```ts
import { checkIngredients, checkProduct, resolveAllergies, suggestSwaps } from "allergen-guard";

const maya = { name: "Maya", allergies: resolveAllergies(["peanuts", "tree nuts"]).ids };
const leo = { name: "Leo", allergies: resolveAllergies(["dairy", "celery"]).ids };
const household = [maya, leo];
const people = [leo]; // who is eating

const r = checkIngredients(["1 stick celery", "400ml creme fraiche", "basil"], people);
r.overall;  // "unsafe"
r.speech;   // "Leo should avoid this: it contains celery and milk, in the celery and creme fraiche."
suggestSwaps(r.lines, people, household); // swaps for the people checked; options also avoid everyone in household (default: people)

checkProduct(openFoodFactsProduct, household); // a record from the Open Food Facts API; reads tags AND ingredient text; missing data → cannot_confirm
```

Covers the EU's 14 regulated allergens and the US Big 9, with wheat kept separate from gluten. Product checks read Open Food Facts records and don't trust the allergen tags alone, because real records omit allergens their own ingredient list contains.

Node 22.6 or newer runs the TypeScript source directly; there's no build step. `npm test` runs the suite. It includes a list of dangerous ingredients that must never come back as "nothing listed", and look-alikes that must not be flagged (butter beans, coconut milk, nutmeg).

Not medical advice. Always check the label.

MIT licensed. The bench data is not: it is Open Food Facts data under the Open Database License (ODbL) 1.0, as set out under "Data licence" in [`bench/README.md`](bench/README.md).

The published copy of this engine is https://github.com/Quillrun/allergen-guard; this folder is kept identical to it apart from packaging.
