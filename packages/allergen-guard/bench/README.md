# Open Food Facts measurement

Most food records don't hold enough data to answer an allergy question. This measures how often that happens, using the engine's own `checkProduct` on every record in the Open Food Facts database.

## Result (snapshot of 7 October 2026, run on 8 October, 4,784,317 records)

| | All records | Records scanned in the Open Food Facts app (`unique_scans_n > 0`) |
|---|---|---|
| Records | 4,784,317 | 1,552,376 |
| No allergens listed, no "may contain", **and no ingredient list** | 3,457,538 (72.3%) | 826,465 (53.2%) |

In each of these records, a checker that trusts the allergen list would answer "no allergens". This engine answers "can't confirm", because there is nothing to check the list against.

`unique_scans_n` is the number of distinct IPs that scanned the product in the official Open Food Facts app. It's computed by the Open Food Facts server's `scripts/scanbot.pl`.

## What this does not claim

The run also counted products whose English ingredient text has an allergen that their allergen list leaves out (`B` in `results-2026-10-08.json`): 191,717 of all records, 99,607 of the scanned ones.

**That number is not a finding.** We hand-checked 40 random hits from a 200-record sample, each against its full live Open Food Facts record: 16 were real, 16 false and 8 unclear, so about 50% precision. The false ones came from:
- carob or locust-bean flour read as wheat flour (4);
- "may contain" statements inside the ingredient text read as "contains" (5);
- "shellfish" read as both crustacean and mollusc (3);
- word-sense errors, such as "tart cherry" read as a tart (3);
- gluten-free oats (1).

Most of the unclear ones were wine or wine vinegar with no sulphite stated. Over-cautious hits never turn an allergen into "none listed", but they make the count unreliable. The records and verdicts are in [`handcheck-2026-10-08.md`](handcheck-2026-10-08.md).

## What the run fixed

The engine never recognised some words found in the data. Each of these now has a test:
- "gluten" on its own;
- "milkfat" and "butterfat";
- "crustaceans" (for example, "crustaceans flavouring");
- "cereals containing gluten";
- "E322" (lecithin, which may be soy).

The first two mattered most. A recipe line of just "gluten" or "milkfat" used to come back "none listed". The category-tag and unreadable-ingredient gaps are described next.

## Category tags

Open Food Facts tags each ingredient on the label with its parent categories too: rice flour is also tagged "flour", and peanut is also tagged "nut". Read as words, the parents add allergens the label never names ("flour" reads as wheat, "nut" as tree nut).

The engine now requests `ingredients_original_tags`, the label's own ingredients. It skips a category the label doesn't name when the category is in `GENERIC_CATEGORIES`: flour, cereal flour, wholemeal flour, cereal, nut, vegetable oil, vegetable oil and fat, sauce, flavouring, natural flavouring. Specific categories that carry real information (wheat, wheat flour, spelt, shellfish) are still read: on those records the label's wheat was in a language the engine can't read, such as Bulgarian or French.

The list was chosen with `categories.mjs`, run over every 10th row group (478,819 records, 130,787 with label tags). It ranks the categories that most often added an allergen the label, the English text and the allergen list did not give: cereal 15,873 records (possible only), vegetable oil and fat 14,942, vegetable oil 9,694, cereal flour 9,465, nut 2,619, flour 1,949 (all "contains wheat").

```
python3 -I off_rows.py food.parquet 0 10 | node --experimental-strip-types categories.mjs > categories.json
```

Two related changes in the same engine commit. With no English text, a label ingredient that Open Food Facts could not identify (for example `fr:…`) now gives "Part of the ingredient list isn't in English", so the answer is "can't confirm". And "tree nuts" is a tree nut, not a possible peanut.

Effect on the full run (`cat_removed`, `unreadable`):

| | All records | Scanned in the app |
|---|---|---|
| Records that lose a false "contains" (gluten 38,552, tree nut 19,975) | 57,571 | 31,126 |
| Records with an ingredient the engine can't read | 334,554 | 248,032 |
| of which would otherwise have been "none listed" | 55,933 | 40,468 |

`A` did not change.

## Method

- **`off_rows.py`:** streams the parquet export by row group. For each record it builds the same fields the server requests from the Open Food Facts API:
  - `allergens_tags`, `traces_tags`, `ingredients_tags`, and `ingredients_original_tags` (the label's own ingredients);
  - `ingredients_text_en`, the English text;
  - `ingredients_text`, the first text in any language.
- **`measure.mjs`:** runs `checkProduct` for one person with all 15 allergens. A record counts for `A` when:
  - both tag lists are empty;
  - and the engine reports "The ingredient list is missing from the product data".

  A second check runs each record again without `ingredients_original_tags` (the old behaviour). A "contains" that disappears is counted in `cat_removed`. Records with an ingredient the engine can't read are counted in `unreadable`.
- **`categories.mjs`:** ranks the category tags that add allergens the label doesn't name (see "Category tags").
- **`merge.mjs`:** adds up the shards.
- **Fixture check:** `fixtures.jsonl` holds four records from the engine tests, with known answers. They are:
  - one with no ingredients;
  - one whose tags omit the milk in its text;
  - one in French only;
  - one whose rice flour is also tagged "flour" (the label doesn't name wheat).

## Run it

You need Python 3 with pyarrow, Node 22.6+, and about 8 GB of disk.

```
curl -L -o food.parquet https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet
node --experimental-strip-types measure.mjs < fixtures.jsonl
for i in 0 1 2 3 4 5 6 7; do python3 -I off_rows.py food.parquet $i 8 | node --experimental-strip-types measure.mjs > shard_$i.json & done; wait
node merge.mjs . shard_*.json   # writes summary.json and samples.json
```

Eight shards took about an hour on a 10-core laptop. A re-run of one shard gave identical counts.

## Limits

- Open Food Facts is crowd-sourced, so these counts describe the database, not every product on sale.
- The engine reads English ingredient text only.

## Data

Data from [Open Food Facts](https://openfoodfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/). Only aggregate counts are published here.
