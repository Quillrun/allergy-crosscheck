# Hand-check: how often "no listed allergens" is wrong (13 October 2026)

The decisive-answer run of 12 October (README, "Decisive answers on scanned products") counted how often the engine answers "avoid" or "no listed allergens" instead of "can't confirm"; it did not check whether those answers were right. This check measures the dangerous direction: when the engine says **"no listed allergens"** for a profile, how often does the record's English ingredient text in fact name an ingredient that contains one of that profile's allergens (a **miss**)? It follows the bench's hand-check protocol (`handcheck-strict-2026-10-08.md`): rules fixed before the run, a seeded draw, two independent checkers, the lead re-checks, unclear counts against the engine.

In this file, `$C` stands for the local cache directory `~/Library/Caches/allergy-crosscheck`. The records are public Open Food Facts data. Each checker's table is copied verbatim from its result file.

| Engine commit | Base | Sample | Checkers | Misses (unclear included) |
|---|---|---|---|---|
| `c604e068` (last change to `src/` is `add9c5b`) | the 264,667 scanned records with English ingredient text (the 12 October base), snapshot of 7 October 2026 | 100 records answered "no listed allergens", drawn with mulberry32 seed 20261017 (milk 34, peanut + tree nuts 33, milk + celery 33) | A and B, independent, 50 each | **0 of 100** (95% Wilson interval 0.00%-3.70%); the lead agrees with every call |

## Protocol

The rules were written before the engine was run over the base and before any record was drawn (rules written 2026-10-13 14:06:53 local time; engine run 14:07:39 to 14:44:50, 2,231 s, 8 shards; draw made after the run). Seed 20261017 was chosen before the run, as the next in the bench's series after round 10's 20261016.

- **Engine.** `packages/allergen-guard` at commit `c604e068ba27964728e8d3def4f0b801e680ac6a`, run from a `git archive` snapshot of that commit so it could not move during the run. The loop is `decisive.mjs` plus a dump of every base record that got "no listed allergens" for at least one profile (`nonelisted.mjs`, in the run snapshot only, not in the repo). Each record is checked once per profile with `checkProduct(row, [{name, allergies}])`; the verdict is `overall`.
- **Base.** Rebuilt from the Open Food Facts snapshot of 7 October 2026 (`$C/off/food.parquet`, 7,894,157,561 bytes) with the bench's `off_rows.py`: records with `unique_scans_n > 0` (1,552,376) and non-empty `ingredients_text_en` after trim (**264,667**), equal to the 12 October figures. The decisive counts of this engine on this base equal the 12 October ones (engine `77d5fd7`): milk 188,717; peanut + tree nuts 151,581; milk + celery 190,629.
- **Profiles.** `milk` = milk; `peanut_treenut` = peanut + tree_nut; `milk_celery` = milk + celery (the three of the decisive run).
- **Pools.** Per profile, the base records answered `no_listed_allergens`: milk 93,833; peanut + tree nuts 106,270; milk + celery 90,836. Minus the 1,000 codes of the hand-check files of rounds 1 to 10 (`hc_a.json` / `hc_b.json` in `$C/run3`, `run4`, `run5`, `run6`, `run7`, `run9`, `run10`, `run11`, `run12`, `run13`; 100 per round): 93,743; 106,170; 90,749. Duplicate codes are one record (first seen); pool order ascending by code as a string.
- **Draw.** mulberry32, seed 20261017, one generator. For each profile in the order milk, peanut_treenut, milk_celery: Fisher-Yates shuffle of the whole pool, then the first codes not already drawn for an earlier profile, until the quota is filled (34 / 33 / 33; 100 distinct codes). Then the 100 are shuffled with the same generator; the first 50 go to checker A (A: milk 13, peanut + tree nuts 20, milk + celery 17), the last 50 to checker B (B: milk 21, peanut + tree nuts 13, milk + celery 16). Each record is judged for the one profile it was drawn for. The lead re-ran the draw script from the run's shard outputs into a separate folder; it reproduced the sample byte for byte.
- **Checkers.** Two independent checkers (each a Claude Sonnet language-model agent; the lead is a Claude Opus agent, as in the earlier hand-check rounds), each with 50 records and the brief (`checker-brief.md`, the definition below verbatim), who did not see each other's table, did not run the engine and did not fetch live records.
- **Decision rule.** Report misses / 100 (unclear included, unclear counted separately) with a 95% Wilson interval, per profile and overall. No pass/fail threshold. The lead re-checks every REAL-MISS, every unclear, every disagreement and 10 random NOT-MISS records; a lead change is recorded in the re-check table.

