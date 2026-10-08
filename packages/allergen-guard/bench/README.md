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

The first run (8 October, earlier engine) also counted products whose English ingredient text has an allergen that their allergen list leaves out (`B` in `results-2026-10-08.json`): 191,717 of all records, 99,607 of the scanned ones. These are the figures of that run; the round-3 engine gives 137,251 for all records and 64,333 for scanned ones.

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

Effect on the 8 October full run (`cat_removed`, `unreadable`; engine of that date):

| | All records | Scanned in the app |
|---|---|---|
| Records that lose a false "contains" (gluten 38,552, tree nut 19,975) | 57,571 | 31,126 |
| Records with an ingredient the engine can't read | 334,554 | 248,032 |
| of which would otherwise have been "none listed" | 55,933 | 40,468 |

`A` did not change.

## The count we claim (rules fixed before the run)

`B` is not the claim (see above). The claim is a strict count, defined here before it is run so the rules can't bend to fit the result.

**What is counted.** A record counts when it has English ingredient text and the engine, reading that text alone, finds a listed allergen that neither the product's allergen list nor its "may contain" list names. "Alone" means `checkProduct` runs with `ingredients_tags` and `ingredients_original_tags` emptied, so no category tag can add anything. The labels stay, so a free-from or vegan label still downgrades a hit to "check the label". Only "contains" hits from the text count, never "may contain" sentences.

**Which words.** A hit is kept only if its catalogue term is in the `STRICT` list at the top of `measure.mjs`: the plain names of the allergen and its unambiguous forms. For example wheat, durum, semolina, rye and barley for gluten; butter, cream, cheese, whey and casein for milk; the named fish and shellfish; the E220 to E228 sulphite codes. Everything else is out: flour, oat, malt, bran, wine, vinegar, worcestershire, "nut", "shellfish", chocolate, pasta, bread and dishes. Some intended terms are not catalogue terms yet ("durum wheat", "wheat flour", "wheat gluten"); the run lists them in `strict_terms_not_in_catalogue` and they count for nothing. ("mollusc" and "bisulfite" are catalogue terms now.)

**Exclusions.** A kept hit is dropped when its ingredient line has the term followed by oil, flavour, flavouring, extract, aroma or essence ("soybean oil", "almond extract"). Also dropped: a gluten hit when the line mentions glucose, dextrose or maltodextrin; a fish hit when it mentions gelatin or isinglass; a soy hit when it mentions tocopherol, sterol or stanol.

**Record-level rule.** A record whose allergen or "may contain" list holds a tag the engine can't map (not a key of `OFF_ALLERGEN_TAGS`) is left out and counted in `strict_unreadable_lists`, because we can't tell what the list already names.

**Round-2 rules (added after the round-1 hand check found 73 of 100 real).** The systematic causes were foreign-language and badly parsed records, plus two word families that are not the allergen. Three changes, all written down before the next run:
- *Language.* The product's main language (`lang`) must be `en`. Many records carry an English text that is a machine or partial translation of a label in another language.
- *Clean parse.* OFF must have parsed the ingredients cleanly: `ingredients_n` > 0 and `unknown_ingredients_n` ≤ 10% of `ingredients_n`. Garbled lists produce words that are not ingredients.
- Records failing either rule (and having English text) are left out and counted in `strict_not_english_or_unparsed`.
- *Exclusions.* A soy hit is also dropped when its line mentions "glycerides" (mono- and diglycerides are fats, not soy); a milk hit when its line mentions "culture" (a starter culture, not milk as an ingredient).

The engine changes of the same round (more precaution wordings, "not from X" and foreign "sans/sin/senza/ohne/uten/zonder X" claims, and catalogue exceptions) change what the engine reports, not these rules. The round-1 text above stands otherwise; `off_rows.py` now also emits `lang`, `ingredients_n` and `unknown_ingredients_n`.

