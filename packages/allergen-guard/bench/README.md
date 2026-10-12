# Open Food Facts measurement

Most food records don't hold enough data to answer an allergy question. This measures how often that happens, using the engine's own `checkProduct` on every record in the Open Food Facts database.

## Result (snapshot of 7 October 2026, run on 8 October, 4,784,317 records)

| | All records | Records scanned in the Open Food Facts app (`unique_scans_n > 0`) |
|---|---|---|
| Records | 4,784,317 | 1,552,376 |
| No allergens listed, no "may contain", **and no ingredient list** | 3,457,538 (72.3%) | 826,465 (53.2%) |

In each of these records, a checker that trusts the allergen list would answer "no allergens". This engine answers "can't confirm", because there is nothing to check the list against.

`unique_scans_n` is the number of distinct IPs that scanned the product in the official Open Food Facts app. It's computed by the Open Food Facts server's [`scripts/scanbot.pl`](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/scripts/scanbot.pl).

## What this does not claim

The first run (8 October, earlier engine) also counted products whose English ingredient text has an allergen that their allergen list leaves out (`B` in `results-2026-10-08.json`): 191,717 of all records, 99,607 of the scanned ones. These are the figures of that run; the round-3 engine gives 137,251 for all records and 64,333 for scanned ones.

**That number is not a finding.** We hand-checked 40 random hits from a 200-record sample, each against its full live Open Food Facts record: 16 of 40 were real (40%; 50% if the 8 unclear ones are set aside), 16 false and 8 unclear. The false ones came from:
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
- *Engine.* The engine changed since round 2: commit `bab00b8` plus the foreign-text fix (English ingredient text that contains a word from `FOREIGN_ALLERGEN_WORDS` now carries "Part of the ingredient list isn't in English, so I can't read it."). The round-3 numbers will therefore differ from round 2's for engine reasons as well as rule reasons.
- *Round-3 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261009 from the round-3 `strict_sample`, excluding every code checked in rounds 1 and 2. Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-4 rules (fixed before the run, 2026-10-09).** The round-3 hand check found 95 of 100 real; all 5 misses are gaps in the count's own rules. Three rules are added, working per occurrence like R1-R3, and every earlier rule stays (including dropping unlocated hits). A strict hit counts only if at least one occurrence of its term survives R1-R6.
- *R4, free-from claims.* (a) Record level: a family does not count at all on a record whose `labels_tags` claim it free, using `FREE_FROM_LABELS` from `src/catalog.ts` (imported, not copied), with engine allergen ids mapped to strict families as elsewhere (a gluten claim covers the strict "gluten" family, wheat hits included; `en:vegan` covers milk, egg, fish, crustacean and mollusc). (b) Item level: an occurrence does not count when its item contains a free-from phrase for its family: "gluten free" for gluten; "milk free" or "dairy free" for milk; "egg free" for egg; "soy free" or "soya free" for soy; "nut free" for tree_nut and peanut; "peanut free" for peanut; "sesame free" for sesame (hyphens are already folded to spaces). Examples caught: "gluten-free wheat starch" on en:no-gluten records (8008698006696, 7330242240098); "Pasta (Durum Semolina)" on an en:no-gluten record (0747479300155).
- *R5, E-number consistency.* An occurrence of an E220 to E228 code (e220 to e228, optional letter, any spelling the fold produces, such as "E-221") counts only if its item names a sulphite or sulphur dioxide: sulphite, sulfite, bisulphite, bisulfite, metabisulphite, metabisulfite, sulphur dioxide, sulfur dioxide (plural s allowed). Exception: an item that, once the code is removed, is empty apart from the words preservative(s), antioxidant(s), e, brackets and punctuation still counts. Caught: "Sodium Benzoate (E-221)". Kept: "preservative (E223)", "E220", "sodium metabisulphite (E223)".
- *R6, caramel colour.* A sulphites occurrence does not count when its item contains "sulphite ammonia", "sulfite ammonia", "caustic sulphite" or "caustic sulfite". Caught: "colour (sulphite ammonia" (truncated) and "colour (sulphite ammonia caramel)". A separate item "sodium sulphite" in the same record still counts.
- *Sample.* The `strict_sample` reservoir seed changes from 3 to 5, so the round-4 pool differs from round 3's. The `change_sample` seed is unchanged.
- *Engine.* Unchanged since round 3 (commit `0d2357f` is the last engine change), so only the count's rules changed.
- *Round-4 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261010 from the round-4 `strict_sample`, excluding every code checked in rounds 1 to 3 (`$C/run3`, `run4`, `run5` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-5 rules (fixed before the run, 2026-10-09).** The round-4 hand check found 93 of 100 real; 3 of the 7 misses were named flavours. One rule is added, working per occurrence like R1-R6, and every earlier rule stays (including dropping unlocated hits and the oil/flavour line exclusion). A strict hit counts only if at least one occurrence of its term survives R1-R7.
- *R7, flavour context.* An occurrence does not count when its item (same definition as R1-R6) contains any of the words flavour, flavours, flavor, flavors, flavouring, flavourings, flavoring, flavorings, aroma, aromas. Because the engine reports a hit's source as a fragment of the text (for "natural flavor {contains wheat, soybeans, and celery seed}" the celery hit's source is "and celery seed}"), the item is read in the record's whole English text: the fragment is located in it (first match) and the occurrence's item is taken there. If the fragment cannot be located, the fragment's own item is used. Caught: "Wheat milk flavour" (gluten), "artificial cheddar cheese flavor" (milk), "Prawn Cocktail Flavour [Salt, Wheat Flour]" (crustacean), "natural flavor {contains wheat, soybeans, and celery seed}" (celery). Kept: "cheddar cheese, natural flavour" (milk: the cheese is a separate item). Side effect, accepted: "Flavourings (Contain Milk, Egg)" and "flavourings (with soya and wheat)", which the round-3 and round-4 hand checks judged real, no longer count.
- *Item location for R1-R6.* The same whole-text reading applies to R1 to R6, because the engine's `source` is a fragment: the fragment is located in the record's folded English text (first match), and the occurrence's item and bracket context are taken there; if it cannot be located, the fragment's own text is used. Rounds 1 to 4 read the item inside the fragment only, which fell short of the "brackets () [] {} respected" definition. Example: "vegetable oil {palm, soybeans, rapeseed}" (the soy hit's source is "soybeans") now counts for nothing under R1.
- *Sample.* The `strict_sample` reservoir seed changes from 5 to 9, so the round-5 pool differs from round 4's. The `change_sample` seed is unchanged.
- *Engine.* The engine changed since round 4 (commit `858d317`: shared-equipment sentences are precautions, plant creams and corn milk are not dairy, "cheese/prawn flavour" is "possible", UK allergy-advice boilerplate is not gluten), so the round-5 numbers differ from round 4's for engine reasons as well as rule reasons.
- *Round-5 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261011 from the round-5 `strict_sample`, excluding every code checked in rounds 1 to 4 (`$C/run3`, `run4`, `run5`, `run6` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-6 rules (fixed before the run, 2026-10-09).** The round-5 hand check found 97 of 100 real; all three misses were engine readings, fixed in the engine rather than in the counting rules (commit `fa229b8`, E6: "not suitable for … allergy sufferers" sentences are precautions, a may-contain list cut by a full stop stays one precaution, soy-free miso is possible soy; also `9313dbb`: the advice-line strip keeps a real allergen list, asafoetida is possible gluten, rarer plant milks are possible milk). Counting rules R1-R7 are unchanged.
- *Sample.* The `strict_sample` reservoir seed changes from 9 to 13, so the round-6 pool differs from round 5's. The `change_sample` seed is unchanged.
- *Round-6 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261012 from the round-6 `strict_sample`, excluding every code checked in rounds 1 to 5 (`$C/run3`, `run4`, `run5`, `run6`, `run7` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-7 rules (fixed before the run, 2026-10-09).** The round-6 hand check found 95 of 100 real; the five misses were gaps in the count's own rules, so the engine is unchanged (`fa229b8`). Four rules are added and one existing exclusion is corrected. They work per occurrence inside the same location step as R1-R7 (the engine's source fragment is located in the whole folded English text, and each occurrence is judged there), and every earlier rule stays. A strict hit counts only if at least one occurrence of its term survives R1-R10. The rules only shrink the count; none touches the engine.
- *R8, free-from adjacency.* An occurrence of a strict term immediately followed (hyphens are folded to spaces) by the word "free" does not count. Only that occurrence: in "lactose-free milk" the "milk" occurrence still counts. Relation to R4(b): R4(b) is item level and knows only the phrases "gluten/milk/dairy/egg/soy/soya/nut/peanut/sesame free", so it drops every occurrence in the item; R8 is a separate, narrower, per-occurrence check that works for any strict term ("lactose free", "casein free", "wheat free"). Where both apply the result is the same, so R4(b) is left unchanged rather than extended. Round-6 example: 8008698048788 "flavourings,lactose-free storage: dry".
- *Glyceride correction (of the Round-2 exclusion).* The soy exclusion "the line mentions glycerides" matched only the plural. It now matches "glyceride" and "glycerides", so "mono and diglyceride", "mono- and diglyceride" and "diglycerides" are all covered. This corrects the existing exclusion; it is not a new rule. Round-6 example: 0085239207192 "soy mono and diglyceride".
- *R9, precaution in the item.* An occurrence does not count when its item also contains "may contain", "may also contain", "traces" or "contain traces". Round-6 example: 0053326028074 "magnesium stearate and silica soy and may contain wheat.".
- *R10a, base-named miso.* A soy occurrence from "miso" does not count when "miso" is directly preceded by chickpea, chick pea, adzuki, azuki, "soy free" or "soya free". Rice and barley miso still count (they are normally made with soybeans). Round-6 example: 0804879504207 "chickpea miso*".
- *R10b, substitutes.* An occurrence does not count when the term is directly followed by replacement, replacer, substitute, alternative, analogue or analog (plural s allowed), or directly preceded by "imitation", "non dairy" or "dairy free". Round-6 example: 0075450174496 "milk replacement (soya protein, maltodextrin, ...)": the milk hit goes; a separate soy occurrence ("soya protein") is judged on its own.
- *Engine.* Unchanged (`fa229b8`).
- *Sample.* The `strict_sample` reservoir seed changes from 13 to 17 (the only seed changed), so the round-7 pool differs from round 6's.
- *Round-7 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261013 from the round-7 `strict_sample`, excluding every code checked in rounds 1 to 6 (`$C/run3`, `run4`, `run5`, `run6`, `run7`, `run9` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-8 rules (fixed before the run, 2026-10-09).** The round-7 hand check found 95 of 100 real; the five misses were one engine bug, two gaps in the engine's precaution wording, and two gaps in the count's own rules. The engine changes (E8) for (a) to (c); two rules (R11, R12) are added for (d) and (e). They work per occurrence inside the same location step as R1-R10, and every earlier rule stays. A strict hit counts only if at least one occurrence of its term survives R1-R12.
- *E8, engine, for the three engine-side misses.* (a) 0041331021623 "COCONUT MILK (COCONUT MILK, WATER)": an `unless` phrase was masked only at its first occurrence, because the phrase pattern consumed its trailing space; the pattern now looks ahead instead, so every occurrence is masked (exact phrase only). (b) 4009790007950 "pecan nuts  could contain gluten, egg, soy, milk, peanuts, sesame or other nuts": "could contain" joins the precaution wording. (c) 8906005671820 "This product was processed on machinery that also processes peanuts": "processed/made/produced/manufactured on machinery that also processes/handles" joins the precaution wording. "can contain" is not added (too likely to sit inside an ingredient name).
- *R11, OCR-damaged precaution.* An occurrence does not count when its item matches `\bmay (?:also )?cont[a-z]*` (any word beginning "cont" after "may"). It also covers the correct spelling, which R9 already handles. Round-7 example: 5000237128169 "also may contairi milk.".
- *R12, heading.* An occurrence directly followed by a colon (after optional spaces) does not count. Only that occurrence: in "MILK CHOCOLATE EGG: sugar, cocoa butter, whole milk powder" the egg goes and the milk powder stays. Round-7 example: 5012454063451 "LINDT MILK CHOCOLATE EGG: Sugar, ...". To make the colon visible to the rules, the case folding in `measure.mjs` now keeps ":" (before, it became a space), and the E-number check (R5) allows it; no other rule's reading changes.
- *Sample.* The `strict_sample` reservoir seed changes from 17 to 21 (the only seed changed), so the round-8 pool differs from round 7's.
- *Round-8 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261014 from the round-8 `strict_sample`, excluding every code checked in rounds 1 to 7 (`$C/run3`, `run4`, `run5`, `run6`, `run7`, `run9`, `run10` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-9 rules (fixed before the run, 2026-10-09).** The round-8 hand check found 98 of 100 real; the two misses were one gap in the count's own rules and one warning phrasing the engine did not know. The engine changes (E9) for the phrasing; one rule (R13) is added for the other. It works per occurrence inside the same location step as R1-R12, and every earlier rule stays. A strict hit counts only if at least one occurrence of its term survives R1-R13.
- *E9, engine, for the warning phrasing.* 0423000006573 "invert sugar contains: milk manufactured on equipment exposed to:  soy, wheat, peanut, walnut, egg for": "manufactured/made/produced/processed/packed/packaged on equipment exposed to" joins the precaution wording, so the allergens it lists are "may contain" and the milk from "contains: milk" stays a "contains".
- *R13, ferrous sulfite.* An occurrence of a sulphite term directly preceded by "ferrous" does not count. Only that occurrence: a separate "sodium sulfite" in the same record still counts. Round-8 example: 0856244005857 "Enriched wheat flour (ferrous sulfite, niacin, ...)", almost certainly a typo for ferrous sulfate (the iron fortificant).
- *Sample.* The `strict_sample` reservoir seed changes from 21 to 23 (the only seed changed), so the round-9 pool differs from round 8's.
- *Round-9 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261015 from the round-9 `strict_sample`, excluding every code checked in rounds 1 to 8 (`$C/run3`, `run4`, `run5`, `run6`, `run7`, `run9`, `run10`, `run11` `hc_a`/`hc_b`). Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported.

**Round-10 rules (fixed before the run, 2026-10-10).** The round-9 hand check found 93 of 100 real. Its seven causes were fixed in two commits, `bbbc069` (engine) and `7ad05e5` (bench), and an exploratory sweep then looked for the next false-hit patterns; that sweep led to one more engine change (E10) and one more rule (R14). Every earlier rule stays. A strict hit counts only if at least one occurrence of its term survives R1-R14. The 8-shard bench had not been re-run after the round-9 fixes; the sweep was the first full run with them.
- *Round-9 fixes, engine (`bbbc069`, `catalog.ts` and `engine.ts`; the engine package suite went from 68 to 73 tests, and the whole app suite from 105 to 110).* (1) "vegetable ghee" and "vanaspati ghee" are masked on the milk ghee term and added as their own term with milk possible, so they do not go to nothing; "ghee" alone and "butter" stay milk contains. (2) The not-suitable precaution also matches "(It|This|This product|The product) may/might not be suitable for ..." at sentence start, still only when the sentence mentions allergy; "not suitable for vegetarians" stays an ingredient text. (3) "shell fish" is a second term on shellfish (crustacean and mollusc contains) and the fish term masks it; "fish sauce" and a standalone "fish" still count as fish. (4) "Butter Beans³ (7%)": the engine already masked "butter bean(s)" on the milk butter term, but the superscript 3 became a digit glued to the word ("beans3"), so the mask missed. `normalize()` now turns superscript digits into a space; this also lets "Wheat¹" or "Milk²" match their terms. (5) "macadamia milk" joins the rare plant milks (milk possible, the nut stays contains).
- *Round-9 fixes, bench (`7ad05e5`, `measure.mjs` and `fixtures.jsonl`).* (6) R9 also drops an occurrence whose item contains "made in a", "facility", "factory" or "manufactured in/on". (7) R1 also drops a term followed by "o" or "oi" at the very end of the text. Seven fixtures were added: five that must not count and two controls that still count (`fx-r9-keep` gives peanut, `fx-r1-trunc-keep` "soybean oats" gives soy). Run through the old `measure.mjs` all seven counted; with the new one only the two controls count; all seven round-9 records give `strict_missed` 0 under the new engine and rules.
- *The exploratory sweep.* 400 records from a full run with those fixes (engine `bbbc069`, rules `7ad05e5`), of which 359 had been judged when this block was written: **350 of 359 were real**. **This sweep is not a measured round.** It was not drawn with a pre-registered seed, it was used to find patterns, and its figure is not the round-10 result. Its records are excluded from the round-10 hand check below. The nine false hits fell into the groups that follow.
- *E10, engine, for a warning phrasing.* 00244787 "Allergy advice: Not suitable for customers with an allergy to soya due to manufacturing methods." The "not suitable for ... allergy" precaution only matched at the start of a sentence, so the "Allergy advice:" label hid it. A precaution sentence may now also follow an "allergy/allergen advice/information/warning/note:" label, still only when the sentence mentions allergy ("Allergy advice: not suitable for vegetarians" stays an ingredient text, "Allergy advice: contains soya" stays a contains). One engine test is added (111 in the app repo's whole suite; the engine package alone has 74).
- *R14, contains-declaration.* An occurrence does not count when it sits inside a "contains" declaration: the word "contains" opening a sentence (up to three label words before it, e.g. "Allergy advice: contains", "dried contains") or an item, outside brackets, and everything after it to the end of the sentence. A declaration is not an ingredient entry, which the protocol asks for ("names, as an ingredient"). Only that occurrence: an allergen that the ingredient list also names still counts. "contains less than 2% of", "contains 2% or less", "contains no", "contains only", "contains up to", "contains one or more of" and "contains the following" open ingredient lists, not declarations; "natural flavour {contains wheat}" in brackets is not a declaration either. Sweep examples (four records): 0715595100379 "Contains wheat, soy, milk, and egg ingredients." (egg), 8901088745109 "ALLERGN Advice: Contains Oats, Milk, Soy & Nuts." (soy), 0051000277275 "**DRIED CONTAINS: COD, WHEAT, MILK, SOY." (fish), 9415767015609 ", contains wheat derivatives." (gluten). The rule gives up real label declarations too: on two 1/40 slices of the database it removed 1 of 167 and 0 of 254 `strict_missed` records (0030000580820 "Contains milk ingredients."). To let the rule see sentence ends, the case folding in `measure.mjs` now keeps a marker for a full stop before white space or the end of the text, and for a line break; the folded text that every other rule reads is unchanged (checked equal to the old folding on 210,000 texts).
- *Checker too strict, no change.* Two sweep calls are not counted as false in our tally: 0029599002585 ends "SOY PRO" and 0052548581633 ends "yogurt raisi" (cut off after a word that names the ingredient: soy, yogurt). The round-3 hand check already took a cut-off "soy l..." as real. If the round-10 checkers call such records unclear, they count as not real, as the protocol says.
- *Residual, no change (one-off garbles that do not generalise).* 93716956 "Lemon eel 2.5%" (a typo for "peel", read as the fish eel) and 4902745003536 "egg shell calcium" (the engine rightly stays cautious about eggshell; 1 in 359 in the sweep, 0 in the two slices). No rule is added for either.
- *Sample.* The `strict_sample` reservoir seed changes from 23 to 29 (the only seed changed), so the round-10 pool differs from round 9's.
- *Fixtures.* `fixtures.jsonl` now holds 65 records (58 before): four for R14 that would count without the rule (`fx-r14-sentence`, `-label`, `-item`, `-dried`) and three controls that still count (`fx-r14-keep-header` "CONTAINS LESS THAN 2% OF: WHEAT FLOUR", `fx-r14-keep-bracket` "spice mix (contains: mustard, salt)", `fx-r14-keep-listed` "Rice, sesame, salt. Contains: sesame.").
- *Round-10 hand check and decision rule.* 100 records are drawn with mulberry32 seed 20261016 from the round-10 `strict_sample`, excluding every code checked in rounds 1 to 9 (`$C/run3`, `run4`, `run5`, `run6`, `run7`, `run9`, `run10`, `run11`, `run12` `hc_a`/`hc_b`) and every code in `$C/explore10/ex_*.json`. Two independent checkers judge them by the hand-check protocol below (unclear = not real). The count is claimed only at 100 of 100 real; otherwise the measured precision is reported. The operator wants a measured precision of at least 98 of 100; that is a target, and the decision rule is unchanged.

**What is reported.** `strict_named` (records with a kept hit) and `strict_missed` (of those, a kept family is in neither list), with per-family counts, and `strict_missed` split into `_list_empty` and `_list_partial`. Each is given for all records and for scanned ones. A 200-record sample of `strict_missed` goes to `strict_sample.json`.

**Hand-check protocol.** After the rules are frozen and the full run is done, draw 100 records from `strict_sample` with a fresh seed. Judge each on the snapshot record. A record is **real** only if the English ingredient text names, as an ingredient (not in a "may contain" or free-from statement, and not an oil or flavouring exemption), something that contains the allergen under EU Annex II or US FALCPA, and neither the allergen list nor the "may contain" list of the snapshot names it. Anything else, including unclear, counts as not real. The claim is made only if 100 of 100 are real; one miss and the rules change and the run repeats.

### Outcome

Ten rounds were run. Round 9 had been declared the final round (decision 2026-10-09); the operator then asked for a further round (2026-10-10), so round 10 is now the latest and round 9's 93 of 100 stands as measured.

Compare run, 11 October (engine `0a1ceec` against the round-10 engine `17287f8`, `OLD_ENGINE`; not a counted round, no hand check). It checks that the 11 October engine changes (lookalike fixes, Open Food Facts allergen ids mapped, foreign text; see below) open no new gap. `A` and the total are unchanged. `strict_missed` is 8,295 for all records (list empty 2,049, list partial 6,246) and 2,071 for popular ones (717 and 1,354); `B` is 136,763 (popular 64,232); `foreign_exposed` fell from 96 to 68 (popular 57 to 40). 583 records changed (269 popular) and **117 went to none** (40 popular). Every one of the 117 was listed and checked: 116 are lookalikes the engine now leaves alone on purpose (butter lettuce 70, ginger or root beer 26, tiger nuts 7, rice cakes 5, tart apples 4, ginger ale 3, a rum label's "with ginger beer or ginger ale" serving suggestion 1). One was a real gap: a cashew-apple juice (7896288960173). The 117 codes and groups: [`tonone-2026-10-11.tsv`](tonone-2026-10-11.tsv). Cashew apple is now "possible tree nut" (engine `2ec07bc`, after the run; it changes only records that name cashew apple or cashew fruit). Counts: [`results-compare-2026-10-11.json`](results-compare-2026-10-11.json); the slowest shard took 3,465.2 s. The precision figure above stays the round-10 one, measured at `17287f8`.

Review fixes, 11 October (engine `3dc675d`, after an independent review; not a counted round). Text that isn't an ingredient list ("-", "n/a", "see pack", only unknown words with accented letters) is "can't confirm"; egg substitute, vegan butter and vegan cheese are "possible"; "til" in method text is not sesame; "nata de coco" is not cream; more foreign words. A listing of every record that went to "none listed" against `2ec07bc`, over all 4,784,317 records, caught a regression in the first version of these fixes (run 15: 170 records, among them 21 untranslated lists after nine foreign words were dropped as "English", and 118 Norwegian lists that only a misread "til" had flagged); `3dc675d` fixed it. The final listing (run 16) has 42 records (12 scanned), all intended: nata de coco 32, "til" as a word on packaging, date lines or garbled text 9, a cosmetic 1 ([`tonone-2026-10-11-run16.tsv`](tonone-2026-10-11-run16.tsv)). The counts above (8,295 and the rest) were not re-run on `3dc675d`; on the 1,936-record spot check it gives 320 "none listed", against 333 at `2ec07bc`, and every one of the 13 changes is untranslated or not an ingredient list.

Round 10 (engine `17287f8`, count rules R1-R14, rules commit `cd8ffb8`, pre-registered before the run; the commit was made at 02:39:51 and the run's start was 02:40:33) found **99 of 100 real** (checker A 49/50, checker B 50/50; the lead agrees with every call), a 95% Wilson interval of 94.6% to 99.8%. **The count is not claimed.** The pre-registered rule needs 100 of 100, so the measured precision is reported instead: 99 of 100. `strict_missed` is **8,298** for all records (list empty 2,050, list partial 6,248) and **2,069** for popular ones (716 and 1,353), down from 8,388 and 2,106 in round 9. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round10-2026-10-10.json`](results-strict-round10-2026-10-10.json). `A` and the total are unchanged; `B` is 136,392 (popular 64,016); the slowest shard took 2,725.325 s. Against the round-9 engine, 67 records changed and 1 went to none (4064347220411, "Live Kefir Cultures¹": the existing "kefir culture" mask now applies once the superscript is normalised). Determinism: the re-run of shard 2 gave identical counts apart from `seconds` (2,725.3 s in the 8-way run, 2,190.7 s solo).

The one record that was not real: 0722252200693 (milk), "almonds butter", which is almond butter (the plant-butter mask covers "almond butter", not the plural form). Six borderline calls were kept real, and the lead agrees: "egg melang", "wheat starch" (twice), "caramel color (contains sodium bisulfite)", "Organic Almond Butter" and "soy polysaccharides".

Round 9 (engine `402b308`, count rule R13, rules commit `4f0a9a4`, pre-registered before the run; the run's `start.txt` is 22:27:39, after the 22:27:30 commit) found **93 of 100 real** (checker A 48/50, checker B 45/50; the lead agrees with every call), a 95% Wilson interval of 86.3% to 96.6%. **The count is not claimed.** The reported figure is the measured precision of the final engine and rules: 93 of 100. `strict_missed` is **8,388** for all records (list empty 2,069, list partial 6,319) and **2,106** for popular ones (724 and 1,382), down from 8,401 and 2,107 in round 8. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round9-2026-10-09.json`](results-strict-round9-2026-10-09.json). `A` is unchanged (3,457,538 and 826,465); `B` is 136,440 (popular 64,046); the slowest shard took 2,848.0 s; a re-run of shard 2 was identical apart from `seconds` (2,848.0 s in the 8-way run, 2,208.1 s solo).

The 7 records that were not real:
- 3: a plant fat, legume or plant milk read as dairy ("Vegetable Ghee", "Butter Beans", "Macadamia milk" with "coconut cream").
- 1: a warning read as an ingredient ("It may not be suitable for those with peanut allergy").
- 1: "SHELL FISH" as two words read as fish (clam extract).
- 1: a garbled factory warning.
- 1: text truncated at "SOYBEAN OI" (soybean oil exemption).

Round 8 (engine `55f497c`, count rules R11 and R12, rules commit `1caacd9`, pre-registered before the run; the commits share the second 20:40:13, and the run's `start.txt` has the same second) found **98 of 100 real** (checker A 50/50, checker B 48/50; the lead agrees with every call), a 95% Wilson interval of 93.0% to 99.4%. `strict_missed` is **8,401** for all records (list empty 2,069, list partial 6,332) and **2,107** for popular ones (724 and 1,383), down from 8,436 and 2,116 in round 7. **The count is not claimed.** The rule required 100 of 100, so the measured precision is reported instead. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round8-2026-10-09.json`](results-strict-round8-2026-10-09.json). `A` is unchanged (3,457,538 and 826,465); `B` is 136,440; the slowest shard took 2,591.677 s (wall clock 2,592 s); a re-run of shard 2 was identical apart from `seconds`.

The 2 records that were not real:
- 1: "ferrous sulfite" in an enriched flour, almost certainly a typo for ferrous sulfate (the iron fortificant); unclear counts as not real.
- 1: a warning phrasing the engine did not know ("manufactured on equipment exposed to: soy, wheat, peanut, walnut, egg").

Round 7 (engine `fa229b8` unchanged, count rules R8-R10b and the glyceride correction, rules commit `4cd40fb`, pre-registered before the run) found **95 of 100 real** (checker A 46/50, checker B 49/50; the lead agrees with every call), a 95% Wilson interval of 88.8% to 97.8%. `strict_missed` is **8,436** for all records (list empty 2,081, list partial 6,355) and **2,116** for popular ones (727 and 1,389), down from 8,516 and 2,142 in round 6. **The count is not claimed.** The rule required 100 of 100, so the measured precision is reported instead. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round7-2026-10-09.json`](results-strict-round7-2026-10-09.json). `A` is unchanged (3,457,538 and 826,465); `B` is 136,562 and 64,086, equal to round 6's; the slowest shard took 2,446 s; a re-run of shard 2 was identical apart from `seconds`.

The 5 records that were not real:
- 1: an OCR typo of "contain" that escapes the precaution wording ("also may contairi milk.").
- 1: a repeated `unless` phrase, masked only at its first occurrence ("COCONUT MILK (COCONUT MILK, WATER)"; engine bug).
- 1: a product-name heading inside the ingredient text ("LINDT MILK CHOCOLATE EGG: Sugar, ...").
- 1: "could contain" is not in the precaution wording.
- 1: shared-machinery phrasing is not in the precaution wording ("processed on machinery that also processes peanuts").

Round 6 (engine `fa229b8`, count rules R1-R7 unchanged, rules commit `4f594cd`, pre-registered before the run) found **95 of 100 real** (checker A 47/50, checker B 48/50; the lead agrees with every call), a 95% Wilson interval of 88.8% to 97.8%. `strict_missed` is **8,516** for all records (list empty 2,094, list partial 6,422) and **2,142** for popular ones (732 and 1,410), down from 8,551 and 2,161 in round 5. **The count is not claimed.** The rule required 100 of 100, so the measured precision is reported instead. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round6-2026-10-09.json`](results-strict-round6-2026-10-09.json). `A` is unchanged (3,457,538 and 826,465); the slowest shard took 2,476.5 s; a re-run of shard 2 was identical apart from `seconds`.

The 5 records that were not real:
- 1: a free-from claim run into a storage line ("flavourings,lactose-free storage: dry"; R4(b) has no "lactose free").
- 1: a singular "soy mono and diglyceride" (the glycerides exclusion matches "glycerides" only).
- 1: garbled text where it is unclear whether soy is an ingredient or part of the warning.
- 1: a miso named by its base ("chickpea miso*"), no soy named.
- 1: a milk substitute ("milk replacement (soya protein, …)").

The first attempt at the round-5 misses (`145267b`) was reverted because on full data it downgraded about 7,600 family "contains" results, including real ingredients; the narrow redo is `fa229b8`.

Round 5 (engine `858d317`, count rules R1-R7 above, rules commit `04e5241`, pre-registered before the run) found **97 of 100 real after the lead re-check** (checker A 47/50, checker B 49/50, so 96/100 by the checkers alone; the lead overrode checker A on one record, a truncated "soya lecithin"), a 95% Wilson interval of 91.5% to 99.0%. `strict_missed` is **8,551** for all records (list empty 2,098, list partial 6,453) and **2,161** for popular ones (735 and 1,426), down from 9,506 and 2,426 in round 4. **The count is not claimed.** The rule required 100 of 100, so the measured precision is reported instead. The records, verdicts and the lead's re-check are in [`handcheck-strict-2026-10-08.md`](handcheck-strict-2026-10-08.md); the run's counts are in [`results-strict-round5-2026-10-09.json`](results-strict-round5-2026-10-09.json). `A` is unchanged (3,457,538 and 826,465); `B` is 136,566 and 64,089 (137,251 and 64,333 in rounds 3 and 4); the slowest shard took 2,391 s; a re-run of shard 2 was identical apart from `seconds`.

The 3 records that were not real:
- 1: a "not suitable for … allergy sufferers" warning read as "contains" ("Not suitable for Nut, Peanut and Sesame allergy sufferers").
- 1: a may-contain sentence cut by a stray full stop, so "egg peanuts and nuts" was read as an ingredient.
- 1: a soy-free rice miso ("organic rice miso (organic rice, water, salt, alcohol, koji culture)").

Separately from the count, the round-5 vanished-hit audit of the run found two fail-opens introduced in engine `858d317` (the allergy-advice strip removed a real "For allergens see cereals containing gluten, nuts, soya and sulphites"; "peanut milk" as a plant milk hid "milk" in garbled text) and asafoetida losing its only gluten signal. They were fixed in engine commit `9313dbb`.

Round 4 (engine `0d2357f`, count rules R1-R6, commit `f88bc4a`) had found 93 of 100 real (checker A 46/50, checker B 47/50), interval 86.3% to 96.6%, `strict_missed` 9,506 and 2,426 scanned; its drop from round 3 (9,547 and 2,449) came from R4-R6 (sulphites 4,640 to 4,615, gluten 789 to 771), and `B` was unchanged from round 3 (137,251 and 64,333). The 7 records that were not real:
- 3: named flavours the flavour exclusion didn't catch, because it only matches the term directly followed by "flavour" ("artificial cheddar cheese flavor", "Prawn Cocktail Flavour", "Wheat milk flavour").
- 2: plant "milk" or "cream" read as dairy ("Corn milk 98.03%", "daiya oat cream blend").
- 1: a shared-equipment sentence ("shares equipment with peanuts").
- 1: UK allergy-advice boilerplate ("For allergens see cereals containing gluten").

The plant-milk, shared-equipment and advice-boilerplate causes, plus the flavour downgrade, were engine faults; the round-5 engine commit `858d317` fixed them. A 100/100 sample is only likely if true precision is about 99%: at 95% true precision it happens about 0.6% of the time (0.95^100). Rounds 3 to 9 put the count's precision at about 93-98%, and each round found new long-tail cases, so further rule rounds were stopped; the operator then asked for a round 10, which found 99%.

History: round 1 (engine `4e4ef42`) 73/100; round 2 (engine `d9cffca`) 90/100, interval 82.6% to 94.5%, `strict_missed` 10,730 (2,698 scanned); round 3 (engine `0d2357f`, rules `37f89ae`, `strict_missed` 9,547 and 2,449 scanned, 38.9 minutes) 95/100, interval 88.8% to 97.8%; round 4 (engine `0d2357f`, rules `f88bc4a`) 93/100; round 5 (engine `858d317`, rules `04e5241`) 97/100, interval 91.5% to 99.0%, `strict_missed` 8,551 and 2,161 scanned; round 6 (engine `fa229b8`, rules `4f594cd`) 95/100, interval 88.8% to 97.8%; round 7 (engine `fa229b8`, rules `4cd40fb`) 95/100, interval 88.8% to 97.8%; round 8 (engine `55f497c`, rules `1caacd9`) 98/100, interval 93.0% to 99.4%; round 9 (engine `402b308`, rules `4f0a9a4`) 93/100, interval 86.3% to 96.6%; round 10 (engine `17287f8`, rules `cd8ffb8`) 99/100, interval 94.6% to 99.8%.

The foreign-text change in the engine: English ingredient text that contains a word from `FOREIGN_ALLERGEN_WORDS` now carries "Part of the ingredient list isn't in English", so `foreign_exposed` fell from 1,925 to 96 (all records) and from 930 to 57 (scanned). The remaining ones are words the engine deliberately leaves out of its list (ei, ble, mani, latte) but the bench diagnostic keeps.

Each round's rules are in their own commit of `measure.mjs`, so any round can be reproduced from its commit.

## Decisive answers on scanned products (run 12 October 2026)

How often does the engine give a decisive answer ("avoid" or "no listed allergens") rather than "can't confirm", for a real household profile, on products people actually scan? Measured over every record with `unique_scans_n > 0` in the 7 October 2026 snapshot (1,552,376 of 4,784,317 records), engine commit `77d5fd7`, three profiles, each record checked once per profile with `checkProduct`. Started 00:37, finished 01:45 (8 shards).

| Profile | Decisive (avoid or no listed allergens) | Can't confirm | Decisive among the 264,667 records with English ingredient text | Decisive among the 1,287,709 without |
|---|---|---|---|---|
| milk | 463,764 (29.9%) | 1,088,612 (70.1%) | 188,717 (71.3%) | 275,047 (21.4%) |
| peanut + tree nuts | 355,484 (22.9%) | 1,196,892 (77.1%) | 151,581 (57.3%) | 203,903 (15.8%) |
| milk + celery | 473,247 (30.5%) | 1,079,129 (69.5%) | 190,629 (72.0%) | 282,618 (21.9%) |

Of the decisive answers for the milk profile, 277,847 are "avoid" and 185,917 "no listed allergens". Records without English ingredient text can only be decisive through their allergen and traces tags, since the engine reads English text only. Both bases are given so the two numbers are not confused: 17.0% of scanned records carry English ingredient text. This counts verdicts, not correctness; the precision work above is the check on that.

Command (from `bench/`): `for i in 0 1 2 3 4 5 6 7; do python3 -I off_rows.py food.parquet $i 8 | node --experimental-strip-types decisive.mjs > shard_$i.json & done; wait`, with `decisive.mjs` as kept in the run folder (the same loop as `measure.mjs`, calling `checkProduct` per profile and counting `overall`).

### Second base: scanned products sold in the US or UK (run 12 October 2026)

The same measurement restricted to scanned records whose `countries_tags` include `en:united-states` or `en:united-kingdom` (230,858 of the 1,552,376 scanned records; 134,213 of them, 58.1%, carry English ingredient text). Same snapshot, engine commit `77d5fd7`, started 12:39, finished 13:11 (8 shards).

| Profile | Decisive (avoid or no listed allergens) | Can't confirm | Decisive among the 134,213 records with English ingredient text | Decisive among the 96,645 without |
|---|---|---|---|---|
| milk | 98,456 (42.6%) | 132,402 (57.4%) | 96,277 (71.7%) | 2,179 (2.3%) |
| peanut + tree nuts | 79,947 (34.6%) | 150,911 (65.4%) | 78,424 (58.4%) | 1,523 (1.6%) |
| milk + celery | 99,446 (43.1%) | 131,412 (56.9%) | 97,206 (72.4%) | 2,240 (2.3%) |

Per country (a record can carry both tags, so the rows overlap):

| Country | Scanned records | With English ingredient text | Decisive, milk | Decisive, peanut + tree nuts | Decisive, milk + celery |
|---|---|---|---|---|---|
| US | 133,453 | 86,266 (64.6%) | 46.4% | 37.5% | 47.1% |
| UK | 98,268 | 48,665 (49.5%) | 37.7% | 30.9% | 37.8% |

Command (from `bench/`): the loop above with `off_rows_country.py` (adds the country filter and `countries_tags`) and `decisive_country.mjs`.

## Foreign text filed as English (11 October)

Open Food Facts sometimes files a label in another language as the English ingredient text. The engine reads English only, so that text must give "can't confirm", never "none listed". Two scans of the same snapshot looked for it, each with a person allergic to all 15:

| Scan | Rows found | "No listed allergens" before | After (engine `2ec07bc`) |
|---|---|---|---|
| A foreign may-contain phrase in the English text (`foreign_scan.py … phrases`) | 7,566 | 113 (62 scanned; engine `e8b0bea`) | 9: eight cosmetics and one "may contain pits" |
| Two or more allergen word stems of one of 12 other languages: a whole list left untranslated (`… words`) | 4,702 | 155 (95 scanned; engine `e6ca6ad`) | 1, an OCR-garbled label |

The fixes: more foreign may-contain wordings (Czech, Slovak and Polish plurals, Hungarian, Romanian, Finnish, Slovene, Croatian and Serbian, the Baltic languages, Turkish, Dutch, Vietnamese, Indonesian, and OCR accent slips; engine `e6ca6ad`), and the other languages' words for "ingredients" plus their allergen words in `FOREIGN_ALLERGEN_WORDS` (`0a1ceec`). The candidate lists in `foreign_scan.py` find rows to look at; they are not the engine's lists, and the second scan's stems overlap the words added, so its "after" figure is partly by construction. The independent checks are the compare run above and this spot check: on 1,936 English-labelled records from 12 random row groups (Python `random.seed(7)`, `foreign_scan.py … sample`), 340 were "none listed" before (`e6ca6ad`) and 333 after, and all 7 that changed are untranslated Norwegian, Czech, Spanish (3), Swedish or German text. A simpler rule, "can't confirm when most words are unknown", was tried and dropped: at a 50% threshold it turned 146 of those 340 plain English records into "can't confirm".

Per-scan results: `foreign-2026-10-11-<scan>-<engine commit>.json` (`phrases`, `words`, `sample`; before and after). The "before" engine is a snapshot: `git archive <commit> packages/allergen-guard | tar -x -C snap`, then pass `snap/packages/allergen-guard` as the judge's argument.

```
python3 -I foreign_scan.py food.parquet phrases > phrases.jsonl
node --experimental-strip-types foreign_judge.mjs < phrases.jsonl
```

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
- **Counting rules:** R1-R14 above (rounds 3 to 10) and the exclusions in "The count we claim", all in `measure.mjs`.
- **`merge.mjs`:** adds up the shards, trims the vanished-hit groups to 300, and merges the three 200-record samples (`samples.json`, `strict_sample.json`, `change_sample.json`).
- **Fixture check:** `fixtures.jsonl` holds 65 records with known answers. They are:
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
  - R13 (`fx-r13`, "Enriched wheat flour (ferrous sulfite, niacin)": its sulphites occurrence does not count, the wheat does; `fx-r13-keep`, "preservative (sodium sulfite)": a control that still counts, sulphites);
  - R14 (`fx-r14-*`): "Contains soy and egg ingredients.", "ALLERGEN Advice: Contains Oats, Milk, Soy & Nuts.", ", contains wheat derivatives." and "**DRIED CONTAINS: COD, SESAME." are not strict; three controls still count: "CONTAINS LESS THAN 2% OF: WHEAT FLOUR" (gluten), "spice mix (contains: mustard, salt)" (mustard) and "Rice, sesame, salt. Contains: sesame." (sesame);
  - R11 and R12 (one fixture each, each would count without its rule): `fx-r11` ("also may contairi milk.") is not strict; `fx-r12` ("MILK CHOCOLATE EGG: sugar, cocoa butter, whole milk powder") loses its egg occurrence but keeps milk;
  - R8 to R10 and the glyceride correction (one fixture each, each would count without its rule): `fx-r8` ("flavourings,lactose-free storage: dry"), `fx-glyceride` ("soy mono and diglyceride"), `fx-r9` ("silica soy and may contain wheat"), `fx-r10a` ("chickpea miso*"), `fx-r10b` ("milk replacement (maltodextrin, guar gum)"), none strict; two controls still count: `fx-r8-keep` ("lactose-free milk": milk) and `fx-r10a-keep` ("rice miso": soy);
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

Eight shards took between 20 and 47.5 minutes wall clock on a 10-core laptop, and later rounds took longer (round 3: 38.9 minutes wall clock, the slowest shard 2,331 s; round 4: 20 minutes, the slowest shard 1,202 s; round 5: the slowest shard 2,391 s; round 6: the slowest shard 2,476.5 s; round 7: the slowest shard 2,446 s; round 8: 2,592 s wall clock, the slowest shard 2,591.7 s; round 9: 2,848 s wall clock, the slowest shard 2,848.0 s). Apart from rounds 1, 2 and 4 (29, 34 and 20 minutes), rounds 3 and 5 to 9 took 39 to 47.5 minutes. A re-run of one shard gave identical counts apart from timing.

## Limits

- Open Food Facts is crowd-sourced, so these counts describe the database, not every product on sale.
- The engine reads English ingredient text only.

## Data

Data from [Open Food Facts](https://openfoodfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/). Published here: aggregate counts, record codes, and short quotes from the hand-checked records.