Run folder: `$C/run17` (`rules.md`, `checker-brief.md`, `draw.mjs`, `draw_stats.json`, `base_counts.json`, `sample.jsonl`, `sample_a.jsonl`, `sample_b.jsonl`, `result_a.md`, `result_b.md`, `shards/`, the engine snapshot and `nonelisted.mjs`).

### Definition of a miss (verbatim from the rules)

A record is a **REAL-MISS** only if both hold:
1. The record's English ingredient text (`ingredients_text_en`) names, as an ingredient (or as a named component of one, such as "soy lecithin" or "whey powder"), something that contains an allergen of the profile under EU Annex II or US FALCPA. The allergens of the profiles: milk (milk, cream, butter, cheese, whey, casein, caseinate, lactose, yoghurt, milk powder, milk fat and so on); peanut; tree nuts (almond, hazelnut, walnut, cashew, pecan, Brazil nut, pistachio, macadamia and so on); celery (celery, celeriac, celery seed, celery salt).
2. The engine's verdict for that profile was `no_listed_allergens`. (True for every record in the sample by construction.)

Everything else is **NOT-MISS**. In particular:
- "May contain", traces, facility, shared-equipment and "not suitable for ... allergy" statements are not misses (they are not ingredients). A bare "contains X" allergen declaration with no ingredient naming X is not a miss; an ingredient entry that also names X is.
- A free-from claim does not stop a miss: if the text names the allergen-containing ingredient and the text or label says free-from, the ingredient is still named, so it is a REAL-MISS. A free-from phrase that is itself the only mention ("milk free", "dairy-free", "peanut-free facility") names no ingredient and is a NOT-MISS.
- Look-alikes are NOT-MISS for the family they do not contain: plant "milk", "cream", "butter" or "cheese" with a non-dairy base (coconut milk, oat milk, rice milk, soy milk, cocoa butter, shea butter, butter beans, butter lettuce, cream of tartar, coconut cream) are not milk (the base may still be another allergen of the profile: almond milk is a tree nut, peanut butter is a peanut); lactic acid, lactates and "lactic acid culture" are not milk; coconut, nutmeg, chestnut, water chestnut, tiger nut, shea nut and cocoa are not tree nuts; celery is only celery, celeriac, celery seed or celery salt (not "celery" inside a pharmaceutical or botanical name that is another plant). Tree nuts are the EU Annex II list (almond, hazelnut, walnut, cashew, pecan, Brazil nut, pistachio, macadamia / Queensland nut) plus the US FALCPA list (adds pine nut).
- Oils, extracts and flavours: a highly or fully refined oil of a tree nut or peanut is exempt (NOT-MISS) only when the text says it is refined; a peanut or tree-nut oil with refinement not stated is unclear. A milk-fat oil (butter oil, ghee) is milk. A named extract, flavour, aroma or essence of the allergen ("almond extract", "cheese flavour", "natural flavour (milk)") is judged on what the words say: if the text itself says it contains the allergen, REAL-MISS; if it only names the flavour with no statement of source, it is unclear. (This is stricter against the engine than the bench's strict count, which excluded oils and flavours; unclear calls are reported separately so the figure can be read both ways.)
- The text must be judged as written. Foreign-language text filed as English: if it names the allergen in a language the checker reads, that is a REAL-MISS (the engine reads English only; a foreign word that names the allergen is a miss, not an excuse). If the checker cannot tell what a word means, see "unclear".
- Unclear counts as a miss (against the engine): when the checker cannot tell from the record whether the named ingredient contains the allergen, or cannot read the text well enough to tell, the call is REAL-MISS with the reason prefixed `UNCLEAR:`. A call is unclear only when it is genuinely undecidable on the record; a clear non-allergen ("butter beans") is a NOT-MISS.
- Judge on the record as given (the sample line). Do not fetch the live Open Food Facts record.

## Checker A

Result file: `result_a.md` (records 1-50 of the sample).

| code | profile | miss? | the exact words | reason |
|---|---|---|---|---|
| 4099100002904 | milk_celery | NOT-MISS | "EGGS" | egg only; no milk or celery |
| 8480000171085 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 4770190077828 | milk | NOT-MISS | "egg white mass" | egg, not milk |
| 0027000389690 | milk | NOT-MISS | none | no candidate word for the profile allergens |
| 0077890471234 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 7790580956707 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 20913137 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 0888670067161 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 20501198 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 9415077074259 | milk | NOT-MISS | "peanuts 97%"; "peanut oil" | peanut is not a milk-profile allergen |
| 0011110802323 | milk | NOT-MISS | none | no candidate word for the profile allergens |
| 0753519469935 | milk_celery | NOT-MISS | "Peanuts, cashews, brazil nuts, almonds" | nuts only; no milk or celery |
| 3564700446768 | milk | NOT-MISS | none | no candidate word for the profile allergens |
| 5057373620309 | peanut_treenut | NOT-MISS | "nutmeg" | nutmeg is not a tree nut |
| 4061461976279 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 5000171061607 | peanut_treenut | NOT-MISS | "Tuna (Fish) 90%" | fish only |
| 5010338000264 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 4056489110071 | milk | NOT-MISS | none | text is a nutrition fragment, no candidate word |
| 0048500007174 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 7613331598103 | peanut_treenut | NOT-MISS | "celery" | celery is not in the peanut/tree nut profile |
| 00016094 | milk | NOT-MISS | none | no candidate word for the profile allergens |
| 4099100076578 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 3560070568697 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 0041303015117 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 29181216 | peanut_treenut | NOT-MISS | "Nutmeg" | nutmeg is not a tree nut |
| 5011673142114 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 9314542777773 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 0858102004804 | milk | NOT-MISS | none | no candidate word for the profile allergens |
| 4901004057044 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 8664522556555 | milk_celery | NOT-MISS | "Added Permitted Natural, Nature Identical & Synthetic Flavor" | generic flavour names no milk or celery source |
| 4735619106756 | milk | NOT-MISS | "9% Soya" | soya is not milk; nuts only as may contain |
| 00670272 | milk | NOT-MISS | "Celery" | celery is not in the milk profile |
| 0856260006456 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 6001069033569 | milk_celery | NOT-MISS | "peanuts"; "soya bean" | peanut and soya are not milk or celery |
| 5010357117639 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 5201193208715 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 5410316442558 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 10105115 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 0020188077014 | milk_celery | NOT-MISS | "NON-DAIRY LACTIC ACID" | lactic acid is not milk; marked non-dairy |
| 4099100042825 | milk | NOT-MISS | "soy lecithin" | soy, not milk |
| 00004664 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 0859392005342 | milk | NOT-MISS | "Almonds, Cashews" | tree nuts are not in the milk profile |
| 0071117027020 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 4088600327587 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 5907808081338 | milk | NOT-MISS | none | no candidate word for the profile allergens |
| 8017596075147 | peanut_treenut | NOT-MISS | none | no candidate word for the profile allergens |
| 4337185459740 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 0024000010227 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 4011800841812 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |
| 8410660510108 | milk_celery | NOT-MISS | none | no candidate word for the profile allergens |

Count: 50 judged; REAL-MISS 0 (of which UNCLEAR 0); NOT-MISS 50.

## Checker B

Result file: `result_b.md` (records 51-100 of the sample).

| code | profile | miss? | the exact words | reason |
|---|---|---|---|---|
| 0055104001026 | peanut_treenut | NOT-MISS | none | no word names an allergen of the profile |
| 0041190085828 | peanut_treenut | NOT-MISS | none | no word names an allergen of the profile |
| 9300633946999 | milk | NOT-MISS | "hlydrolysed vegetable protein (contains gluten, soy)" | soy and gluten only, no milk named |
| 0732346684773 | milk | NOT-MISS | none | garbled label text, no word names milk |
| 7290005307027 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 0829515300524 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 0018161000296 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 0068820125198 | milk_celery | NOT-MISS | "sodium stearoyl-2-lactylate" | lactylate is not milk, no celery named |
| 8480010196979 | peanut_treenut | NOT-MISS | none | no word names an allergen of the profile |
| 6006507004873 | peanut_treenut | NOT-MISS | none | pink salt only, trace tags are not text |
| 8410076470300 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 8033673261388 | milk | NOT-MISS | "apricot kernels (0,2%)" | apricot kernel is not milk |
| 0016000502697 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 20597498 | milk_celery | NOT-MISS | "sodium lactate" | lactate is not milk, no celery named |
| 0011150183505 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 8906046143485 | milk_celery | NOT-MISS | "Calcium 18%" | nutrition-panel text, no ingredient names milk or celery |
| 5010421074455 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 8003490041203 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 0099482422165 | peanut_treenut | NOT-MISS | none | no word names an allergen of the profile |
| 8001420003048 | peanut_treenut | NOT-MISS | none | no word names an allergen of the profile |
| 0111152687428 | milk_celery | NOT-MISS | "sodium lactate" | lactate is not milk, no celery named |
| 6008000163743 | milk | NOT-MISS | none | truncated text, no allergen word |
| 5057172737147 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 9300652809770 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 0738960230877 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 0077890549490 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 20865559 | peanut_treenut | NOT-MISS | none | no word names an allergen of the profile |
| 01134742 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 8936122361984 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 5060265324469 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 0039217017020 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 4056489230366 | peanut_treenut | NOT-MISS | "cream"; "origin of milk: italy" | cream is milk, not peanut or tree nut |
| 3281780052541 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 8426944001026 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 3758299020366 | peanut_treenut | NOT-MISS | "Huile de tournesol" | sunflower oil, not peanut or tree nut |
| 0769602556581 | peanut_treenut | NOT-MISS | "Pasteurized Milk"; "Cheese Culture" | milk is not peanut or tree nut |
| 00430203 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 5060884850097 | milk | NOT-MISS | "CBD (soya)" | soya only, no milk named |
| 0874875008009 | milk | NOT-MISS | "almondmilk (filtered water, almonds)" | almond is a tree nut, not milk; profile is milk only |
| 5050854209970 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 5060086841602 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 5000358480856 | milk_celery | NOT-MISS | none | no word names an allergen of the profile |
| 0796502504817 | milk | NOT-MISS | "Gelatin Capsule (bovine)"; "Magnesium Stearate" | gelatin and stearate are not milk |
| 0027800072723 | milk_celery | NOT-MISS | none | garbled nutrition-panel text, no ingredient names milk or celery |
| 3301170070105 | peanut_treenut | NOT-MISS | "raw goat's milk" | milk is not peanut or tree nut |
| 00799010 | milk | NOT-MISS | none | no word names an allergen of the profile |
| 9300657801540 | peanut_treenut | NOT-MISS | none | no word names an allergen of the profile |
| 5060120281289 | milk_celery | NOT-MISS | "Almonds, Brazil Nuts"; "Hazelnuts" | tree nuts only, profile is milk and celery; no milk or celery named |
| 4970077115289 | peanut_treenut | NOT-MISS | "Soy Sauce"; "Shiitake Mushroom Powder" | no peanut or tree nut named |
| 3760014293160 | milk_celery | NOT-MISS | "may contain taces of soy" | trace statement, no milk or celery |

Count: 50 judged; REAL-MISS 0 (of which UNCLEAR 0); NOT-MISS 50.

## Lead re-check

Neither checker called any record REAL-MISS or unclear, and with each record judged by one checker there are no disagreements; so the re-check is the 10 random NOT-MISS records the protocol asks for. They were drawn from the 100 in sample order with mulberry32 **seed 20261018** (Fisher-Yates over the 100 positions, first 10 taken). The lead also read all 100 sample lines against the rules and found no call to change.

| # | code | profile | checker | checker's call | lead's call | the exact words | lead's reason |
|---|---|---|---|---|---|---|---|
| 63 | 0016000502697 | milk | B | NOT-MISS | NOT-MISS, agree | `Bleached wheat flour, <span class="allergen">malted barley flour</span>` | enriched flour with vitamins; no milk named |
| 81 | 0039217017020 | milk | B | NOT-MISS | NOT-MISS, agree | "cultured wheat flour" | cultured flour is not dairy; no milk ingredient named |
| 50 | 8410660510108 | milk_celery | A | NOT-MISS | NOT-MISS, agree | "Refined Olive Oil and Virgin Olive Oil" | olive oil and importer text; no milk or celery |
| 30 | 8664522556555 | milk_celery | A | NOT-MISS | NOT-MISS, agree | "Added Permitted Natural, Nature Identical & Synthetic Flavor" | a generic flavour, not a flavour of milk or celery, so the flavour rule does not apply |
| 32 | 00670272 | milk | A | NOT-MISS | NOT-MISS, agree | "Celery" | celery is not in the milk profile; no dairy ingredient |
| 74 | 9300652809770 | milk_celery | B | NOT-MISS | NOT-MISS, agree | "Australian oat flour (9%)" | oat drink; no milk or celery named |
| 40 | 4099100042825 | milk | A | NOT-MISS | NOT-MISS, agree | `<span class="allergen">soy lecithin</span>`; "monoglycerides datem" | soy, and emulsifiers that name no milk source; the tail is nutrition-panel text |
| 15 | 4061461976279 | peanut_treenut | A | NOT-MISS | NOT-MISS, agree | "Organic sugar, organic blueberries" | no peanut or tree nut |
| 54 | 0732346684773 | milk | B | NOT-MISS | NOT-MISS, agree | none | marketing text from the pack, not an ingredient list; no ingredient is named (see the note below) |
| 43 | 0071117027020 | milk_celery | A | NOT-MISS | NOT-MISS, agree | "soybean oil" | potatoes, oil, salt, pepper; no milk or celery |

`#` is the line number in `sample.jsonl` (1-100). The lead changed no call.

Note, not a change to the count: in 6 of the 100 records the English ingredient text is not an ingredient list at all but a nutrition panel, OCR fragments or marketing text (4056489110071, 10105115, 8017596075147, 0732346684773, 8906046143485, 0027800072723). Under the rules these are NOT-MISS, since they name no ingredient, and both checkers called them so. The engine still answered "no listed allergens" for them, an answer that rests on no ingredient list.

Side check, not part of the protocol: the repository moved on after the run (HEAD `6b719b9` at the time of writing, with engine changes in `src/` after `c604e068`). Re-running both engines on the 100 sample lines (the fields as stored in the sample): `c604e068` gives "no listed allergens" for all 100 again; `6b719b9` gives "no listed allergens" for 96 and "can't confirm" for 4 (4735619106756, 0020188077014, 9300633946999, 3760014293160), and "avoid" for none. The 6 records above still get "no listed allergens" at `6b719b9`.

## Outcome

| Profile | Sample | REAL-MISS | of which unclear | Misses | 95% Wilson interval |
|---|---|---|---|---|---|
| milk | 34 | 0 | 0 | 0/34 | 0.00%-10.15% |
| peanut + tree nuts | 33 | 0 | 0 | 0/33 | 0.00%-10.43% |
| milk + celery | 33 | 0 | 0 | 0/33 | 0.00%-10.43% |
| **overall** | **100** | **0** | **0** | **0/100** | **0.00%-3.70%** |

Result: **0 misses in 100** "no listed allergens" answers (checker A 0/50, checker B 0/50; the lead agrees with every call). With no unclear calls, the figure reads the same with or without unclear counted. Engine `c604e068`, snapshot of 7 October 2026, draw seed 20261017, lead re-check seed 20261018.

What this means: in 100 randomly drawn cases where the engine told a milk, peanut and tree-nut, or milk and celery profile "no listed allergens" on a scanned product with English ingredient text, the ingredient text never named an ingredient containing one of that profile's allergens. What it does not mean: it does not show that the engine never misses. A sample of 100 with no misses is consistent, at 95% confidence, with a miss rate of up to 3.70% across the pool, and up to about 10% for each profile on its own (33 or 34 records each). It covers only app-scanned Open Food Facts records with English ingredient text (264,667 of 1,552,376 scanned records, 17.0%), only the three profiles, only engine `c604e068`, and only records not drawn in earlier hand-check rounds. It says nothing about records without English text, other allergens, "may contain" warnings (which are not counted as misses), or whether the Open Food Facts text matches the label of the product on sale; and 6 of the 100 answers were given on text that is not an ingredient list at all.