**Round-3 rules (fixed before the run, 2026-10-08).** The round-2 hand check found 90 of 100 real; 8 of the 10 misses were gaps in the count's own rules. Three hit-level rules are added, and every earlier rule stays. A strict hit counts only if at least one occurrence of its term in its source text survives all three. "Item" means the text between top-level commas or semicolons, with brackets (), [] and {} respected. Terms are matched on whole words (a plural "s" or "es" allowed) after lower-casing and removing accents; letters, digits, brackets, commas, semicolons and "/" are kept, everything else becomes a space.
- *R1, oil and fat context.* An occurrence does not count when its item contains the word oil, oils, fat, fats, shortening or margarine, or when it sits inside brackets whose head (the text just before the opening bracket, back to the previous comma or bracket) contains one of those words. Examples caught: "partially hydrogenated soybean and/or cottonseed oils", "Fully Refined Soya Bean Oil", "Vegetable Oil (Peanut and/or Soy)", "vegetable oil (canola and/or soy)", "vegetable shortening (partially hydrogenated soybean and/or cottonseed oils)".
- *R2, alternatives.* An occurrence does not count when its item contains "and/or", "and or" or a standalone "or". Example caught: "dough conditioners (fumaric acid and/or sodium metabisulfite and/or mono - and diglycerides)".
- *R3, nitrite and naturally-occurring statements.* An occurrence does not count when it comes after "naturally occurring in" or "except for those" within the same item. Example caught: "uncured pepperoni no nitrates or nitrites added except for those naturally occurring in sea salt and celery juice (pork, ...)". "SHERRY VINEGAR (CONTAINS NATURALLY OCCURRING SULFITES)" has no "in" after "occurring", is a real explicit statement, and still counts.
- If a hit's term cannot be found in its source text by this matching, the hit does not count (the rules cannot vouch for it), and it is counted in `strict_hits_unlocated` so the number is visible.
- *Sample.* The `strict_sample` reservoir seed changes from 7 to 3, so the round-3 pool differs from round 2's. The `change_sample` seed is unchanged.
- *Engine.* The engine changed since round 2: commit `0550f56` plus the foreign-text fix (English ingredient text that contains a word from `FOREIGN_ALLERGEN_WORDS` now carries "Part of the ingredient list isn't in English, so I can't read it."). The round-3 numbers will therefore differ from round 2's for engine reasons as well as rule reasons.
- *Round-3 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261009 from the round-3 `strict_sample`, excluding every code checked in rounds 1 and 2. Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**What is reported.** `strict_named` (records with a kept hit) and `strict_missed` (of those, a kept family is in neither list), with per-family counts, and `strict_missed` split into `_list_empty` and `_list_partial`. Each is given for all records and for scanned ones. A 200-record sample of `strict_missed` goes to `strict_sample.json`.

**Hand-check protocol.** After the rules are frozen and the full run is done, draw 100 records from `strict_sample` with a fresh seed. Judge each on the snapshot record. A record is **real** only if the English ingredient text names, as an ingredient (not in a "may contain" or free-from statement, and not an oil or flavouring exemption), something that contains the allergen under EU Annex II or US FALCPA, and neither the allergen list nor the "may contain" list of the snapshot names it. Anything else, including unclear, counts as not real. The claim is made only if 100 of 100 are real; one miss and the rules change and the run repeats.

### Outcome

