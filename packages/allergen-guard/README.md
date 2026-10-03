# allergen-guard

A fail-closed allergen checker for recipes and packaged foods. Zero dependencies.

It answers with one of three verdicts, and none of them is "safe":

- `unsafe`: contains a listed allergen, or "may contain" it
- `cannot_confirm`: the data is missing or ambiguous, or an ingredient often hides the allergen (sauce, stock, chocolate, lecithin…)
- `no_listed_allergens`: nothing found; the caller still has to check the label

```ts
import { checkIngredients, checkProduct, resolveAllergies, suggestSwaps } from "allergen-guard";

const people = [
  { name: "Maya", allergies: resolveAllergies(["peanuts", "tree nuts"]).ids },
  { name: "Leo", allergies: resolveAllergies(["dairy", "celery"]).ids },
];

const r = checkIngredients(["1 stick celery", "400ml creme fraiche", "basil"], people);
r.overall;  // "unsafe"
r.speech;   // "Leo should avoid this: it contains celery and milk, in the celery and creme fraiche. ..."
suggestSwaps(r.lines, people); // swaps that don't introduce anyone else's allergen

checkProduct(openFoodFactsProduct, people); // reads tags AND ingredient text; missing data → cannot_confirm
```

Covers the EU's 14 regulated allergens and the US Big 9, with wheat kept separate from gluten. Product checks read Open Food Facts records and don't trust the allergen tags alone, because real records omit allergens their own ingredient list contains.

Not medical advice. Always check the label.

MIT licensed.
