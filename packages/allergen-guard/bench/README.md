# Open Food Facts measurement

Most food records don't hold enough data to answer an allergy question. This measures how often that happens, using the engine's own `checkProduct` on every record in the Open Food Facts database.

## Result (snapshot of 7 October 2026, 4,784,317 records)

| | All records | Records scanned in the Open Food Facts app (`unique_scans_n > 0`) |
|---|---|---|
| Records | 4,784,317 | 1,552,376 |
| No allergens listed, no "may contain", **and no ingredient list** | 3,457,538 (72.3%) | 826,465 (53.2%) |

In each of these records, a checker that trusts the allergen list would answer "no allergens". This engine answers "can't confirm", because there is nothing to check the list against.

`unique_scans_n` is the number of distinct IPs that scanned the product in the official Open Food Facts app. It's computed by the Open Food Facts server's `scripts/scanbot.pl`.

## What this does not claim

The run also counted products whose English ingredient text has an allergen that their allergen list leaves out (`B` in `results-2026-10-07.json`).

**That number is not a finding.** We hand-checked 40 random hits, and too many were the engine being over-cautious:
- generic Open Food Facts ingredient tags such as `en:flour` and `en:nut` read as wheat and tree nut;
- "may contain" statements already present in the traces.

Many other hits couldn't be judged from the excerpt. Over-cautious hits never turn an allergen into "none listed", but they make the count unreliable.

## What the run fixed

The engine never recognised some words found in the data. Each of these now has a test:
- "gluten" on its own;
- "milkfat" and "butterfat";
- "crustaceans" (for example, "crustaceans flavouring");
- "cereals containing gluten";
- "E322" (lecithin, which may be soy).

The first two mattered most. A recipe line of just "gluten" or "milkfat" used to come back "none listed".

## Method

- **`off_rows.py`:** streams the parquet export by row group. For each record it builds the same fields the server requests from the Open Food Facts API:
  - `allergens_tags`, `traces_tags`, `ingredients_tags`;
  - `ingredients_text_en`, the English text;
  - `ingredients_text`, the first text in any language.
- **`measure.mjs`:** runs `checkProduct` for one person with all 15 allergens. A record counts when:
  - both tag lists are empty;
  - and the engine reports "The ingredient list is missing from the product data".
- **`merge.mjs`:** adds up the shards.
- **Fixture check:** `fixtures.jsonl` holds three records from the engine tests, with known answers. They are:
  - one with no ingredients;
  - one whose tags omit the milk in its text;
  - one in French only.

## Run it

You need Python 3 with pyarrow, Node 22.6+, and about 8 GB of disk.

```
curl -L -o food.parquet https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet
node --experimental-strip-types measure.mjs < fixtures.jsonl
for i in 0 1 2 3; do python3 -I off_rows.py food.parquet $i 4 | node --experimental-strip-types measure.mjs > shard_$i.json & done; wait
node merge.mjs . shard_*.json   # writes summary.json and samples.json
```

Four shards took 21 minutes on a 10-core laptop. A re-run of one shard gave identical counts.

## Limits

- Open Food Facts is crowd-sourced, so these counts describe the database, not every product on sale.
- The engine reads English ingredient text only.

## Data

Data from [Open Food Facts](https://openfoodfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/). Only aggregate counts are published here.