Three rounds were run. Round 3 (engine `4f64c78`, the Round-3 rules above) found **95 of 100 real** (checker A 47/50, checker B 48/50), a 95% Wilson interval of 88.7% to 97.8%. **The count is not claimed.** The rule required 100 of 100, so the measured precision is reported instead. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round3-2026-10-09.json`](results-strict-round3-2026-10-09.json).

The round-3 run: of 4,784,317 records (1,552,376 scanned), 307,946 (102,057) were strict-checked and 65 (12) hits were dropped as unlocated by the rules. `strict_missed` is **9,547** for all records (list empty 2,219, list partial 7,328) and **2,449** for scanned ones (792 and 1,657). `A` is unchanged: 3,457,538 and 826,465. The run took 38.9 minutes; a re-run of shard 2 was identical apart from timing. Against `1186f6e`, the only hits that vanished are milk: 58 records, all nut or seed butters (sesame, tahini, hazelnut, pistachio, pecan, soy, walnut, fruit butter) that are no longer read as dairy. Reviewed: all intended.

The 5 records that were not real:
- 2: "gluten-free wheat starch" on a product labelled en:no-gluten. Wheat is named, but gluten presence is contradicted, so the record is unclear.
- 1: a product labelled en:no-gluten whose list says "Pasta (Durum Semolina)". The data contradicts itself.
- 1: "Sodium Benzoate (E-221)". E221 is a sulphite code, but the substance named is benzoate. The label contradicts itself.
- 1: "colour (sulphite ammonia", a truncated caramel-colour name (E150d), not an added sulphite.

None of the five is the engine telling a user something false: for the user, the engine still flags wheat for the first two causes and stays cautious on the other two.

The foreign-text change in the engine: English ingredient text that contains a word from `FOREIGN_ALLERGEN_WORDS` now carries "Part of the ingredient list isn't in English", so `foreign_exposed` fell from 1,925 to 96 (all records) and from 930 to 57 (scanned). The remaining ones are words the engine deliberately leaves out of its list (ei, ble, mani, latte) but the bench diagnostic keeps.

History: round 1 (engine `2595749`) 73/100; round 2 (engine `1186f6e`) 90/100, interval 82.6% to 94.5%, `strict_missed` 10,730 (2,698 scanned); round 3 95/100.

`measure.mjs` is unchanged, so each round's count stays reproducible.

## Method

- **`off_rows.py`:** streams the parquet export by row group. For each record it builds the same fields the server requests from the Open Food Facts API:
  - `allergens_tags`, `traces_tags`, `ingredients_tags`, and `ingredients_original_tags` (the label's own ingredients);
  - `ingredients_text_en`, the English text;
  - `ingredients_text`, the first text in any language;
  - `lang`, `ingredients_n` and `unknown_ingredients_n` (the strict count's round-2 rules).
- **`measure.mjs`:** runs `checkProduct` for one person with all 15 allergens. A record counts for `A` when:
  - both tag lists are empty;
  - and the engine reports "The ingredient list is missing from the product data".

  The 8 October results (`results-2026-10-08.json`, first run) also hold `cat_removed` and `unreadable`, from a second check that ran each record without `ingredients_original_tags`. That check is gone; those numbers stay archived. The strict count and the old-versus-new comparison replace it (next section, and `OLD_ENGINE` under "Run it").
- **`categories.mjs`:** ranks the category tags that add allergens the label doesn't name (see "Category tags").
- **`merge.mjs`:** adds up the shards, trims the vanished-hit groups to 300, and merges the three 200-record samples (`samples.json`, `strict_sample.json`, `change_sample.json`).
- **Fixture check:** `fixtures.jsonl` holds twenty records with known answers. They are:
  - one with no ingredients;
  - one whose tags omit the milk in its text;
  - one in French only;
  - one whose rice flour is also tagged "flour" (the label doesn't name wheat);
  - one with milk only in a "may contain" sentence (not `B`, not strict);
  - one with "E-220" in the text and empty lists (strict miss, sulphites);
  - one with carob seed flour, also tagged "flour" (not `B`; passes only once the flour fix is in the engine);
  - one labelled vegan whose text says "whey" (not strict: the label downgrades it);
  - one with "wheat flour, sugar, egg" and only gluten listed (strict miss for egg only, list partial);
  - the same text with `lang` "fr" (left out: `strict_not_english_or_unparsed`);
  - the same text with 2 of 10 ingredients unknown to OFF (left out: `strict_not_english_or_unparsed`);
  - one with "diglycerides … (soy)" (not strict: glycerides exclusion);
  - one with "lactic acid culture (milk)" (not strict: culture exclusion);
  - three oil and fat cases (R1: "vegetable shortening (partially hydrogenated soybean and/or cottonseed oils)", "vegetable oil (canola and/or soy)", "Fully Refined Soya Bean Oil"), none strict;
  - one "and/or" alternative (R2), not strict;
  - one nitrite statement with celery (R3), not strict;
  - one "SHERRY VINEGAR (CONTAINS NATURALLY OCCURRING SULFITES)" control, which still counts (strict miss, sulphites);
  - one with Spanish words in the English field ("harina, azucar, sal"): the engine answers "can't confirm" with the not-in-English issue.

## Run it

You need Python 3 with pyarrow, Node 22.6+, and about 8 GB of disk.

```
curl -L -o food.parquet https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet
node --experimental-strip-types measure.mjs < fixtures.jsonl
for i in 0 1 2 3 4 5 6 7; do python3 -I off_rows.py food.parquet $i 8 | node --experimental-strip-types measure.mjs > shard_$i.json & done; wait
node merge.mjs . shard_*.json   # writes summary.json and samples.json
```

To compare against an earlier engine, add `OLD_ENGINE=<package dir of a snapshot>` (the directory holding its `src/engine.ts`) to the `node` command. Per family it counts records whose hits all vanished (`vanished`) and records that lost every "contains" (`weakened`, which includes the vanished ones that had a "contains"), records that now answer "no listed allergens" (`to_none`), and the most common vanished hits (`vanished_groups`).

Eight shards took about 35-40 minutes on a 10-core laptop (round 3: 38.9 minutes wall clock; the slowest shard ran 2,331 s). A re-run of one shard gave identical counts apart from timing.

## Limits

- Open Food Facts is crowd-sourced, so these counts describe the database, not every product on sale.
- The engine reads English ingredient text only.

## Data

Data from [Open Food Facts](https://openfoodfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/). Only aggregate counts are published here.
