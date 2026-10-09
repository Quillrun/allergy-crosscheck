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

**Round-4 rules (fixed before the run, 2026-10-09).** The round-3 hand check found 95 of 100 real; all 5 misses are gaps in the count's own rules. Three rules are added, working per occurrence like R1-R3, and every earlier rule stays (including dropping unlocated hits). A strict hit counts only if at least one occurrence of its term survives R1-R6.
- *R4, free-from claims.* (a) Record level: a family does not count at all on a record whose `labels_tags` claim it free, using `FREE_FROM_LABELS` from `src/catalog.ts` (imported, not copied), with engine allergen ids mapped to strict families as elsewhere (a gluten claim covers the strict "gluten" family, wheat hits included; `en:vegan` covers milk, egg, fish, crustacean and mollusc). (b) Item level: an occurrence does not count when its item contains a free-from phrase for its family: "gluten free" for gluten; "milk free" or "dairy free" for milk; "egg free" for egg; "soy free" or "soya free" for soy; "nut free" for tree_nut and peanut; "peanut free" for peanut; "sesame free" for sesame (hyphens are already folded to spaces). Examples caught: "gluten-free wheat starch" on en:no-gluten records (8008698006696, 7330242240098); "Pasta (Durum Semolina)" on an en:no-gluten record (0747479300155).
- *R5, E-number consistency.* An occurrence of an E220 to E228 code (e220 to e228, optional letter, any spelling the fold produces, such as "E-221") counts only if its item names a sulphite or sulphur dioxide: sulphite, sulfite, bisulphite, bisulfite, metabisulphite, metabisulfite, sulphur dioxide, sulfur dioxide (plural s allowed). Exception: an item that, once the code is removed, is empty apart from the words preservative(s), antioxidant(s), e, brackets and punctuation still counts. Caught: "Sodium Benzoate (E-221)". Kept: "preservative (E223)", "E220", "sodium metabisulphite (E223)".
- *R6, caramel colour.* A sulphites occurrence does not count when its item contains "sulphite ammonia", "sulfite ammonia", "caustic sulphite" or "caustic sulfite". Caught: "colour (sulphite ammonia" (truncated) and "colour (sulphite ammonia caramel)". A separate item "sodium sulphite" in the same record still counts.
- *Sample.* The `strict_sample` reservoir seed changes from 3 to 5, so the round-4 pool differs from round 3's. The `change_sample` seed is unchanged.
- *Engine.* Unchanged since round 3 (commit `4c7c554` is the last engine change), so only the count's rules changed.
- *Round-4 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261010 from the round-4 `strict_sample`, excluding every code checked in rounds 1 to 3 (`$C/run3`, `run4`, `run5` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-5 rules (fixed before the run, 2026-10-09).** The round-4 hand check found 93 of 100 real; 3 of the 7 misses were named flavours. One rule is added, working per occurrence like R1-R6, and every earlier rule stays (including dropping unlocated hits and the oil/flavour line exclusion). A strict hit counts only if at least one occurrence of its term survives R1-R7.
- *R7, flavour context.* An occurrence does not count when its item (same definition as R1-R6) contains any of the words flavour, flavours, flavor, flavors, flavouring, flavourings, flavoring, flavorings, aroma, aromas. Because the engine reports a hit's source as a fragment of the text (for "natural flavor {contains wheat, soybeans, and celery seed}" the celery hit's source is "and celery seed}"), the item is read in the record's whole English text: the fragment is located in it (first match) and the occurrence's item is taken there. If the fragment cannot be located, the fragment's own item is used. Caught: "Wheat milk flavour" (gluten), "artificial cheddar cheese flavor" (milk), "Prawn Cocktail Flavour [Salt, Wheat Flour]" (crustacean), "natural flavor {contains wheat, soybeans, and celery seed}" (celery). Kept: "cheddar cheese, natural flavour" (milk: the cheese is a separate item). Side effect, accepted: "Flavourings (Contain Milk, Egg)" and "flavourings (with soya and wheat)", which the round-3 and round-4 hand checks judged real, no longer count.
- *Item location for R1-R6.* The same whole-text reading applies to R1 to R6, because the engine's `source` is a fragment: the fragment is located in the record's folded English text (first match), and the occurrence's item and bracket context are taken there; if it cannot be located, the fragment's own text is used. Rounds 1 to 4 read the item inside the fragment only, which fell short of the "brackets () [] {} respected" definition. Example: "vegetable oil {palm, soybeans, rapeseed}" (the soy hit's source is "soybeans") now counts for nothing under R1.
- *Sample.* The `strict_sample` reservoir seed changes from 5 to 9, so the round-5 pool differs from round 4's. The `change_sample` seed is unchanged.
- *Engine.* The engine changed since round 4 (commit `872b0ec`: shared-equipment sentences are precautions, plant creams and corn milk are not dairy, "cheese/prawn flavour" is "possible", UK allergy-advice boilerplate is not gluten), so the round-5 numbers differ from round 4's for engine reasons as well as rule reasons.
- *Round-5 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261011 from the round-5 `strict_sample`, excluding every code checked in rounds 1 to 4 (`$C/run3`, `run4`, `run5`, `run6` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**What is reported.** `strict_named` (records with a kept hit) and `strict_missed` (of those, a kept family is in neither list), with per-family counts, and `strict_missed` split into `_list_empty` and `_list_partial`. Each is given for all records and for scanned ones. A 200-record sample of `strict_missed` goes to `strict_sample.json`.

**Hand-check protocol.** After the rules are frozen and the full run is done, draw 100 records from `strict_sample` with a fresh seed. Judge each on the snapshot record. A record is **real** only if the English ingredient text names, as an ingredient (not in a "may contain" or free-from statement, and not an oil or flavouring exemption), something that contains the allergen under EU Annex II or US FALCPA, and neither the allergen list nor the "may contain" list of the snapshot names it. Anything else, including unclear, counts as not real. The claim is made only if 100 of 100 are real; one miss and the rules change and the run repeats.

### Outcome

Five rounds were run. Round 5 (engine `872b0ec`, count rules R1-R7 above, rules commit `4549ccd`, pre-registered before the run) found **97 of 100 real after the lead re-check** (checker A 47/50, checker B 49/50, so 96/100 by the checkers alone; the lead overrode checker A on one record, a truncated "soya lecithin"), a 95% Wilson interval of 91.5% to 99.0%. `strict_missed` is **8,551** for all records (list empty 2,098, list partial 6,453) and **2,161** for popular ones (735 and 1,426), down from 9,506 and 2,426 in round 4. **The count is not claimed.** The rule required 100 of 100, so the measured precision is reported instead. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round5-2026-10-09.json`](results-strict-round5-2026-10-09.json). `A` is unchanged (3,457,538 and 826,465); `B` is 136,566 and 64,089 (137,251 and 64,333 in rounds 3 and 4); the slowest shard took 2,391 s; a re-run of shard 2 was identical apart from `seconds`.

The 3 records that were not real:
- 1: a "not suitable for … allergy sufferers" warning read as "contains" ("Not suitable for Nut, Peanut and Sesame allergy sufferers").
- 1: a may-contain sentence cut by a stray full stop, so "egg peanuts and nuts" was read as an ingredient.
- 1: a soy-free rice miso ("organic rice miso (organic rice, water, salt, alcohol, koji culture)").

Separately from the count, the round-5 vanished-hit audit of the run found two fail-opens introduced in engine `872b0ec` (the allergy-advice strip removed a real "For allergens see cereals containing gluten, nuts, soya and sulphites"; "peanut milk" as a plant milk hid "milk" in garbled text) and asafoetida losing its only gluten signal. They are being fixed in a separate engine commit.

Round 4 (engine `4c7c554`, count rules R1-R6, commit `b737e42`) had found 93 of 100 real (checker A 46/50, checker B 47/50), interval 86.3% to 96.6%, `strict_missed` 9,506 and 2,426 scanned; its drop from round 3 (9,547 and 2,449) came from R4-R6 (sulphites 4,640 to 4,615, gluten 789 to 771), and `B` was unchanged from round 3 (137,251 and 64,333). The 7 records that were not real:
- 3: named flavours the flavour exclusion didn't catch, because it only matches the term directly followed by "flavour" ("artificial cheddar cheese flavor", "Prawn Cocktail Flavour", "Wheat milk flavour").
- 2: plant "milk" or "cream" read as dairy ("Corn milk 98.03%", "daiya oat cream blend").
- 1: a shared-equipment sentence ("shares equipment with peanuts").
- 1: UK allergy-advice boilerplate ("For allergens see cereals containing gluten").

The plant-milk, shared-equipment and advice-boilerplate causes, plus the flavour downgrade, were engine faults; the round-5 engine commit `872b0ec` fixed them. A 100/100 sample is only likely if true precision is about 99%: at 95% true precision it happens about 0.6% of the time (0.95^100). Rounds 3 to 5 put the count's precision at about 93-97%, and each round found new long-tail cases, so further rule rounds were stopped.

History: round 1 (engine `2595749`) 73/100; round 2 (engine `1186f6e`) 90/100, interval 82.6% to 94.5%, `strict_missed` 10,730 (2,698 scanned); round 3 (engine `4c7c554`, rules `4f64c78`, `strict_missed` 9,547 and 2,449 scanned, 38.9 minutes) 95/100, interval 88.7% to 97.8%; round 4 (engine `4c7c554`, rules `b737e42`) 93/100; round 5 (engine `872b0ec`, rules `4549ccd`) 97/100, interval 91.5% to 99.0%, `strict_missed` 8,551 and 2,161 scanned.

The foreign-text change in the engine: English ingredient text that contains a word from `FOREIGN_ALLERGEN_WORDS` now carries "Part of the ingredient list isn't in English", so `foreign_exposed` fell from 1,925 to 96 (all records) and from 930 to 57 (scanned). The remaining ones are words the engine deliberately leaves out of its list (ei, ble, mani, latte) but the bench diagnostic keeps.

Each round's rules are in their own commit of `measure.mjs`, so any round can be reproduced from its commit.

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
- **Fixture check:** `fixtures.jsonl` holds 40 records with known answers. They are:
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
  - one with Spanish words in the English field ("harina, azucar, sal"): the engine answers "can't confirm" with the not-in-English issue;
  - one "vegetable oil {palm, soybeans, rapeseed}" (`fx-r1-brace`, R1 read across the brace; not strict);
  - R7 (`fx-r7-*`): "Wheat milk flavour", "artificial cheddar cheese flavor", "Prawn Cocktail Flavour [Salt, Wheat Flour]" and "natural flavor {contains wheat, soybeans, and celery seed}" are not strict; "natural flavour (milk)" is not strict either (the engine still reports milk there, so this one tests R7 alone); "cheddar cheese, natural flavour" is a control that still counts (milk).

## Run it

You need Python 3 with pyarrow, Node 22.6+, and about 8 GB of disk.

```
curl -L -o food.parquet https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet
node --experimental-strip-types measure.mjs < fixtures.jsonl
for i in 0 1 2 3 4 5 6 7; do python3 -I off_rows.py food.parquet $i 8 | node --experimental-strip-types measure.mjs > shard_$i.json & done; wait
node merge.mjs . shard_*.json   # writes summary.json and samples.json
```

To compare against an earlier engine, add `OLD_ENGINE=<package dir of a snapshot>` (the directory holding its `src/engine.ts`) to the `node` command. Per family it counts records whose hits all vanished (`vanished`) and records that lost every "contains" (`weakened`, which includes the vanished ones that had a "contains"), records that now answer "no listed allergens" (`to_none`), and the most common vanished hits (`vanished_groups`).

Eight shards took about 35-40 minutes on a 10-core laptop (round 3: 38.9 minutes wall clock, the slowest shard 2,331 s; round 4: 20 minutes, the slowest shard 1,202 s; round 5: the slowest shard 2,391 s). A re-run of one shard gave identical counts apart from timing.

## Limits

- Open Food Facts is crowd-sourced, so these counts describe the database, not every product on sale.
- The engine reads English ingredient text only.

## Data

Data from [Open Food Facts](https://openfoodfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/). Only aggregate counts are published here.
