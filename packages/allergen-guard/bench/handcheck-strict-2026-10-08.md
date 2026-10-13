# Hand-check of the strict count

The strict count (README, "The count we claim") was hand-checked in ten rounds against rules fixed before each run. The rule: draw 100 records from the 200-record `strict_sample`, judge each on the snapshot record, and claim the count only if 100 of 100 are real. The original protocol allowed 2 rounds; round 3 ran under the Round-3 rules the README fixed on 2026-10-08, after round 2, with the same 100-of-100 decision rule. Round 4 ran under the Round-4 rules (R1–R6, README, fixed 2026-10-09), again with the same decision rule. Round 5 ran under the Round-5 rules (R1–R7, README, fixed 2026-10-09), with the same decision rule. Round 6 ran under the same R1–R7 rules (README, fixed 2026-10-09) with the same decision rule. Round 7 ran under the Round-7 rules (R8–R10b and the glyceride correction, README, fixed 2026-10-09) with the same decision rule. Round 8 ran under the Round-8 rules (R11 and R12, README, fixed 2026-10-09) with the same decision rule. Round 9 ran under the Round-9 rules (R13, README, fixed 2026-10-09) with the same decision rule and was declared the final round; the author asked for a further round on 2026-10-10. Round 10 ran under the Round-10 rules (R14 and the engine changes, README, fixed 2026-10-10) with the same decision rule and is the latest round. A record is real only if the English ingredient text names, as an ingredient, something that contains the allergen, and neither the allergen list nor the "may contain" list names it. Unclear counts as not real.

In the tables below, `$C` stands for the local cache directory `~/Library/Caches/allergy-crosscheck`. The records are public Open Food Facts data. Each checker's table is copied verbatim from its result file.

| | Engine commit | Run | Sample | Checkers | Result |
|---|---|---|---|---|---|
| Round 1 | `4e4ef42` | `$C/run3` | seed 77031, 100 records | A and B, 50 each | 73/100 |
| Round 2 | `d9cffca` | `$C/run4` | 200-record `strict_sample` (seed 7), no overlap with round 1; 100 drawn with mulberry32 seed 20261008 | A and B, independent, 50 each | 90/100 |
| Round 3 | `0d2357f` (rules `37f89ae`) | `$C/run5` | 200-record `strict_sample` (reservoir seed 3); 4 records overlapping rounds 1-2 excluded; 100 drawn with mulberry32 seed 20261009 | A and B, independent, 50 each | 95/100 |
| Round 4 | `0d2357f` (unchanged since round 3; count rules R1–R6, commit `f88bc4a`) | `$C/run6` | 200-record `strict_sample` (reservoir seed 5); 8 records overlapping rounds 1-3 excluded; 100 drawn with mulberry32 seed 20261010 | A and B, independent, 50 each | 93/100 |
| Round 5 | `858d317` (rules `04e5241`, pre-registered before the run; count rules R1–R7) | `$C/run7` | 200-record `strict_sample` (reservoir seed 9); 5 records overlapping earlier rounds excluded; 100 drawn with mulberry32 seed 20261011 | A and B, independent, 50 each | 97/100 after lead re-check (96/100 by the checkers alone) |
| Round 6 | `fa229b8` (narrow redo, after `9313dbb` and the revert `5009f9b` of `145267b`; rules `4f594cd`, pre-registered before the run; R1–R7 unchanged) | `$C/run9` | 200-record `strict_sample` (reservoir seed 13); 9 records overlapping earlier rounds excluded; 100 drawn with mulberry32 seed 20261012 | A and B, independent, 50 each | 95/100 (checkers A 47/50 and B 48/50; the lead agrees with every call) |
| Round 7 | `fa229b8` (unchanged; rules `4cd40fb`, pre-registered before the run; R8, glyceride correction, R9, R10a, R10b) | `$C/run10` | 200-record `strict_sample` (reservoir seed 17); 6 records overlapping earlier rounds excluded; 100 drawn with mulberry32 seed 20261013 | A and B, independent, 50 each | 95/100 (checkers A 46/50 and B 49/50; the lead agrees with every call) |
| Round 8 | `55f497c` (rules `1caacd9`, pre-registered before the run; R11, R12) | `$C/run11` | 200-record `strict_sample` (reservoir seed 21); 14 records overlapping earlier rounds excluded; 100 drawn with mulberry32 seed 20261014 | A and B, independent, 50 each | 98/100 (checkers A 50/50 and B 48/50; the lead agrees with every call) |
| Round 9 | `402b308` (rules `4f0a9a4`, pre-registered before the run; R13) | `$C/run12` | 200-record `strict_sample` (reservoir seed 23); 23 records overlapping earlier rounds excluded; 100 drawn with mulberry32 seed 20261015 | A and B, independent, 50 each | 93/100 (checkers A 48/50 and B 45/50; the lead agrees with every call) |
| Round 10 | `17287f8` (rules `cd8ffb8`, pre-registered before the run; R14) | `$C/run13` | 200-record `strict_sample` (reservoir seed 29); draw excludes rounds 1-9 and the exploratory codes; 100 drawn with mulberry32 seed 20261016 | A and B, independent, 50 each | 99/100 (checkers A 49/50 and B 50/50; the lead agrees with every call) |

Round 2 also compared the new engine against the old one (`4e4ef42`). Determinism: shard 2 re-run gave identical counts apart from timing.

## Round 1 (engine 4e4ef42, seed 77031): 38/50 + 35/50 = 73/100

The result files are `$C/run3/hc_a_result.md` and `hc_b_result.md`; the earlier summary is `$C/run3/summary.json`.

### Checker A

| # | code | missed | exact words | per-family | record | reason |
|---|---|---|---|---|---|---|
| 0 | 5063089306468 | gluten, celery | "Whole Wheat Linguine ... Durum Wheat Semolina"; "Celery" | gluten R, celery R | REAL | ingredients named; text is OCR-noisy but both readable (celery is borderline) |
| 1 | 0070470137933 | milk | "low fat milk" | R | REAL | milk ingredient |
| 2 | 0072488987289 | sulphites | "sodium metabisulfite" | R | REAL | preservative named |
| 3 | 4099100032116 | soy | "emulsifiers (471, 322 from soy)" | R | REAL | soy lecithin ingredient |
| 4 | 9310015249730 | milk | "contains milk or milk products" | N (unclear) | NOT REAL | only a contains-statement in garbled OCR; no milk ingredient named |
| 5 | 6170744348370 | soy | "in a plant that also processes soy" | N (facility) | NOT REAL | facility statement |
| 6 | 8012666063680 | milk | "Whole milk yogurt" | R | REAL | |
| 7 | 0280786004502 | gluten, soy | "Wheat Gluten", "Wheat Starch"; "Soy Flour" | R, R | REAL | garbled OCR but ingredient fragments readable |
| 8 | 0054347202115 | egg | "Egg roll filling" | N (other meaning) | NOT REAL | product/component name, no egg ingredient |
| 9 | 0658276203115 | milk | "mozzarella cheese [pasteurized part-skim milk" | R | REAL | |
| 10 | 0072036987037 | sulphites | "sodium sulfite" | R | REAL | |
| 11 | 0723055856841 | egg | "mayonnaise (... cage free eggs" | R | REAL | |
| 12 | 0075391061794 | sulphites | "sodium bisulfite" | R | REAL | |
| 13 | 5352208002795 | sulphites | "colour sulphite ammonia caramel e150d" | N (other meaning) | NOT REAL | caramel colour class name, not a sulphite ingredient |
| 14 | 0070253500022 | milk | "whey"; "flavors (includes milk)" | R | REAL | |
| 15 | 2000000160431 | milk | "animal-free whey protein (bovine beta-lactoglobulin)" | N (unclear) | NOT REAL | precision-fermented, not milk-derived; allergenic protein though (caveat) |
| 16 | 0736128086021 | soy | "soy lecithin" | R | REAL | |
| 17 | 0052196000739 | gluten | "HYDROLYZED CORN GLUTEN" | N (other meaning) | NOT REAL | corn gluten, no gluten cereal |
| 18 | 7350021423931 | tree_nut | "small amounts of cashew hazelnut and almond" | N (unclear) | NOT REAL | garbled OCR; reads like a traces statement |
| 19 | 0076479613164 | sulphites | "sodium bisulfite" | R | REAL | |
| 20 | 0054745010701 | sulphites | "sodium metabisulfite" | R | REAL | |
| 21 | 0052000068283 | milk | "Ultrafiltered milk" | R | REAL | |
| 22 | 0075450109238 | milk | "nonfat milk" | R | REAL | |
| 23 | 78413110495370 | sulphites | "Dough Improver (E223)" | R | REAL | E223 = sodium metabisulphite |
| 24 | 0785090009989 | sulphites | "sulphur dioxide" | R | REAL | |
| 25 | 0037600146203 | sulphites | "SODIUM METABISULFITE" (end of tortilla) | R | REAL | traces_tags has milk/soy only |
| 26 | 0079893710112 | milk | "nonfat milk" | R | REAL | |
| 27 | 0070470343488 | milk | "low fat milk" | R | REAL | |
| 28 | 8436541920415 | egg | "egg corrector* powder"; "*egg from hens" | R | REAL | egg-derived ingredient named; traces list lacks egg; machine-translated text |
| 29 | 8901262174480 | tree_nut | "cashew chikki (... cashew" | R | REAL | |
| 30 | 8903666002765 | gluten | "Refined Wheat Pasta" | R | REAL | |
| 31 | 7597417000370 | gluten | "Sémola Durum" | R | REAL | |
| 32 | 0730555001305 | sulphites | "dried apricots (with sulphur dioxide)" | R | REAL | |
| 33 | 0039545007526 | milk, soy | "PROTEIN FROM MILK"; "GMO FREE SOY" | R, R | REAL | |
| 34 | 0041331049474 | sulphites | "SODIUM METABISULPHITE" | R | REAL | |
| 35 | 7802410002246 | soy, gluten | "proteina hidrolizada de soya"; "harina de trigo", "Contiene gluten trigo" | R, R | REAL | Spanish, OCR noisy but readable; the "Elaborado en lineas" part is traces only and not relied on |
| 36 | 5201415202651 | milk | "pasterized cream milk" | R | REAL | |
| 37 | 3760085101937 | sesame | "graine de sésame" | R | REAL | |
| 38 | 3800065743365 | soy | "soy-bean lecithin" | R | REAL | |
| 39 | 0891830002506 | mustard | "#1 Mustard Seed" | R | REAL | |
| 40 | 5025840001753 | milk | "Jersey Full Cream Milk" | R | REAL | |
| 41 | 8901725001124 | milk | "Toned Milk (80.5%)" | R | REAL | |
| 42 | 5061014360684 | sulphites | "Colour (Sulphite ammonia caramel)" | N (other meaning) | NOT REAL | caramel colour class name |
| 43 | 6009522305697 | gluten, soy | "factory that processes wheat gluten ... soya" | N, N (facility) | NOT REAL | facility statement only |
| 44 | 9008684002885 | gluten | "cereals containing gluten" (Může obsahovat / Gali būti / Môže obsahovať) | N (may contain) | NOT REAL | traces statement only |
| 45 | 0858959005320 | milk | "starter culture [not from milk]" | N (negated) | NOT REAL | explicitly not from milk |
| 46 | 0041143052471 | sulphites | "sulfur dioxide (sulfites to preserve color)" | R | REAL | |
| 47 | 0760366500445 | milk | "non-fat dry milk", "sodium caseinate" | R | REAL | |
| 48 | 0605923470185 | soy | "Organic Soy, ... Fragrance" | N (unclear) | NOT REAL | not a food list (fragrance, hemp oil); likely non-food or soy wax |
| 49 | 6136066000396 | soy | "soy lecithin E322" | R | REAL | |

#### Counts
Records: 38 real, 12 not real (of 50).

Families (55 missed family-instances): 42 real, 13 not real.
- gluten 5 R / 3 N (8)
- milk 13 R / 3 N (16)
- soy 7 R / 3 N (10)
- egg 2 R / 1 N (3)
- sulphites 11 R / 2 N (13)
- tree_nut 1 R / 1 N (2)
- celery 1 R / 0 N
- sesame 1 R / 0 N
- mustard 1 R / 0 N

### Checker B

| code | missed | exact words | per-family | record | reason |
|---|---|---|---|---|---|
| 0858717004138 | gluten | gluten: whole wheat flour; whole grain rye; wheat bran | gluten=real | REAL | pita-chip ingredients; no gluten tag |
| 5600317476168 | peanut | peanut: peanut and raspberry; crunchy peanut butter | peanut=not real | NOT REAL | garbled OCR + marketing sentence, no ingredient list [ocr/marketing] |
| 0749394366179 | soy | soy: soy mono - , diglycerides | soy=not real | NOT REAL | soy-derived emulsifier made from oil; exemption cannot be excluded [unclear] |
| 0846548073638 | gluten | gluten: soft red winter wheat flour (pretzels) | gluten=real | REAL | wheat ingredient; gluten tag absent |
| 0073410958131 | egg | egg: MAY ALSO USE EGG | egg=not real | NOT REAL | only in made-in-bakery/may-contain statement [traces] |
| 0007203610087 | soy | soy: soybean (in vegetable oil: palm, canola, soybean) | soy=not real | NOT REAL | oil only, "one or more of" – refined-oil exemption cannot be excluded [oil/unclear] |
| 01800319 | egg | egg: Pasteurised Fre Range Egg | egg=real | REAL | egg ingredient; no eggs tag |
| 5411146224246 | tree_nut | tree_nut: zelnootpasta 35%; cocoa and hazelnuts | tree_nut=not real | NOT REAL | fragmentary multilingual packaging OCR, not an ingredient list [ocr] |
| 0041220756186 | gluten | gluten: HARINA DE TRIGO; HARINA DE CEBADA; TRIGO BULGUR; SALSA DE SOYA [... TRIGO] | gluten=real | REAL | wheat/barley/bulgur ingredients (text is Spanish, not English) |
| 0087692021353 | sulphites | sulphites: sulfites added to preserve freshness | sulphites=real | REAL | added sulfites in ingredient list; no tag |
| 0039978111241 | gluten | gluten: Whole grain red wheat | gluten=real | REAL | sole ingredient wheat |
| 5600872805946 | gluten | gluten: Sans gluten | gluten=not real | NOT REAL | free-from claim only [free-from] |
| 7340011403296 | soy, lupin | soy: Kan inneholde spor av soya; lupin: Kan inneholde spor av ... lupin | soy=not real, lupin=not real | NOT REAL | traces statement only [traces]; traces statement only [traces] |
| 5030765021625 | egg, milk | egg: Pasteurised Egg; Dried Egg White; milk: Dried Skimmed Milk | egg=real, milk=real | REAL | egg ingredients; no eggs tag; milk ingredient; no milk tag |
| 5060719370004 | gluten | gluten: Wheat Fibre (gluten free) | gluten=real | REAL | wheat-derived ingredient; borderline because of the "gluten free" parenthesis (wheat still an Annex II/FALCPA allergen; wheat fibre is not an exempt form) |
| 2685204007994 | sesame | sesame: graines de sésame | sesame=not real | NOT REAL | only in "Peut contenir des traces" [traces] |
| 5054781531081 | sulphites | sulphites: Preservative Sodium Metabisulphite | sulphites=real | REAL | sulphite preservative; no tag |
| 0667545382192 | milk | milk: Butyrospermum Parkii Butter (shea butter) | milk=not real | NOT REAL | cosmetic, shea butter not milk [other meaning] |
| 9420063600688 | milk | milk: nz milk powder 30%; whey powder | milk=real | REAL | milk ingredients; no milk tag |
| 0013300800850 | egg | egg: eggs with sodium silicoaluminate | egg=real | REAL | egg ingredient; no eggs tag |
| 3261055932174 | soy | soy: soy protein | soy=real | REAL | soy protein in sausage; no soy tag |
| 0895327012610 | sulphites | sulphites: potassium hydrogen sulphite | sulphites=real | REAL | sulphite preservative |
| 0071072012246 | sulphites | sulphites: sodium metabisulfite as preservative | sulphites=real | REAL | sulphite preservative |
| 5050402204884 | tree_nut | tree_nut: Roasted Hazelnuts | tree_nut=real | REAL | hazelnut ingredient; no nuts tag (facility statement is separate) |
| 7611596002519 | sulphites | sulphites: potassium dissulphite e224 | sulphites=real | REAL | sulphite antioxidant in lemon mix; quantity unknown but named as ingredient |
| 5061014360257 | sulphites | sulphites: Sulphite ammonia caramel | sulphites=not real | NOT REAL | E150d process-name; residual sulphite not shown to be in the product [unclear] |
| 5060250342621 | milk | milk: Whole Milk Powder | milk=real | REAL | milk ingredient; no milk tag |
| 00423236 | milk, sulphites | milk: creamy cheeses; sulphites: contains sulphites/contient sulfites | milk=not real, sulphites=not real | NOT REAL | serving suggestion on label OCR [marketing]; OCR of back label, not an ingredient list [ocr]; likely true in real life |
| 3273221099055 | soy, milk | soy: Soya juice* 99.5%; milk: naturally lactose free | soy=real, milk=not real | REAL | soy is main ingredient; no tag; free-from claim [free-from] |
| 0628915224832 | milk | milk: Milk chocolate (... milk ingredients); Contains: Milk | milk=real | REAL | milk ingredient; tags lack milk |
| 5060245605939 | milk | milk: whey isolate; whey concentrate; whey peptides | milk=real | REAL | whey = milk; tags lack milk |
| 87172973 | milk | milk: whole milk powder 2%; skimmed milk powder 1% | milk=real | REAL | milk ingredients; tags lack milk |
| 0797734167245 | milk | milk: Cultured pasteurized 2% low-fat milk | milk=real | REAL | milk is the ingredient |
| 5033742002051 | gluten | gluten: ITALIAN WHEAT FLOUR; BARLEY MALT | gluten=real | REAL | wheat/barley ingredients; no gluten tag (only traces tags) |
| 0071448123644 | milk, sulphites | milk: Cultured pasteurized goat milk; sulphites: dried apricots (... sulfur dioxide) | milk=real, sulphites=real | REAL | goat milk is milk under Annex II; sulphite in ingredient list |
| 0011110905710 | sulphites | sulphites: SODIUM METABISULFITE | sulphites=real | REAL | sulphite additive |
| 0041790602753 | sulphites | sulphites: sulfur dioxide | sulphites=real | REAL | sulphite in ingredient list |
| 0021333936057 | soy | soy: soybean mono & diglycerides | soy=not real | NOT REAL | emulsifier from soybean oil; exemption cannot be excluded [unclear] |
| 5901177152613 | soy | soy: lecithins (from soy) | soy=real | REAL | soy lecithin not exempt; no soy tag |
| 7611328000059 | milk | milk: Pasteurized fat cheese | milk=real | REAL | cheese is milk |
| 8715395060004 | egg, soy, celery | egg: free-range chicken egg yolk; soy: flavors (soy celery); celery: flavors (soy celery) | egg=real, soy=not real, celery=not real | REAL | egg yolk readable in mayonnaise-type sauce, despite garbled OCR; garbled, could be allergen note [ocr/unclear]; garbled [ocr/unclear] |
| 0897630002029 | milk | milk: kefir cultures | milk=not real | NOT REAL | coconut-water kefir cultures, no dairy named [unclear] |
| 0018053194232 | soy | soy: hydrolyzed soy wheat gluten protein; hydrolyzed corn soy wheat protein | soy=real | REAL | hydrolysed soy protein; no soy tag |
| 8851954101013 | soy | soy: SOYBEAN SAUCE; Contain Soybean | soy=not real | NOT REAL | ingredient list unreadable OCR (Thai/garbled) [ocr]; probably true in real life |
| 4056489822783 | peanut | peanut: 205 % Roasted Peanut Places | peanut=real | REAL | peanut pieces ingredient; tags have only en:nuts |
| 0045425169123 | crustacean | crustacean: Lobster meat; lobster surimi | crustacean=real | REAL | lobster is a crustacean; no tag |
| 0041570500057 | milk | milk: Yogurt alternative: almondmilk; calcium lactate | milk=not real | NOT REAL | plant yogurt, lactate is not milk [other meaning] |
| 0860495001124 | tree_nut | tree_nut: Almond Butter | tree_nut=real | REAL | almond ingredient; no tag |
| 20198947 | sulphites | sulphites: Sodium Metabisulphite | sulphites=real | REAL | sulphite stabiliser; gluten tag only |
| 0858788001296 | soy | soy: hydrolzed soy protein | soy=real | REAL | soy ingredient; no tag |

#### Counts
Records: real 35, not real 15 (of 50)

Per family (real / not real):
- celery: 0 / 1
- crustacean: 1 / 0
- egg: 4 / 1
- gluten: 6 / 1
- lupin: 0 / 1
- milk: 9 / 5
- peanut: 1 / 1
- sesame: 0 / 1
- soy: 5 / 6
- sulphites: 9 / 2
- tree_nut: 2 / 1
- total family verdicts: real 37, not real 20

The systematic causes (foreign-language and badly parsed records, plus two word families that are not the allergen) became the round-2 rules in the README.

## Round 2 (engine d9cffca, rules from the README): 45/50 + 45/50 = 90/100

Run: `$C/run4` (`summary.json`; trimmed copy in [`results-strict-2026-10-08.json`](results-strict-2026-10-08.json)). Result files: `$C/run4/hc_a_result.md` and `hc_b_result.md`.

### Checker A

| # | code | missed families | verdict | reason |
|---|---|---|---|---|
| 1 | 0039978113139 | gluten | REAL | "organic whole grain rye flour"; lists empty |
| 2 | 0011213260624 | sulphites | REAL | "SODIUM SULFITE"; lists gluten, soy only |
| 3 | 0711575005030 | gluten | REAL | "Vital Wheat Gluten"; list has soy only |
| 4 | 0070784502793 | sulphites | REAL | "sulfur dioxide"; lists empty |
| 5 | 0041270049849 | sulphites | REAL | "sodium bisulfite (preservative)" |
| 6 | 0705044029665 | egg | REAL | "cage free egg whites"; list has milk only |
| 7 | 0088402302816 | milk | REAL | "organic butter (organic cream, salt)"; list has gluten only |
| 8 | 0747479300360 | gluten | REAL | "Pasta (Durum Semolina)"; list has egg/milk/soy |
| 9 | 0854349008353 | tree_nut | REAL | "cashew butter" is a cashew product; lists empty |
| 10 | 0041497560189 | soy, egg, milk | NOT REAL | egg ("dried eggs") and milk ("dried whey") real, but soy only as "partially hydrogenated soybean and/or cottonseed oils" (oil) |
| 11 | 0070784502946 | sulphites | REAL | "sodium metabisulphite" |
| 12 | 0658276222222 | sulphites | REAL | "sodium bisulfite" in potato flakes |
| 13 | 0816007010481 | gluten | REAL | "hydrolyzed soy, corn and wheat protein"; list has milk/soy |
| 14 | 0291106492961 | tree_nut | REAL | "hazelnut paste 9% in cream" |
| 15 | 0018894904946 | soy | REAL | "isolated soy protein" (also soybean oil, but protein is real soy) |
| 16 | 0722252110022 | milk | NOT REAL | only milk hit is "butter" in "hazelnut butter"/"almond butter"/"cocoa butter" (word sense); no dairy ingredient |
| 17 | 0028491409416 | milk | REAL | "dark chocolate ... milk fat" |
| 18 | 2000000158637 | sulphites | REAL | "Sodium Bisulfite" |
| 19 | 4000281695502 | soy | REAL | "whole soy flour"; list lacks soy |
| 20 | 3158697781270 | sulphites | REAL | "sodium bisulphite"; list has mustard only |
| 21 | 0021600105155 | egg | REAL | "liquid egg yolks"; list has soy only |
| 22 | 5060887590129 | soy | NOT REAL | only "Fully Refined Soya Bean Oil" (oil) |
| 23 | 0073129969220 | crustacean, sulphites | REAL | "crab meat"; "potassium metabisulfite (as preservative)" |
| 24 | 5600826207154 | milk | REAL | "WHEY Protein Concentrate (96%)" |
| 25 | 0041220824274 | sulphites | REAL | "SODIUM BISULFITE (PRESERVATIVE)" |
| 26 | 0842798100575 | sulphites | REAL | "sodium bisulfite (preservative)" |
| 27 | 8938531666254 | sulphites | REAL | "sodium metabisulfite" |
| 28 | 0717322915102 | fish | REAL | "anchovies"; list has milk only |
| 29 | 5010251510741 | sulphites | REAL | "sodium metabisulphite" |
| 30 | 00162142 | egg | REAL | "Pasteurised British Free Range Egg" |
| 31 | 0011150114417 | gluten | REAL | "SEMOLINA WHEAT FLOUR"; list has milk only |
| 32 | 0713733218863 | sulphites | REAL | "sodium bisulfite" |
| 33 | 4335619019966 | sulphites | REAL | "potassium metabisulphite"; list has fish only; text readable though prefixed by title words |
| 34 | 0747599403477 | soy | REAL | "soy lecithin" (not an excluded form); list has milk only |
| 35 | 0084501244316 | sulphites | REAL | "Sodium Metabisulphite" |
| 36 | 0729630000197 | sulphites | REAL | "dough conditioner (sodium metabisulfite)" |
| 37 | 0011110885715 | sulphites | REAL | "sodium metabisulfite" |
| 38 | 0752545008095 | soy | NOT REAL | only "Vegetable Oil (Peanut and/or Soy)" (oil) |
| 39 | 0075450153019 | gluten | REAL | "flour (bleached wheat flour ...)" |
| 40 | 0041318270129 | soy | REAL | "modified soy protein" |
| 41 | 0072470000118 | sulphites | REAL | "dehydrated apples with sulphur dioxide" |
| 42 | 0041497273607 | soy | REAL | "hydrolyzed soy protein" |
| 43 | 0860408000879 | soy | NOT REAL | only "vegetable oil (canola and/or soy)" (oil) |
| 44 | 0004131803010 | gluten | REAL | "semolina wheat flour"; list lacks gluten |
| 45 | 0017109328683 | soy | REAL | "soy lecithin an emulsifier" |
| 46 | 8850344633714 | sulphites | REAL | "e224" (strict code); ingredient list of codes, readable; lists empty |
| 47 | 0041497556069 | sulphites | REAL | "SODIUM METABISULFITE" |
| 48 | 0894224001901 | sulphites | REAL | "dough conditioner (sodium metabisulfite" |
| 49 | 0070953606017 | sulphites | REAL | "preservatives (... sulfur dioxide)" |
| 50 | 0070470492223 | milk | REAL | "Pasteurized grade a milk" |

#### Totals
REAL 45, NOT REAL 5 of 50.

#### NOT REAL by cause
- Oil only (soy exemption): #10 (soy missed only via soybean oil; egg and milk were real), #22, #38, #43. Note the measure.mjs OIL regex missed these because the oil word follows "and/or" or "bean" ("soybean and/or cottonseed oils", "soya bean oil", "Peanut and/or Soy" under "Vegetable Oil").
- Word-sense (nut butter read as milk "butter"): #16.

### Checker B

| # | code | missed families | verdict | reason |
|---|---|---|---|---|
| 1 | 0085239076194 | celery | REAL | "cultured celery powder"; A only en:beef |
| 2 | 0708820763395 | celery | NOT REAL | celery named only as a nitrite source, not listed: "naturally occurring in sea salt and celery juice" (not an ingredient in the list) |
| 3 | 0890476000754 | gluten | REAL | "bleached wheat flour enriched"; A only en:eggs |
| 4 | 0391517593551 | sulphites | REAL | "flour treatment agent (sodium metabisulphite)"; no sulphite tag |
| 5 | 0041190013418 | sulphites | REAL | "sodium bisulfite (preservative)" |
| 6 | 0023402087110 | sulphites | REAL | "SODIUM METABISULFITE"; A gluten, soybeans |
| 7 | 0719283739070 | sesame | REAL | "topped with sesame seeds"; A gluten, soybeans |
| 8 | 0854011004027 | celery | REAL | "celery seed" in the worcestershire sauce sub-list; A has no celery |
| 9 | 0020601412576 | soy | NOT REAL | soy appears only inside an oil: "vegetable oil (peanut and/or soy and/or coconut oil)" (oil exemption, and/or alternative) |
| 10 | 0071538001418 | sulphites | NOT REAL | sulphite is an and/or alternative: "fumaric acid and/or sodium metabisulfite and/or mono - and diglycerides" (may or may not be present) |
| 11 | 0041331029841 | sulphites | REAL | "sodium metabisulfite >0.0009% (as preservative)" |
| 12 | 00954068 | egg, sulphites | REAL | "WHOLE EGGS WITH CITRIC ACID" and "SHERRY VINEGAR (CONTAINS NATURALLY OCCURRING SULFITES)"; A gluten, milk. Borderline on sulphites (declared constituent of an ingredient), kept as explicit |
| 13 | 0680816016244 | milk | REAL | "nonft dry milk" (typo, readable); A eggs, gluten, soybeans |
| 14 | 0078742369662 | sulphites | REAL | "sodium metabisulfite (preservatives)" |
| 15 | 4056489480914 | sulphites | REAL | "Preservative: Sodium Metabisulphite" |
| 16 | 0699632002874 | sulphites | REAL | "sodium metabisulfite (preservatives)" |
| 17 | 0615000022732 | peanut | NOT REAL | peanut only in a precaution: "Produced in an environment that handles peanuts" |
| 18 | 0054267001904 | sulphites | REAL | "sodium bisulphite" |
| 19 | 0790429231498 | sulphites | REAL | "Ginger, sugar, sulfur dioxide" |
| 20 | 0030000313138 | milk | REAL | "buttermilk powder", "sodium caseinate"; A gluten only |
| 21 | 0644209425518 | milk | REAL | "nonfat dry milk", "whole milk solids" |
| 22 | 0859480003670 | soy | REAL | "soy lecithin" (lecithin is not an excluded form); A milk, nuts |
| 23 | 0070411607501 | milk | REAL | "milk fat" in dark chocolate pieces; A gluten, nuts, soybeans |
| 24 | 0015229411896 | sulphites | REAL | "sodium metabisulphite" in potato flakes; A nuts, soybeans |
| 25 | 0810981020887 | gluten | REAL | "wheat flour", "rye flour"; A empty |
| 26 | 0035826076236 | sulphites | REAL | "sodium metabisulfite (preservatives)" |
| 27 | 0941458000290 | peanut | REAL | "hydrolysed groundnut protein"; A gluten only |
| 28 | 0016000144521 | sulphites | REAL | "freshness preserved by sodium metabisulfite" |
| 29 | 5000169170779 | sulphites | REAL | "preservative (sodium metabisulphite)" |
| 30 | 0097209001525 | sulphites | REAL | "SULFUR dioxide" |
| 31 | 0041268143597 | celery | REAL | "contains less than 2% of celery" |
| 32 | 0038259125557 | soy | REAL | "hydrolyzed soy protein" |
| 33 | 0875754004181 | sulphites | REAL | "sodium metabisulfite" |
| 34 | 0046100039212 | sulphites | REAL | "sodium sulfite" |
| 35 | 0705772150099 | soy | REAL | "vanilla soy lecithin (emulsifier)" |
| 36 | 0038105118139 | gluten | REAL | "WHEAT PROTEIN ISO" (truncated word, wheat named); A eggs, nuts |
| 37 | 0075391058992 | sulphites | REAL | "Sodium Bisulfite (As A Preservative)" |
| 38 | 0076983351699 | sulphites | REAL | "sodium sulfite" |
| 39 | 0011110844200 | sulphites | REAL | "SODIUM SULFITE" |
| 40 | 0079851114204 | soy | NOT REAL | soy appears only in an oil: "partially hydrogenated soybean and cottonseed oils" (oil exemption) |
| 41 | 0722252334022 | tree_nut | REAL | "macadamia nut butter"; A milk, soybeans |
| 42 | 0041580060107 | sulphites | REAL | "SULFUR DIOXIDE (PRESERVATIVE)" |
| 43 | 0092825098638 | sulphites | REAL | "sodium bisulfite (preservative)" |
| 44 | 5063089281406 | sulphites | REAL | "Preservative (Potassium Metabisulphite)" |
| 45 | 0011110034298 | sulphites | REAL | "sodium sulfite" |
| 46 | 0041415248908 | sulphites | REAL | "coconut flakes (..., sodium metabisulfite)" |
| 47 | 4892218046200 | milk | REAL | "Flavourings (Contain Milk, Egg)" and "nonfat"-free list; milk not in A. Borderline (milk named inside a flavouring), kept as explicit |
| 48 | 0072036715050 | milk, egg | REAL | "nonfat dry milk", "whole egg solids" |
| 49 | 0017969000115 | sulphites | REAL | "Dough Conditioner (Sodium Metabisulfite"; A has no sulphite |
| 50 | 5010482328887 | egg | REAL | "Pasteurised Liquid Whole Egg"; A gluten, milk |

#### Totals

REAL 45 / 50, NOT REAL 5 / 50.

#### NOT REAL by cause

- Oil exemption (soy only inside an oil): #9, #40
- Precaution sentence only (handles peanuts): #17
- and/or alternative, presence not stated: #10 (also #9 has and/or)
- Not a listed ingredient (celery juice as nitrite source): #2

#### Borderline kept REAL

- #12 sulphites: "CONTAINS NATURALLY OCCURRING SULFITES" on sherry vinegar. Egg on the same record is clear.
- #47 milk: named only as "Flavourings (Contain Milk, Egg)".

### Round 2 lead re-check

The lead re-checked every NOT REAL record, both borderline records (B#12, sherry vinegar "contains naturally occurring sulfites"; B#47, "Flavourings (Contain Milk, Egg)"; both kept REAL because each explicitly states the allergen is present) and 10 random REAL records. All verdicts were confirmed.

### Round 2: the 10 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) Soy present only inside an oil whose wording the oil exclusion doesn't catch: "partially hydrogenated soybean and/or cottonseed oils", "Fully Refined Soya Bean Oil", "Vegetable Oil (Peanut and/or Soy)", "vegetable oil (canola and/or soy)", "vegetable oil (peanut and/or soy and/or coconut oil)", "partially hydrogenated soybean and cottonseed oils" | 6 (A#10, A#22, A#38, A#43, B#9, B#40) | The count's exclusion rule, not the engine |
| (b) An "and/or" alternative, presence not stated: "fumaric acid and/or sodium metabisulfite" | 1 (B#10) | The count's rule |
| (c) Celery only in a nitrite statement ("naturally occurring in sea salt and celery juice"), not in the ingredient list | 1 (B#2) | The count's rule |
| (d) A precaution sentence ("Produced in an environment that handles peanuts") read as an ingredient | 1 (B#17) | Engine gap, being fixed |
| (e) Nut and cocoa butters ("hazelnut butter", "almond butter", "cocoa butter") read as milk | 1 (A#16) | Engine gap, being fixed |

### Round 2 outcome

Under the pre-registered rule (100/100 to claim; at most 2 rounds) the count is **not claimed**. The measured precision is reported instead: 90/100, 95% Wilson interval 82.6%-94.5%.

The figures are for engine `d9cffca`. The fixes for (d) and (e) change the engine, not this measurement. Whether the number is used anywhere public is the author's decision.

## Round 3 (engine 0d2357f, rules 37f89ae, Round-3 rules from the README): 47/50 + 48/50 = 95/100

Run: `$C/run5` (`summary.json`; trimmed copy in [`results-strict-round3-2026-10-09.json`](results-strict-round3-2026-10-09.json)). Result files: `$C/run5/hc_a_result.md` and `hc_b_result.md`. The run took 38.9 minutes wall clock. Determinism: shard 2 re-run gave identical counts apart from timing. The old-engine comparison is against `d9cffca` (`$C/snap-d9cffca`).

The `strict_sample` came from reservoir seed 3 (200 records). 4 records overlapped rounds 1-2 and were excluded; 100 of the rest were drawn with mulberry32 seed 20261009 and split 50/50 between two independent checkers.

### Checker A

| # | code | missed families | verdict | reason |
|---|---|---|---|---|
| 1 | 0077260040985 | sulphites | REAL | "coconut with sodium metabisulfite", "apricots with sulfur dioxide"; A lists no sulphites |
| 2 | 0766626265093 | celery | REAL | "natural flavor {contains wheat, soybeans, and celery seed}"; A has no celery (borderline: inside a flavor) |
| 3 | 8008698006696 | gluten | NOT REAL | "gluten-free wheat starch" is a free-from wording; label en:no-gluten; no other gluten ingredient |
| 4 | 0075450168976 | sulphites | REAL | "sodium metabisulfite (dough conditioner)" |
| 5 | 4800016627262 | sulphites | REAL | "flour treatment agent (sodium metabisulfite (E223))" |
| 6 | 0011110874016 | sulphites | REAL | "SODIUM BISULFITE" as final ingredient |
| 7 | 0021110081581 | milk | REAL | "sodium caseinate (a milk derivative)", "nonfat dry milk"; A has no milk |
| 8 | 0070784214900 | sulphites | REAL | "freshness protected by sodium bisulfite" |
| 9 | 0004656702653 | sulphites | REAL | "preservative (sodium bisulfite)" |
| 10 | 0070411608294 | celery | REAL | "cultured celery powder" is a listed ingredient, not a nitrite statement |
| 11 | 0074175002534 | sulphites | REAL | "sodium metabisulfite."; both lists empty |
| 12 | 0655156233958 | sulphites | REAL | "Sulfites Up To 14 Ppm." explicit statement (borderline: declaration, not a named additive) |
| 13 | 0747479300155 | gluten | NOT REAL | "Pasta (Durum Semolina)" but labels_tags has en:no-gluten (free-from claim contradicts; README: free-from label downgrades; unclear = not real) |
| 14 | 5000221603771 | egg | REAL | "Dried Egg White"; A has no eggs |
| 15 | 0658276202996 | sulphites | REAL | "BHT, sodium bisulfite" in mashed potatoes list; A has no sulphites |
| 16 | 0713733275521 | sulphites | REAL | "preservatives (... sodium bisulfite ...)" |
| 17 | 0041133304825 | milk | REAL | "nonfat dry milk" in precooked eggs; milk not in A or traces (the may-contain is oils only) |
| 18 | 0038445620804 | sulphites | REAL | "APRICOTS, SULFUR DIOXIDE (FOR COLOR RETENTION)" |
| 19 | 5057172567461 | sulphites | REAL | "Preservative (Sodium Metabisulphite)" |
| 20 | 0856995001047 | mustard | REAL | "mustard seed" listed; A has no mustard |
| 21 | 0078742088570 | milk | REAL | "nonfat milk"; A has no milk |
| 22 | 0025753033013 | sulphites | REAL | "sodium bisulfite (as a preservative)" |
| 23 | 4061463050472 | sulphites | REAL | "Preservative (Sodium Metabisulphite)" |
| 24 | 0016000154452 | sulphites | REAL | "Freshness Preserved by Sodium Bisulfite" |
| 25 | 0039978006554 | tree_nut | REAL | "almond protein powder"; lists empty |
| 26 | 0070470489865 | milk | REAL | "Pasteurized grade a milk"; lists empty |
| 27 | 17741798 | sulphites | REAL | "sodium bisulfite [preservative]" |
| 28 | 0095248857196 | sulphites | REAL | "sodium metabisulphite [as s02]", "pineapple ... sulfur dioxide" |
| 29 | 0013409128411 | sesame | REAL | "contains less than 2% of sesame seed" as ingredient item; A has no sesame |
| 30 | 0079606156138 | sulphites | REAL | "dough conditioner (sodium metabisulfite, ...)" |
| 31 | 0070253299339 | sulphites | REAL | "preservatives [... sodium bisulfite ...]" |
| 32 | 0008477110031 | sulphites | REAL | "Shrimp, sodium bisulfite" |
| 33 | 0041646123616 | gluten | REAL | "unbleached durum flour" in cooked pasta; A has eggs, milk only |
| 34 | 6223000054451 | sulphites | REAL | "sulfur dioxide (preservative)" |
| 35 | 0080000513083 | fish | REAL | "LIGHT TUNA" first ingredient; labels only no-gluten/no-soy |
| 36 | 0021130502554 | sulphites | REAL | "preservatives (... sodium bisulfite ...)" |
| 37 | 0741643011199 | sulphites | REAL | "fd&c red #40 and sulfur dioxide (preservative)" |
| 38 | 0036800375994 | sulphites | REAL | "sodium sulfite." final ingredient |
| 39 | 0011225422249 | sulphites | REAL | "sodium sulfite." final ingredient |
| 40 | 0070470127392 | milk | REAL | "Pasteurized grade a milk" first ingredient; lists empty |
| 41 | 5011026008364 | sulphites | REAL | "Preservatives (Potassium Sorbate, Sodium Metabisulphite)" |
| 42 | 0044169652069 | sulphites | REAL | "red wine (8%) (contains preservative (potassium metabisulphite))" |
| 43 | 0194346209910 | crustacean | REAL | "LOBSTER MEAT", "LOBSTER BASE"; A has no crustaceans |
| 44 | 0604700219092 | milk | REAL | "dry whey"; A has no milk (borderline: text truncated at 255 chars, mid-word) |
| 45 | 3800213625857 | soy | REAL | "emulsifier: soy lecithin"; soy absent from A and traces (traces say nuts, gluten) |
| 46 | 5059512741111 | sulphites | REAL | "Preservative (Sodium Metabisulphite)" |
| 47 | 0026396908263 | crustacean | REAL | "Salted Baby Shrimp"; A has only en:fish |
| 48 | 0741643032309 | sulphites | REAL | "sodium sulfite." final ingredient |
| 49 | 0000688267179 | soy | REAL | "corn meal, ascorbic acid, enzymes, soy l" (borderline: text truncated; "soy l" read as soy lecithin, not oil) |
| 50 | 0046876380006 | sulphites | NOT REAL | "Sodium Benzoate (E-221)": named substance is benzoate; E221 is a mislabelled code, sulphite not named |

#### Totals
REAL 47, NOT REAL 3 of 50. (The result file's own totals line was an unrendered template, `{50-len(nr)}`; the count is from the verdict column.)

#### NOT REAL by cause
- Free-from wording or label contradicts the gluten hit: #3 ("gluten-free wheat starch", en:no-gluten), #13 (durum semolina pasta but en:no-gluten label)
- Word-sense / code mix-up: #50 ("Sodium Benzoate (E-221)"; E221 wrongly attached to benzoate, no sulphite named)

### Checker B

| # | code | missed families | verdict | reason |
|---|---|---|---|---|
| 1 | 4056489519713 | mustard | REAL | "Yellow Mustard Flour" is an ingredient item (the "Mustard Oil Flavouring" item is excluded but this one stands); lists name eggs, milk only |
| 2 | 0003003401181 | milk | REAL | "sweet cream buttermilk" in the spread; lists gluten, soybeans |
| 3 | 0850475006461 | egg | REAL | "whole egg powder*"; list gluten only |
| 4 | 0078742438597 | sulphites | REAL | "dried papaya (papaya, sugar, sodium metabisulfite preservative)"; lists have no sulphites (may-contain sentence is separate) |
| 5 | 0007203673118 | sulphites | REAL | "sulfur dioxide (preservative)"; lists empty |
| 6 | 7330242240098 | gluten | NOT REAL | only hit is "gluten-free wheat starch (13%)" and "gluten-free oat flakes": free-from claim, not gluten as an ingredient |
| 7 | 3800065731386 | egg, soy | REAL | "egg melange" and "soy-bean lecithin" as ingredient items; lists have no egg or soy |
| 8 | 0041331030694 | sulphites | REAL | "SODIUM BISULFITE (PRESERVATIVE)", no "or" in item |
| 9 | 5000159413589 | gluten | REAL | "BARLEY MALT EXTRACT" is a barley ingredient, term is not directly followed by extract (see Borderline) |
| 10 | 0070670008873 | sulphites | REAL | "sulfur dioxide (preservative)" |
| 11 | 0009542040345 | gluten | REAL | "barley malt powder"; no glucose/dextrose/maltodextrin in the item |
| 12 | 0193968465858 | sulphites | REAL | "REHYDRATED MUSHROOM (WATER, DRIED MUSHROOMS, SULFUR DIOXIDE PRESERVATIVE)" |
| 13 | 0076808004588 | egg | REAL | "enzyme modified egg yolk"; list milk only |
| 14 | 01111111 | milk | REAL | "skim milk" (item has no oil/fat); list peanuts only |
| 15 | 6281063632269 | sulphites | REAL | "Sodium Metabisulfite" |
| 16 | 0749826656908 | tree nut | REAL | "almond butter." is almonds (not a milk/butter mix-up); lists have no nuts |
| 17 | 0051000005519 | gluten | REAL | "hydrolyzed wheat gluten"; lists celery, soy |
| 18 | 5000169671399 | sulphites | REAL | "preservative (sodium metabisulphite)" |
| 19 | 0071007069512 | sulphites | REAL | "dough conditioners (yeast, wheat gluten, ... sodium metabisulfite)": no "and/or" or "or" in the item |
| 20 | 0755230103006 | mollusc | REAL | "dried clam broth"; list celery only |
| 21 | 5050665032989 | milk | REAL | "whey powder (from milk)"; list is malformed (see Borderline) |
| 22 | 2000000153370 | sulphites | REAL | "Preservatives (Sodium Benzoate, Potassium Metabisulphite)" |
| 23 | 0617762259111 | milk | REAL | "butter milk" (buttermilk) as wrapper ingredient; list gluten only |
| 24 | 0788821001177 | sulphites | REAL | "Preservative: Potassium Sorbate and Potassium Metabisulphite" |
| 25 | 0041318291827 | gluten | REAL | "CORN WHOLE GRAIN WHEAT" names wheat as a grain ingredient (missing comma); lists empty |
| 26 | 5010102243309 | sulphites | REAL | "Preservatives (Potassium Sorbate, Sodium Metabisulphite)" |
| 27 | 0070670008019 | sulphites | REAL | "sodium metabisulfite (preservative)" |
| 28 | 0811033712026 | sulphites | REAL | "sulfur dioxide (a preservative)" |
| 29 | 9556001135957 | soy | REAL | "flavourings (with soya and wheat)" names soya as a component; lists have no soy (see Borderline) |
| 30 | 0786560557016 | tree nut | REAL | "almond butter"; lists have no nuts |
| 31 | 0034952584639 | sulphites | REAL | "sodium metabisulphite" |
| 32 | 0816940012467 | peanut | REAL | "peanut butter" and "peanut flour" as items; list milk, soy only |
| 33 | 21105586 | sulphites | NOT REAL | only hit is "colour (sulphite ammonia caramel)": a caramel colour type name, not an added sulphite ingredient (word-sense) |
| 34 | 0076633007037 | sulphites | REAL | "coconut (sodium metabisulfite)" |
| 35 | 0859322004001 | gluten | REAL | "wheat germ"; list nuts, sesame only |
| 36 | 0058336153235 | egg, milk | REAL | "dried whole eggs", "nonfat dry milk, sodium caseinate", "milk protein concentrate"; lists gluten, soy only |
| 37 | 3800213621538 | egg | REAL | "pasteurized liquid egg" |
| 38 | 0038445122636 | gluten | REAL | "wheat starch" item; maltodextrin is a separate item (see Borderline) |
| 39 | 5000354927935 | gluten | REAL | "Wheat Flour" last ingredient (then "Allergy Advice:"); lists empty |
| 40 | 8606033741105 | gluten | REAL | "wheat breadcrumbs" |
| 41 | 0041735165114 | soy | REAL | "hydrolyzed soy protein"; lists gluten, milk |
| 42 | 0811606011587 | milk | REAL | "mozzarella (pasteurized whole cow milk, cultures...)", edam, provolone cheeses; list gluten only; list truncated but cheeses explicit |
| 43 | 0033844004149 | sulphites | REAL | "SODIUM METABISULFITE (AS PRESERVATIVES)" |
| 44 | 0749084003803 | gluten | REAL | "All natural unbleached wheat flour" |
| 45 | 0041460313484 | milk | REAL | "contains less than 2%: buttermilk, sodium caseinate" |
| 46 | 0711535503873 | soy, milk, egg | REAL | "organic soy lecithin", "organic skim milk", "organic eggs" each their own item; list gluten only |
| 47 | 20005108 | sulphites | REAL | "Preservative: Sodium Metabisulphite" |
| 48 | 0094643485171 | egg | REAL | "Cooked Macaroni (Water, Enriched Durum Semolina [...], Egg White Solids)" has no oil/fat/or |
| 49 | 0072878171298 | sulphites | REAL | "SODIUM BISULFITE" own item |
| 50 | 5057780001906 | egg | REAL | "Pasteurised Egg" listed as an ingredient in a garbled merged list (see Borderline) |

#### Totals

REAL 48, NOT REAL 2 (of 50).

#### NOT REAL, by cause

- Free-from claim (1): #6 (7330242240098) "gluten-free wheat starch", "gluten-free oat flakes".
- Word-sense (1): #33 (21105586) "sulphite ammonia caramel" is a colour type, not a sulphite ingredient.

### Round 3 lead re-check

The lead re-checked all 5 NOT REAL records, all 8 borderline calls and 10 random REAL records. Every verdict was confirmed. The borderline calls kept REAL, each with its reason:
- "natural flavor {contains wheat, soybeans, and celery seed}" (A#2) is an explicit contains statement.
- "Sulfites Up To 14 Ppm." (A#12) is a declared presence above 10 ppm.
- "dry whey" (A#44).
- Truncated "soy l..." (A#49) names soy, and it can't be an oil.
- "BARLEY MALT EXTRACT" (B#9): barley malt extract is not an EU-exempt barley derivative.
- "flavourings (with soya and wheat)" (B#29) is explicit.
- "Thiami Pasteurised Egg" (B#50) is a spliced list, but egg is named.
- "whey powder (from milk)" (B#21).

### Round 3: the 5 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) "gluten-free wheat starch" on a product labelled en:no-gluten. Wheat is named, but gluten presence is contradicted, so the record is unclear | 2 (A#3, B#6) | Unclear record under the count's rule |
| (b) A product labelled en:no-gluten whose list says "Pasta (Durum Semolina)". The OFF data contradicts itself | 1 (A#13) | The data |
| (c) "Sodium Benzoate (E-221)": E221 is a sulphite code but the substance named is benzoate. The label contradicts itself | 1 (A#50) | The data |
| (d) "colour (sulphite ammonia": a truncated caramel-colour name (E150d), not an added sulphite | 1 (B#33) | Word sense |

None of the five is the engine telling a user something false. For the user, the engine still flags wheat for (a) and (b) and stays cautious on (c) and (d).

### Round 3 outcome

Under the pre-registered rule (100/100 to claim) the count is **not claimed**. The measured precision is reported: 95/100, 95% Wilson interval 88.8%-97.8%. Progress across rounds: 73/100, then 90/100, then 95/100.

The figures are for engine `0d2357f` with the round-3 rules (`37f89ae`). Whether the number is used anywhere public is the author's decision.

## Round 4 (rules f88bc4a, engine 0d2357f): 46/50 + 47/50 = 93/100

Run: `$C/run6` (`summary.json`; copy in [`results-strict-round4-2026-10-09.json`](results-strict-round4-2026-10-09.json)). Result files: `$C/run6/hc_a_result.md` and `hc_b_result.md`. The run took 20 minutes wall clock. Determinism: shard 2 re-run gave identical counts apart from timing. The engine is unchanged since round 3; only the count's rules changed (R1–R6).

`A` is unchanged: 3,457,538 / 826,465. `B` is unchanged from round 3: 137,251 / 64,333. `strict_missed` is 9,506 for all records (list empty 2,207, partial 7,299) and 2,426 for popular ones (787 / 1,639), down from 9,547 / 2,449. The drop comes from the R4–R6 rules: sulphites 4,640 to 4,615, gluten 789 to 771.

The `strict_sample` came from reservoir seed 5 (200 records). 8 records overlapped rounds 1-3 and were excluded; 100 of the rest were drawn with mulberry32 seed 20261010 and split 50/50 between two independent checkers.

### Checker A

| # | code | missed families | verdict | reason |
|---|---|---|---|---|
| 1 | 0079212176018 | mollusc | REAL | "Ocean clams" first ingredient; allergens list has no en:molluscs |
| 2 | 0871459001975 | milk | NOT REAL | daiya oat cream blend (water, gluten-free oat flour...) - plant-based oat cream, not milk (word-sense) |
| 3 | 0078742033471 | sulphites | REAL | "golden raisins (raisins, sulfur dioxide [to preserve color])"; lists only nuts, peanuts |
| 4 | 3800213621545 | egg | REAL | "pasteurized liquid egg"; lists gluten, soybeans only |
| 5 | 6156000261812 | gluten | NOT REAL | "Wheat milk flavour" - only wheat hit is a flavour (excluded form); malt extract is not strict |
| 6 | 0725439300230 | soy | REAL | "modified soy protein"; lists gelatin, gluten, milk only |
| 7 | 0691430003817 | sulphites | REAL | "potassium metabisulphite" as own item; list has only mustard |
| 8 | 5000129338348 | sulphites | REAL | "Preservative (Sodium metabisulphite)"; list has gluten, soybeans |
| 9 | 0074026003895 | sulphites | REAL | "caramel color with sulfites" explicit sulfite statement, not a sulphite-ammonia name (borderline) |
| 10 | 0024000322306 | celery | REAL | "VEGETABLE STOCK (CONCENTRATES OF ONION, CELERY ROOT AND CARROT)"; lists empty |
| 11 | 0070381121304 | sulphites | REAL | "potassium sorbate and sodium bisulfite [preservative]"; no sulphites tag |
| 12 | 0713733903400 | sulphites | REAL | "sodium sulfite." own item; no sulphites tag |
| 13 | 0683922105048 | fish | REAL | "Boritto tuna" first ingredient; lists empty |
| 14 | 0075450077834 | sulphites | REAL | "sodium sulfite." own item; lists gluten only |
| 15 | 5000169622919 | sulphites | REAL | "preservatives (potassium sorbate, sodium metabisulphite)"; lists empty |
| 16 | 0074548013068 | milk | NOT REAL | "artificial cheddar cheese flavor" - only milk hit is a flavour (excluded form) |
| 17 | 0036800048478 | tree_nut | REAL | "walnuts with bht to preserve freshness"; lists empty |
| 18 | 5060530211180 | soy | REAL | "Emulsifier: Soya Lecithin" is a soy ingredient; list gluten only |
| 19 | 0011284012252 | sulphites | REAL | "evaporated apples (treated with sulfur dioxide to preserve color)"; no sulphites tag |
| 20 | 6423150000173 | milk | REAL | "milk lactose" named ingredient; lists empty; text truncated ("pasteurized sheep, rennet") but readable (borderline) |
| 21 | 0814453021907 | soy | REAL | "non-GMO soy sauce (water, non-GMO soybeans, wheat...)"; list lacks soy |
| 22 | 0017109327563 | soy | REAL | "SOY LECITHIN-AN EMULSIFIER" in both chocolates; list milk only |
| 23 | 0722001042451 | sulphites | REAL | "and sodium metabisulfite (as a preservative)"; no sulphites tag |
| 24 | 0070038655169 | milk | REAL | "nonfat dry milk"; list gluten only (text cut off at "derived from mil") |
| 25 | 0814377010476 | mustard | REAL | "mustard powder*"; list nuts only |
| 26 | 10653017510016 | sulphites | REAL | "DOUGH CONDITIONER (SODIUM METABISULFITE)"; list gluten only |
| 27 | 4820179252842 | sulphites | REAL | "antioxidants (ascorbyl palmitate, sodium metabisulphite)"; list chicken, milk |
| 28 | 0041497033515 | gluten | REAL | "UNBLEACHED DURUM FLOUR ENRICHED WITH WHEAT" in manicotti pasta; list eggs, milk, no gluten (odd phrasing, borderline) |
| 29 | 0080444513045 | fish | REAL | "light tuna" first ingredient; list gluten, mustard |
| 30 | 03432004 | sulphites | REAL | "sodium metabisulfite (to maintain freshness)"; list lacks sulphites (inside unclosed lecithin bracket, borderline) |
| 31 | 0071007024689 | sulphites | REAL | "dough conditioners (yeast, wheat gluten, sugar, guar gum, food starch, sodium metabisulfite)"; no sulphites tag |
| 32 | 0031146023134 | fish | REAL | "dried fish cake (pollock...)", "fish sauce (corvina...)"; list has no en:fish |
| 33 | 0075450149937 | milk | REAL | "nonfat dry milk" own item; list gluten, soybeans |
| 34 | 5057624360930 | sulphites | REAL | "Preservative: Sodium Metabisulphite"; no sulphites tag |
| 35 | 5015282127906 | crustacean | NOT REAL | "Prawn Cocktail Flavour [Salt, Wheat Flour..." - prawn only as a flavour, no prawn ingredient |
| 36 | 0076606738500 | sulphites | REAL | "sodium metabisulphite" own item; no sulphites tag |
| 37 | 12128877 | sulphites | REAL | "sodium metabisulfite {antioxidant}"; list gluten only |
| 38 | 3800213621026 | egg | REAL | "egg melang" (egg melange); list lacks egg |
| 39 | 0041497210169 | sulphites | REAL | "AND SULFUR DIOXIDE (PRESERVATIVE)"; lists empty |
| 40 | 5057624360794 | sulphites | REAL | "Preservative: Sodium MetabiSULPHITE"; no sulphites tag |
| 41 | 5900353615980 | soy | REAL | "lecithins (from soya)" x3; allergens apple, milk, traces eggs/gluten/nuts, no soy |
| 42 | 0647669255244 | milk | REAL | "nonfat milk" and "whey"; list eggs, gluten, soybeans |
| 43 | 0851353005583 | egg | REAL | "cage free eggs" (not egg free); list lacks egg |
| 44 | 0054100007056 | sulphites | REAL | "preservatives (sodium benzoate, sodium bisulfite)"; lists empty |
| 45 | 0075450168952 | sulphites | REAL | "sodium metabisulfite (dough conditioner)"; no sulphites tag |
| 46 | 0034000048786 | sulphites | REAL | "Sodium Metabisulfite, To Maintain Freshness"; list milk, nuts, soy |
| 47 | 0076010000057 | mustard | REAL | "mayonnaise (... egg yolks, ... mustard seed ...)"; list has no mustard |
| 48 | 0071725728241 | sulphites | REAL | "dried papaya (... sulfur dioxide (to preserve color))"; no sulphites tag |
| 49 | 5059697764134 | sulphites | REAL | "Preservative (Sodium Metabisulphite)"; list pork only |
| 50 | 0007473431607 | sulphites | REAL | "sodium metabisulphite (for color retention)"; lists empty |

#### Totals
REAL 46, NOT REAL 4 of 50.

#### NOT REAL by cause
- Excluded flavour form (the flavour is the only hit): #5 (6156000261812, "Wheat milk flavour"), #16 (0074548013068, "artificial cheddar cheese flavor"), #35 (5015282127906, "Prawn Cocktail Flavour").
- Word-sense mix-up (plant-based oat cream, not milk): #2 (0871459001975, "daiya oat cream blend").

### Checker B

| # | code | missed families | verdict | reason |
|---|---|---|---|---|
| 1 | 0047495901023 | gluten | REAL | "cultured organic unbleached whole wheat" is an ingredient item; allergens empty |
| 2 | 0007473431615 | sulphites | REAL | "sodium metabisulphite (for color retention)"; both lists empty |
| 3 | 0818371011248 | fish | REAL | "Keta salmon" first ingredient; lists name soy and sesame only |
| 4 | 5051379092061 | milk | REAL | "nonfat dry milk" among ingredients; lists lack milk |
| 5 | 0030700752107 | soy | REAL | "enzyme modified soy protein"; lists lack soy |
| 6 | 5013803340155 | gluten | NOT REAL | Allergy-advice statement, not an ingredient: "For allergens see cereals containing gluten" |
| 7 | 3800065783179 | soy | REAL | "emulsifier: soy-bean lecithin" (twice); soy absent from lists (peanut/nut only as traces) |
| 8 | 4056489903680 | sulphites | REAL | "Antioxidant: Sodium Metabisulphite" |
| 9 | 0818562023630 | sulphites | REAL | "sodium metabisulphite" in strawberry pieces; lists name nuts only |
| 10 | 0072368237930 | sulphites | REAL | "sodium metabisulfite" in red peppers; list names milk only |
| 11 | 0666288205126 | soy | REAL | "hydrolyzed soy & corn protein"; list names fish only |
| 12 | 20020835 | sulphites | REAL | "preservative: sodium metabisulphite"; traces name milk only |
| 13 | 4088600096414 | gluten | REAL | "Wheat Flour" (Unicode bold letters, reads as English); list names apple only |
| 14 | 9330309000410 | sulphites | REAL | "apricots (sulfur dioxide (220))"; E-number consistent |
| 15 | 0076983400052 | sulphites | REAL | "sodium sulfite" as its own item; lists lack sulphites |
| 16 | 0038259117279 | milk | REAL | "whey powder" in spread; list names gluten only |
| 17 | 0084253242837 | egg, celery | REAL | "organic egg white" in pasta and "organic celery"; list names gluten only |
| 18 | 0077745296241 | sulphites | REAL | "sulfur dioxide and sodium metabisulfite [for color retention]"; lists lack sulphites |
| 19 | 0041679842423 | soy | REAL | "soy protein isolate"; list names milk only |
| 20 | 0855026001704 | egg | REAL | "Cage-Free Eggs"; list names milk only; no egg-free label |
| 21 | 5060336505063 | sulphites | REAL | "preservative : sodium Metabisulphite" (separate from the caramel sulphite ammonia item) |
| 22 | 0070038641858 | milk | REAL | "sodium caseinate" as its own item; lists name soy only |
| 23 | 5060482840513 | tree_nut | REAL | "roasted almond butter (8%)" is almonds; lists empty; no nut-free label |
| 24 | 4099100123258 | sulphites | REAL | "SODIUM BISULFITE"; lists empty |
| 25 | 0070057001909 | crustacean | REAL | "crab meat" first ingredient |
| 26 | 8853333003161 | milk | NOT REAL | Word-sense mix-up: "Corn milk 98.03%" is a corn drink, not dairy |
| 27 | 0041415040083 | soy | REAL | "hydrolyzed protein (corn, soy & wheat)"; lists lack soy |
| 28 | 5010102113282 | sulphites | REAL | "Preservatives (Potassium Sorbate, Sodium Metabisulphite)"; list names gluten only |
| 29 | 0055742567595 | celery | REAL | "celery guar gum" item (likely celery plus guar gum); list lacks celery |
| 30 | 0688267144127 | sulphites | REAL | "raisins, sulfur dioxide [to preserve color]" |
| 31 | 0024812500077 | gluten, soy | REAL | "hydrolyzed corn and wheat gluten and soy protein" (wheat gluten explicit, soy explicit); list names milk only |
| 32 | 8906032011019 | soy | REAL | Sole ingredient "Defatted Soy"; lists empty |
| 33 | 0046567038919 | sulphites | REAL | "raisins, sulfur dioxide [for color retention]" |
| 34 | 0075450234077 | sulphites | REAL | "sodium sulfite" as own item |
| 35 | 0751269010223 | peanut | NOT REAL | Shared-equipment sentence: "shares equipment with peanuts" |
| 36 | 0075391029503 | fish | REAL | "Farm-Raised Catfish" first ingredient |
| 37 | 4088600374758 | sulphites | REAL | "preservative: sodium metabisulphite" |
| 38 | 0070253299186 | sulphites | REAL | "preservative (... sodium bisulfite ...)" |
| 39 | 0033092004106 | egg | REAL | "egg barley malt extract" (egg named; missing comma likely); lists lack egg |
| 40 | 0644209415267 | egg | REAL | "dried whole eggs"; lists lack egg |
| 41 | 0014800006704 | sulphites | REAL | "sodium metabisulfite"; lists empty |
| 42 | 0016600001262 | sulphites | REAL | "sodium metabisulfite (preservative)" |
| 43 | 0011150093514 | sulphites | REAL | "sodium metabisulfite (preservative)" |
| 44 | 0666140102730 | gluten | REAL | "confectioner's glaze wheat starch" names wheat; list names soy only |
| 45 | 5000168201665 | gluten | REAL | "Wholemeal Wheat Flour"; lists lack gluten |
| 46 | 0029210185307 | sulphites | REAL | "Preservative: Sodium Metabisulphite"; list names gluten only |
| 47 | 0064777816127 | sulphites | REAL | "sodium metabisulfite [preservative]" |
| 48 | 0073347008008 | milk | REAL | "nonfat milk" as own item; list names gluten only |
| 49 | 0041224465428 | sulphites | REAL | "SODIUM METABISULFITE (AS A PRESERVATIVE)" |
| 50 | 0854285000602 | peanut, fish | REAL | "peanut paste", "roasted peanuts" and "fish sauce (anchovy...)"; lists name gluten and soy only |

#### Totals
REAL 47, NOT REAL 3 (of 50).

#### NOT REAL, by cause
- Allergy-advice statement, not an ingredient: #6 (5013803340155, "For allergens see cereals containing gluten").
- Word-sense mix-up: #26 (8853333003161, "Corn milk 98.03%").
- Shared-equipment sentence: #35 (0751269010223, "shares equipment with peanuts").

### Round 4 lead re-check

The lead re-checked all 7 NOT REAL records, all 8 borderline calls and 10 random REAL records. Every verdict was confirmed. The borderline calls kept REAL:
- "caramel color with sulfites" (A#9) is an explicit sulphite statement.
- "milk lactose" (A#20).
- "durum flour enriched with wheat" (A#28).
- "sodium metabisulfite (to maintain freshness)" (A#30).
- "egg barley malt extract" (B#39): egg is named either way.
- Celery in a filling (B#29).
- Unicode-bold "Wheat Flour" (B#13).
- "confectioner's glaze wheat starch" (B#44).

### Round 4: the 7 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) Named flavours that the flavour exclusion didn't catch, because it only matches the term directly followed by "flavour": "artificial cheddar cheese flavor", "Prawn Cocktail Flavour", "Wheat milk flavour" | 3 (A#16, A#35, A#5) | The flavour exclusion (and the engine's flavour downgrade) |
| (b) Plant "milk" or "cream" read as dairy: "Corn milk 98.03%", "daiya oat cream blend" | 2 (B#26, A#2) | Engine fault, being fixed |
| (c) A shared-equipment sentence: "shares equipment with peanuts" | 1 (B#35) | Engine fault, being fixed |
| (d) UK allergy-advice boilerplate: "For allergens see cereals containing gluten" | 1 (B#6) | Engine fault, being fixed |

(b), (c) and (d), plus the flavour downgrade, are engine faults now being fixed.

### Round 4 outcome

Under the pre-registered rule (100/100 to claim) the count is **not claimed**. The measured precision is reported: 93/100, 95% Wilson interval 86.3%-96.6%. Progress across rounds: 73/100, then 90/100, then 95/100, then 93/100.

A 100/100 sample is only likely if true precision is about 99%. At 95% true precision, 100/100 happens about 0.6% of the time (0.95^100). Rounds 3 and 4 put the count's precision at about 93-95%. Each round found new long-tail cases, so further rule rounds were stopped.

The figures are for engine `0d2357f` and the R1–R6 count rules. Whether the number is used anywhere public is the author's decision.

## Round 5 (rules 04e5241, engine 858d317): 47/50 + 49/50 = 96/100 by the checkers, 97/100 after lead re-check

Run: `$C/run7` (`summary.json`; copy in [`results-strict-round5-2026-10-09.json`](results-strict-round5-2026-10-09.json)). Result files: `$C/run7/hc_a_result.md` and `hc_b_result.md`. The slowest shard took 2,391 s. Determinism: shard 2 re-run gave identical counts apart from `seconds`. The rules (commit `04e5241`) were pre-registered before the run; the engine as run is `858d317`.

`A` is unchanged: 3,457,538 / 826,465. `strict_missed` is 8,551 for all records (list empty 2,098, partial 6,453) and 2,161 for popular ones (735 / 1,426), down from 9,506 / 2,426 in round 4.

The `strict_sample` came from reservoir seed 9 (200 records). 5 records overlapped earlier rounds and were excluded; the draw excluded every code in `run3` to `run6` `hc_a`/`hc_b`. 100 were drawn with mulberry32 seed 20261011 from `run7/strict_sample.json` and split into `run7/hc_a.json` and `hc_b.json`, 50/50 between two independent checkers.

### Checker A

| # | code | missed families | words that name it | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0249180001203 | egg | "Whole Egg Powder" | REAL | egg ingredient; tags lack eggs |
| 2 | 0028000302658 | soy | "soy lecithin" | REAL | soy lecithin is soy (FALCPA/EU); tags empty |
| 3 | 0087041769813 | celery | "celery seed", "celery salt" | REAL | celery ingredient (EU Annex II); tags only fish |
| 4 | 4088600502410 | sulphites | "Preservative: Sodium Metabisulphite" | REAL | sulphite additive |
| 5 | 0850028332504 | tree_nut | "almond butter" | REAL | almond ingredient; tags lack nuts |
| 6 | 0070662030486 | crustacean | "shrimp powder", "krill" | REAL | crustacean ingredients |
| 7 | 0035826097125 | sulphites | "sodium sulfite" | REAL | sulphite additive |
| 8 | 5057545619681 | sulphites | "Preservative (Sodium Metabisulphite)" | REAL | sulphite additive |
| 9 | 29086863 | sesame | "Not suitable for Nut, Peanut and Sesame allergy sufferers" | NOT REAL | sesame appears only in an allergy-advice sentence, not as an ingredient |
| 10 | 0035900297847 | soy | "soy lecithin-an emulsifier" | REAL | soy lecithin; tags lack soybeans |
| 11 | 0078742065939 | soy | "modified soy protein" | REAL | soy protein |
| 12 | 0858494004130 | milk, egg | "hormone free butter", "cage free eggs" | REAL | both are ingredients ("free" qualifies hormones/cage, not milk/egg); both families absent from tags |
| 13 | 0733147110522 | milk | "butter milk powder" | REAL | buttermilk powder is milk |
| 14 | 0079911023132 | milk | "sodium caseinate" | REAL | casein is milk |
| 15 | 0027331032319 | sulphites | "Sodium metabisulphite" | REAL | sulphite additive |
| 16 | 0011110892218 | celery | "spices (contains mustard and celery seed)" | REAL | celery seed named as contained in spices |
| 17 | 5030765036216 | egg, milk | "Pasteurised Egg", "Skimmed Milk Powder", "Dried Egg White" | REAL | both ingredients, both absent from tags |
| 18 | 0605870001302 | gluten | "Wholegrain rye flour" | REAL | rye is gluten cereal; tags only sesame |
| 19 | 0054100008350 | sulphites | "sodium metabisulfite" | REAL | sulphite additive |
| 20 | 5000159550567 | soy | "emulsifier (soya ecit." | NOT REAL (borderline) | text is truncated/garbled ("soya ecit"); likely soya lecithin but could be an exempt soya oil; unclear = NOT REAL |
| 21 | 0073366129180 | milk | "unsalted butter" | REAL | butter is milk |
| 22 | 0738912022451 | sulphites | "freshness preserved with sodium bisulfite" | REAL | sulphite additive in potato flakes |
| 23 | 0016000439771 | egg | "Dried Egg White" | REAL | egg white ingredient (comma missing before "Sweetened Condensed Milk" but egg white is plainly named) |
| 24 | 0032251490200 | sulphites | "dried diced pineapple (... sulfur dioxide)" | REAL | sulphur dioxide named as ingredient of pineapple |
| 25 | 24969604 | tree_nut, milk | "dry roasted macadamia nuts", "nonfat dry milk" | REAL | both ingredients; tags only gluten |
| 26 | 0086600000152 | fish | "White tuna" | REAL | tuna is fish |
| 27 | 0644209425235 | egg | "dried whole eggs" | REAL | egg ingredient |
| 28 | 4088600392240 | sulphites | "Preservative: Sodium Metabisulphite" | REAL | sulphite additive |
| 29 | 0856312002252 | milk | "Filtered lowfat grade a milk" | REAL | milk is the first ingredient; tags empty |
| 30 | 0074164300721 | milk | "nonfat milk", "whey solids" | REAL | milk ingredients |
| 31 | 0013000012898 | egg | "enzyme modified egg yolk" | REAL | egg ingredient |
| 32 | 0077890311455 | sulphites | "coconut (coconut, sugar, sulfur dioxide [color retention])" | REAL | sulphur dioxide named |
| 33 | 4088600547503 | sulphites | "preservative: sodium metabisulphite" | REAL | sulphite additive |
| 34 | 0041449473215 | milk | "whole milk powder" | REAL | milk ingredient |
| 35 | 0041303820247 | gluten | "semolina wheat flour" | REAL | wheat; tags lack gluten |
| 36 | 0851830005013 | milk, egg | "sweet whey solids", "whole egg solids" | REAL | both ingredients, absent from tags |
| 37 | 4061459332254 | sulphites | "SODIUM METABISULFITE" | REAL | sulphite additive |
| 38 | 4099100238952 | sulphites | "sodium sulfite" | REAL | sulphite additive |
| 39 | 5051777000170 | sulphites | "sulphur dioxide e220" (in mixed peel) | REAL | sulphur dioxide/E220 named as a mixed-peel ingredient |
| 40 | 0711381312384 | sulphites | "balsamic vinegar (naturally occurring sulfur dioxide)" | REAL (borderline) | text states the vinegar ingredient contains sulphur dioxide; not an added additive but an explicit statement of Annex II content |
| 41 | 0856260004070 | tree_nut | "Almond Meal" | REAL | almond ingredient; tags empty |
| 42 | 4088600547510 | sulphites | "Preservative: Sodium Metabisulphite" | REAL | sulphite additive |
| 43 | 5053947841811 | sulphites | "Preservative (Sodium Metabisulphite)" | REAL | sulphite additive |
| 44 | 0018894702054 | milk | "buttermilk solids", "sodium caseinate" | REAL | milk ingredients |
| 45 | 0076606691348 | sulphites | "sodium metabisulfite" | REAL | sulphite additive |
| 46 | 0041318101188 | sulphites | "sodium bisulfite" (potato flakes) | REAL | sulphite additive |
| 47 | 0857554005742 | soy | "organic rice miso (organic rice, water, salt, alcohol, koji culture)" | NOT REAL (borderline) | soy is never named; the miso is specified as rice/koji; inferring soybeans is outside the text, unclear = NOT REAL |
| 48 | 0810882010048 | celery | "celery onions" | REAL (borderline) | likely "celery, onions" with a missing comma; celery is named under either reading |
| 49 | 0084501446314 | sulphites | "sodium metabisulfite (preservative)" | REAL | sulphite additive |
| 50 | 0850246005013 | mustard | "organic yellow mustard" | REAL | mustard ingredient; tags only nuts |

#### Totals
REAL 47, NOT REAL 3 of 50: 29086863 (#9), 5000159550567 (#20, borderline), 0857554005742 (#47, borderline).

### Checker B

| # | code | missed families | words that name it | verdict | reason |
|---|---|---|---|---|---|
| 1 | 4007415025044 | sulphites | "potassium metabisulphite" | REAL | sulphite preservative named; sulphites not in either list |
| 2 | 0041270498081 | milk | "non fat milk", "whey solids" | REAL | milk ingredients; lists lack milk |
| 3 | 8718774046989 | peanut, egg | only "May contain traces of gluten. egg peanuts and nuts." | NOT REAL | egg and peanut appear only in a may-contain sentence (both families fail) |
| 4 | 0770981561004 | egg | "egg white yeast" | REAL (borderline) | "egg white" named (missing comma before yeast); lists lack egg |
| 5 | 0865326000000 | sulphites | "sodium bisulfite" | REAL | sulphite named; lists lack sulphites |
| 6 | 0038718709472 | sulphites | "sulfur dioxide", "sodium metabisulfite" | REAL | sulphites named; lists lack them |
| 7 | 0855569003159 | tree_nut | "organic almond butter" | REAL | almond is a tree nut; lists lack nuts |
| 8 | 0023000356755 | sulphites | "SODIUM BISULFITE" | REAL | sulphite preservative named |
| 9 | 0041196102659 | gluten | "Semolina Wheat" | REAL | wheat pasta; gluten absent from lists |
| 10 | 0041224604469 | sulphites | "sulfur dioxide (as a preservative)" | REAL | sulphite named |
| 11 | 0070470489872 | milk | "Pasteurized grade a milk" | REAL | milk is the first ingredient; lists empty |
| 12 | 0011110005083 | sulphites | "POTASSIUM METABISULFITE" | REAL | sulphite named |
| 13 | 4897038191291 | soy | "brewed soybean sauce" | REAL | soy sauce contains soy; allergen/traces lists lack soybeans |
| 14 | 0738759895331 | milk | "miscellar casein protein", "buttermilk powder" | REAL | milk ingredients; list has only gluten |
| 15 | 0747599322853 | soy | "soy lecithin-an emulsifier" | REAL | soy lecithin is soy (not an exempt oil); lists lack soybeans |
| 16 | 0018894141563 | gluten | "semolina wheat flour", "enriched flour" | REAL | wheat ingredient; lists lack gluten |
| 17 | 4904561061059 | sesame | "black sesame salt" | REAL (borderline) | sesame named; text otherwise garbled but sesame is clear |
| 18 | 0854590008010 | egg | "cage-free eggs" | REAL | egg ingredient; lists lack eggs |
| 19 | 0030000562925 | sulphites | "sodium sulfite" | REAL | sulphite named as treatment of apple pieces, still an ingredient statement |
| 20 | 7622210286123 | sulphites | "sodium metabisulfite" | REAL | sulphite named; lists lack sulphites |
| 21 | 0073484171023 | egg | "egg" (before "icing packet:") | REAL (borderline) | egg listed as ingredient of the mix; lists lack eggs; word sits right before "icing packet" with no comma |
| 22 | 0072878698801 | sesame | "less than 2% of sesame seeds" | REAL | sesame ingredient; lists lack sesame |
| 23 | 4056489901174 | sulphites | "sodium metabisulphite" | REAL | sulphite named |
| 24 | 0084213000187 | gluten | "whole meal rye, whole rye flour" | REAL | rye is gluten; lists lack gluten |
| 25 | 0035826079619 | sulphites | "sodium bisulfite" | REAL | sulphite named in preservatives bracket |
| 26 | 0032251411427 | soy | "enzyme modified soy protein" | REAL | soy protein; lists lack soybeans |
| 27 | 0036632010469 | milk | "Cultured grade a low fat milk", "milk minerals" | REAL | milk ingredient; lists empty |
| 28 | 0077260042224 | sulphites | "coconut with sodium metabisulfite", "sulfur dioxide (preserves color)" | REAL | sulphites named; lists lack them |
| 29 | 0072799039844 | soy | "soy lecithin emulsifier" | REAL | soy lecithin; lists lack soybeans |
| 30 | 0032458970901 | mustard | "spices including mustard" | REAL | mustard named as an ingredient; lists have only sesame |
| 31 | 8410577130017 | sulphites | "preservatives E-202, E-220" | REAL (borderline) | E-220 is the code for sulphur dioxide, no word spelled out; relies on the E-number (borderline) |
| 32 | 0026825006560 | sulphites | "sodium metabisulfite, (preservative)" | REAL | sulphite named |
| 33 | 4056489980551 | sulphites | "sodium sulfite" | REAL | sulphite named; list has only milk |
| 34 | 4088600064017 | egg | "Lysozyme" | REAL (borderline) | lysozyme (E1105) is made from egg white and is declared as egg under EU Annex II; the text does not say egg (borderline) |
| 35 | 0738912022307 | sulphites | "freshness preserved with sodium bisulfite" | REAL | sulphite named |
| 36 | 0036632036414 | milk | "Cultured grade a low fat milk", "milk minerals" | REAL | milk ingredient; lists empty |
| 37 | 0044400161305 | sulphites | "sodium bisulfite (preservative)" | REAL | sulphite named |
| 38 | 0043646461019 | sulphites | "POTASSIUM METABISULFITE (PRESERVATIVE)" | REAL | sulphite named; list has only mustard |
| 39 | 0094184011938 | sulphites | "raisins (sulfur dioxide)" | REAL | sulphite named |
| 40 | 5063334002664 | sulphites | "Sodium Metabisulphite" | REAL | sulphite named |
| 41 | 0004656701950 | sulphites | "sodium sulfite" | REAL | sulphite named |
| 42 | 0051933656284 | sulphites | "flour improving agent (sodium metabisulphite)" | REAL | sulphite named |
| 43 | 0031000007300 | sulphites | "Sodium Bisulfite" | REAL | sulphite named |
| 44 | 5000168006666 | sulphites | "flour treatment agent (sodium metabisulphite)" | REAL | sulphite named; traces list has only nuts and peanuts |
| 45 | 0048176402105 | gluten | "00 SOFT WHEAT" | REAL | wheat ingredient; lists empty |
| 46 | 0025600085080 | sulphites, tree_nut | sulphites: "coconut (with sodium metabisulfite..."; tree nut: "roasted diced almonds" | REAL | both families named as ingredients; lists lack sulphites and nuts |
| 47 | 0075450151008 | milk | "nonfat milk" | REAL | milk ingredient; lists lack milk |
| 48 | 0706950667170 | sulphites | "potassium metabisulphite" | REAL | sulphite named |
| 49 | 0720692820570 | gluten | "durum flour" | REAL | durum wheat is gluten; lists lack gluten |
| 50 | 0886926216950 | sulphites | "sodium metabisulfite (added as a preservative)" | REAL | sulphite named |

#### Totals
REAL 49, NOT REAL 1 of 50: 8718774046989 (#3).

Checkers combined: 96/100.

### Round 5 lead re-check

The lead re-checked every NOT REAL, every borderline and 10 random REAL records.

NOT REAL, by record:
- 29086863 (sesame): NOT REAL, agree. The only mention is "Not suitable for Nut, Peanut and Sesame allergy sufferers." The engine reads this warning as "contains".
- 5000159550567 (soy): **the lead overrides checker A to REAL.** The text "emulsifier (soya ecit. egg white powder." is a truncated "soya lecithin". An emulsifier named as soya is not an oil, so the refined-soya-oil exemption cannot apply. This is a disagreement between the lead and checker A; the checkers alone gave 96/100, and 96/100 if the checker's call stands.
- 0857554005742 (soy): NOT REAL, agree. "organic rice miso (organic rice, water, salt, alcohol, koji culture)": the miso's own composition names no soy, so this is a soy-free miso. The engine and the strict list treat "miso" as soy.
- 8718774046989 (peanut and egg): NOT REAL, agree. "May contain traces of gluten. egg peanuts and nuts." A stray full stop cuts the may-contain sentence, so "egg peanuts and nuts" is read as an ingredient.

Borderline calls kept REAL, lead agrees:
- 0711381312384 sulphites: "balsamic vinegar (naturally occurring sulfur dioxide)" names sulphur dioxide; R3 covers "naturally occurring in", not this.
- 0810882010048 celery: "celery onions", a missing comma.
- 0770981561004 egg: "egg white yeast".
- 4904561061059 sesame: "black sesame salt".
- 0073484171023 egg: egg before "icing packet:".
- 8410577130017 sulphites: "preservatives E-202, E-220"; E220 is sulphur dioxide, and R5 allows a code plus "preservative".
- 4088600064017 egg: "Lysozyme", egg-derived, declared as egg under EU Annex II.

10 random REAL records re-checked, all REAL: 0032251411427, 0856312002252, 0865326000000, 0738759895331, 0078742065939, 4088600502410, 0087041769813, 0706950667170, 5030765036216, 0011110005083.

### Round 5: the 3 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) A "not suitable for … allergy sufferers" warning read as "contains" | 1 (A#9, 29086863) | Engine reads the warning as "contains" |
| (b) A may-contain sentence cut by a stray full stop, so the allergens after it read as ingredients | 1 (B#3, 8718774046989) | Engine reads the sentence as an ingredient |
| (c) A soy-free rice miso read as soy | 1 (A#47, 0857554005742) | The engine and the strict list treat "miso" as soy |

### Round 5 outcome

Result: **97 of 100 real after the lead re-check** (96 by the checkers alone). The 95% Wilson interval for 97/100 is 91.5%-99.0%. Under the pre-registered rule (100/100 to claim) the count is **not claimed**. The measured precision is reported: 97/100. Progress across rounds: 73/100, then 90/100, then 95/100, then 93/100, then 97/100.

Separately, and not part of the count: the round-5 vanished-hit audit of the run found two fail-opens introduced in engine `858d317`. The allergy-advice strip removed a real "For allergens see cereals containing gluten, nuts, soya and sulphites" (5013803340155, gluten lost), and "peanut milk" as a plant milk hid "milk" in garbled text (0034952369342). It also found asafoetida (0664648120492) losing its only gluten signal. These were fixed in engine commit `9313dbb`.

The figures are for engine `858d317` and the R1–R7 count rules. Whether the number is used anywhere public is the author's decision.

## Round 6 (rules 4f594cd, engine fa229b8): 47/50 + 48/50 = 95/100

Run: `$C/run9` (`summary.json`; copy in [`results-strict-round6-2026-10-09.json`](results-strict-round6-2026-10-09.json)). Result files: `$C/run9/hc_a_result.md` and `hc_b_result.md`. The slowest shard took 2,476.5 s (wall clock 2,477 s). Determinism: shard 2 re-run gave identical counts apart from `seconds`. The rules (commit `4f594cd`, R1–R7 unchanged, `strict_sample` seed 13) were pre-registered before the run; the engine as run is `fa229b8`.

`A` is unchanged: 3,457,538 / 826,465 (total 4,784,317 / 1,552,376). `strict_missed` is 8,516 for all records (list empty 2,094, partial 6,422) and 2,142 for popular ones (732 / 1,410), down from 8,551 / 2,161 in round 5.

Engine history for this round: the round-5 fail-opens were fixed in `9313dbb`. The first attempt at the three round-5 misses, `145267b`, was reverted (`5009f9b`) because on full data it downgraded about 7,600 family "contains" results, including real ingredients (for example "CONTIENE: … SOYA", "lecithina de soya", "contains one or more of the following" lists, and an unclosed bracket that swallowed the rest of a text); no allergen vanished. `fa229b8` is the narrow redo. Its full-data downgrade gate, run before the engine commit: 431 family-records went from contains to weaker, all one of the three intended patterns (not-suitable-for sentence 291, cut list after a precaution 98, soy-free miso 42); none went to nothing.

The `strict_sample` came from reservoir seed 13 (pool of 200 records). 9 records overlapped earlier rounds and were excluded; the draw excluded every code in `run3` to `run7` `hc_a`/`hc_b`. 100 were drawn with mulberry32 seed 20261012 from `run9/strict_sample.json` and split into `run9/hc_a.json` and `hc_b.json`, 50/50 between two independent checkers.

### Checker A

| # | code | missed families | ingredient words | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0068246700047 | egg | "liquid egg" | REAL | egg named; list has milk only |
| 2 | 0886926377613 | peanut | "peanut butter (roasted peanuts)" | REAL | peanut named; list gluten only |
| 3 | 0961003011731 | egg, milk | "fresh eggs; skimmed milk powder" | REAL | both egg and milk named, list gluten only |
| 4 | 0010749011106 | soy | "SOY LECITHIN" | REAL | soy lecithin is soy (not an exempt oil); list gluten, milk |
| 5 | 0072036717047 | sulphites | "sodium bisulfite" | REAL | sulphite additive ingredient; lists empty |
| 6 | 0071007018688 | sulphites | "sodium metabisulfite (dough conditioners)" | REAL | plain list item, no and/or in item; lists lack sulphites |
| 7 | 0007203672132 | soy, milk, egg | "organic soy lecithin; organic skim milk; organic eggs" | REAL | all three named, list gluten only |
| 8 | 0077260044259 | sulphites | "sulfur dioxide; sodium metabisulfite" | REAL | named as ingredients in cherries/coconut/apricots items; no sulphite tag |
| 9 | 0042272011506 | gluten | "durum flour (lasagna pasta)" | REAL | durum is wheat; list milk only |
| 10 | 8008698048788 | milk | "lactose-free storage" | NOT REAL | 'lactose-free' is a free-from wording, no milk ingredient |
| 11 | 0722252334039 | tree_nut | "macadamia nut butter" | REAL | macadamia is a tree nut; list milk, soybeans |
| 12 | 0041331031394 | sulphites | "sodium bisulfite" | REAL | sulphite preservative; lists empty |
| 13 | 5010102115491 | sulphites | "sodium metabisulphite" | REAL | sulphite preservative; list apple only |
| 14 | 0041512134746 | tree_nut | "almond meal" | REAL | almond is tree nut; no nuts tag |
| 15 | 5020379171458 | egg | "pasteurised whole egg (6%)" | REAL | egg named; list gluten, milk |
| 16 | 0013562300693 | gluten | "ORGANIC WHEAT PEACE PASTA" | REAL | wheat pasta ingredient; list milk only (borderline: odd product-style name) |
| 17 | 0072981005251 | sulphites | "sodium sulfite" | REAL | sulphite ingredient; no sulphite tag |
| 18 | 0041303051979 | sulphites | "sulfur dioxide [for color retention]; sulfur dioxide (as preservative)" | REAL | sulphur dioxide named; list nuts, peanuts, soybeans |
| 19 | 20674526 | sulphites | "Preservative: Sodium Metabisulphite" | REAL | sulphite named repeatedly; lists empty |
| 20 | 0085239156902 | sulphites | "sulfur dioxide (preservative)" | REAL | lists empty |
| 21 | 0073575703027 | fish | "dried bonito mix" | REAL | bonito is fish; list gluten, soybeans |
| 22 | 0041497546213 | soy | "modified soy protein" | REAL | soy protein is soy; list gelatin, gluten, milk |
| 23 | 0747479300032 | gluten | "pasta (durum semolina)" | REAL | durum semolina is wheat; no gluten tag |
| 24 | 0859098005318 | crustacean | "crawfish" | REAL | crawfish is a crustacean; no crustacean tag |
| 25 | 5011022008047 | milk | "whey powder mix)" | REAL | whey powder is milk; list gluten, soybeans (borderline: fragmentary text) |
| 26 | 20952310 | sulphites | "preservative: sodium metabisulphite" | REAL | lists empty |
| 27 | 0075391028421 | sulphites | "sodium bisulfite; sodium metabisulfite" | REAL | list names crustaceans only |
| 28 | 0041130599705 | sulphites | "SULFUR DIOXIDE (A PRESERVATIVE)" | REAL | lists empty |
| 29 | 09020139 | sulphites | "preservative (potassium metabisulphite)" | REAL | sulphite named; no sulphite tag; may-contain only nuts, peanuts |
| 30 | 0711381307472 | celery | "ground celery seeds" | REAL | celery seed is celery; list fish, mustard |
| 31 | 0741643035706 | sulphites | "sodium metabisulfite (preservative)" | REAL | lists empty |
| 32 | 0041133303262 | milk | "buttermilk solids; buttermilk powder; nonfat dry milk; sodium caseinate" | REAL | milk named; list gluten, pork, soybeans |
| 33 | 5057172516032 | sulphites | "Sodium Metabisulphite" | REAL | lists empty |
| 34 | 0085239207192 | soy | "soy mono and diglyceride" | NOT REAL | soy-derived mono/diglyceride is an emulsifier fat, not clearly soy protein; unclear (borderline) |
| 35 | 0851763006057 | gluten | "unbleached white flour; spelt flour" | REAL | spelt is wheat, white flour is wheat flour in US usage; no gluten tag (borderline: 'white flour' alone unspecified, spelt decisive) |
| 36 | 8938504626025 | sulphites | "SODIUM METABISULFITE" | REAL | lists empty |
| 37 | 0071524120017 | sulphites | "sodium metabisulfite (as preservatives)" | REAL | list orange only |
| 38 | 0077890459515 | gluten | "Cooked Wheat Berries (Wheat Berries, Water)" | REAL | wheat named; list soybeans only |
| 39 | 0011594202114 | soy, gluten | "hydrolyzed soy; wheat gluten" | REAL | both named as ingredients, list milk only |
| 40 | 0073210004106 | sulphites | "potassium metabisulfite" | REAL | lists empty |
| 41 | 0631782001529 | egg | "cage-free eggs" | REAL | egg named; list gluten |
| 42 | 0004656702104 | sulphites | "sodium sulfite" | REAL | sulphite named; lists gluten, soybeans |
| 43 | 0674971180063 | egg | "non-gmo cage-free eggs" | REAL | egg named; list gluten, milk, nuts, soybeans |
| 44 | 8850643003416 | sulphites | "sodium metabisulphite" | REAL | sulphite named; no sulphite tag |
| 45 | 0070896040442 | gluten | "wheat starch" | REAL | wheat starch contains wheat (not a glucose-syrup/maltodextrin exemption); list soybeans only |
| 46 | 0053326028074 | soy | "'silica soy and may contain wheat'" | NOT REAL | garbled fragment, soy is not clearly an ingredient (borderline) |
| 47 | 0075450001396 | sulphites | "sulfur dioxide (preservative)" | REAL | lists empty |
| 48 | 0031000006839 | sulphites | "sodium bisulfite" | REAL | sulphite named; no sulphite tag |
| 49 | 0084253269858 | tree_nut | "organic cashew butter" | REAL | cashew is tree nut; lists empty |
| 50 | 0048000003959 | fish | "light tuna" | REAL | tuna is fish; list celery, eggs, mustard |

#### Totals
REAL 47, NOT REAL 3 of 50: 8008698048788, 0085239207192, 0053326028074.

### Checker B

| # | code | missed families | ingredient words | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0073490000003 | sulphites | "potassium metabisulfite" | REAL | sulphite ingredient; lists empty |
| 2 | 0080874414806 | sulphites | "SODIUM METABISULPHITE" | REAL | preservative ingredient; only en:no-gluten label |
| 3 | 0070470496627 | milk | "Pasteurized grade a milk" | REAL | milk is first ingredient; lists empty |
| 4 | 0085239301845 | sulphites | "rice wine vinegar (... contain sulfites)" | REAL | explicit sulfites statement in ingredient; tags lack sulphites |
| 5 | 0703694584749 | lupin | "sweet lupine flour" | REAL | lupin ingredient; tags only eggs, gluten |
| 6 | 0492610205485 | sulphites | "sulfur dioxide (preservative)" | REAL | ingredient; lists empty |
| 7 | 0073405102914 | sulphites | "sodium bisulfite (as preservatives)" | REAL | ingredient; lists empty |
| 8 | 0838054003964 | sulphites | "potassium metabisulphite" | REAL | ingredient; lists empty |
| 9 | 0078742434391 | soy | "soy protein and wheat gluten" | REAL | soy protein is soy; tags gluten, milk only |
| 10 | 5051379028930 | gluten | "Israeli couscous" | REAL (borderline) | couscous is wheat pasta (gluten) but wheat not spelled out; tags only soybeans |
| 11 | 0819710020136 | gluten | "organic semolina wheat flour" | REAL | wheat; tags only milk |
| 12 | 0085239723128 | gluten | "unbleached wheat flour" | REAL | wheat; tags only milk |
| 13 | 0050000549009 | milk | "dry whole milk" | REAL | milk ingredient; tags only gluten |
| 14 | 8712566139385 | sulphites | "potassium METABISULPHITE" | REAL | tags only mustard |
| 15 | 0857484001142 | sulphites | "apricot (containing sulfur dioxide)" | REAL | sulphur dioxide named in ingredient; tags lack sulphites |
| 16 | 0072799036904 | soy | "soy lecithin emulsifier" | REAL | soy lecithin is soy under FALCPA; tags gluten, milk |
| 17 | 0011284050186 | sulphites | "evaporated apples (treated with sulfur dioxide to preserve color)" | REAL (borderline) | SO2 named as treatment within ingredient item, not a separate additive |
| 18 | 0071512512145 | sulphites | "dough conditioners (sodium sulfite, ...)" | REAL | sodium sulfite ingredient |
| 19 | 0070328444640 | mustard | "spices (including mustard, ...)" | REAL | mustard named; tags only celery |
| 20 | 0075450001402 | sulphites | "sulfur dioxide (preservative)" | REAL | ingredient; lists empty |
| 21 | 0804879504207 | soy | "chickpea miso" | NOT REAL | miso here is made from chickpeas, soy not named |
| 22 | 0094331460602 | sulphites | "sodium metabisulfite (as preservative)" | REAL | tags only banana |
| 23 | 0075450174496 | milk | "milk replacement (soya protein, ...)" | NOT REAL | a milk substitute made of soya protein, not milk |
| 24 | 5051399313634 | sulphites | "Potassium Bisulphite, Potassium Metabisulphite" | REAL | preservatives; lists empty |
| 25 | 4056489824466 | sulphites | "Preservative: Sodium Metabisulphite" | REAL | in seasoning; gluten-free label irrelevant |
| 26 | 0659422312460 | milk | "evaporated milk" | REAL | tags eggs, soybeans only |
| 27 | 0041270926300 | sulphites | "sulfur dioxide (preservative)" | REAL | lists empty |
| 28 | 0657522045202 | sesame | "sesame seed meal" | REAL | tags only gluten |
| 29 | 0861050000408 | milk | "sweet cream buttermilk" | REAL | tags gluten, soybeans |
| 30 | 0075071800415 | gluten | "enriched wheat flour" | REAL | crust wheat flour; tags eggs, milk, pork (text truncated but wheat flour is clear) |
| 31 | 5059697705632 | sulphites | "Sodium Metabisulphite" | REAL | lists empty |
| 32 | 0888670017876 | sulphites | "sulfur dioxide [to preserve color]" | REAL | three items; tags only kiwi |
| 33 | 0073218350618 | egg | "eggs with sodium silicoaluminate" | REAL | egg ingredient; tags gluten, milk |
| 34 | 0054100172709 | sulphites | "potassium metabisulfite" | REAL | lists empty |
| 35 | 0015400827706 | milk | "non fat milk", "whey solids" | REAL | tags lack milk |
| 36 | 0097342000249 | mustard | "#1 mustard seed" | REAL | tags only soybeans |
| 37 | 0190912100582 | tree_nut | "Cashew Butter*" | REAL | cashew is tree nut; tags only peanuts (not en:nuts) |
| 38 | 0859283003273 | egg | "whole dried egg powder" | REAL | tags gluten, milk, soybeans |
| 39 | 0011110833310 | sulphites | "DRIED FRUIT TREATED WITH SODIUM BISULFITE AND SULFUR DIOXIDE" | REAL (borderline) | treatment statement after the list, not an ingredient line, but it names the additives actually used; tags banana, nuts |
| 40 | 0760941241565 | sulphites | "preservative (sodium bisulfites)", "sodium metabisulfite (preservative)" | REAL | tags lack sulphites |
| 41 | 0072730262171 | milk | "Grade a lowfat milk" | REAL | lists empty |
| 42 | 4335619183414 | sulphites | "sodium metabisulphite" | REAL | vegan label irrelevant; lists empty |
| 43 | 0850016839961 | mustard | "SPICES (INCLUDES MUSTARD)" | REAL | tags eggs, milk, soybeans |
| 44 | 8001060000933 | sulphites | "antioxidant (residual sulfur dioxide)" | REAL (borderline) | "residual" but listed as an ingredient item; no-gluten label only |
| 45 | 5010251980681 | sulphites | "Preservative (sodium metabisulphite)" | REAL | tags gluten, pork |
| 46 | 5056517315064 | fish | "Thai Fish Sauce (Water, Anchovy Fish Extract, ...)" | REAL (borderline) | anchovy in fish sauce is fish; "extract" is not a flavouring exemption here; tags crustaceans, soybeans |
| 47 | 0011213014340 | sulphites | "SULFUR DIOXIDE (PRESERVATIVE)" | REAL | lists empty |
| 48 | 0089016100492 | sulphites | "potassium metabisulfite (preservative)" | REAL | lists empty |
| 49 | 0818371011002 | fish | "Keta salmon" | REAL | tags mustard, sesame, soybeans |
| 50 | 0733636331001 | celery | "ORCANIC CELERY" (vegetable broth concentrate) | REAL (borderline) | typo "ORCANIC" but celery clear; tags only milk |

#### Totals
REAL 48, NOT REAL 2 of 50: 0804879504207, 0075450174496.

Checkers combined: 95/100.

### Round 6 lead re-check

The lead re-checked every NOT REAL, every borderline and 10 random REAL records. The lead agrees with every call of both checkers.

NOT REAL, by record:
- 8008698048788 (milk): NOT REAL, agree. "flavourings,lactose-free storage: dry" is a free-from claim run into a storage line; R4(b)'s free-from phrases don't include "lactose free".
- 0085239207192 (soy): NOT REAL, agree. "soy mono and diglyceride": the glycerides exclusion matches "glycerides" only, not the singular.
- 0053326028074 (soy): NOT REAL, agree. The garbled "magnesium stearate and silica soy and may contain wheat." leaves it unclear whether soy is an ingredient or part of the warning.
- 0804879504207 (soy): NOT REAL, agree. "chickpea miso*": the miso is named by its base, chickpea, and no soy is named. The soy-free-miso rule needs a bracket.
- 0075450174496 (milk): NOT REAL, agree. "milk replacement (soya protein, maltodextrin, cerelose, guar gum, beta carotene)" is a milk substitute.

Borderline calls kept REAL, lead agrees:
- 5051379028930 gluten: "Israeli couscous"; couscous is on the pre-registered strict gluten list, and it is wheat pasta.
- 0011284050186 sulphites: "evaporated apples (treated with sulfur dioxide…)".
- 0011110833310 sulphites: "DRIED FRUIT TREATED WITH SODIUM BISULFITE AND SULFUR DIOXIDE…".
- 8001060000933 sulphites: "antioxidant (residual sulfur dioxide)".
- 5056517315064 fish: "Anchovy Fish Extract" in a fish sauce; fish, not a flavouring.
- 0733636331001 celery: "ORCANIC CELERY".
- 0013562300693 gluten: "ORGANIC WHEAT PEACE PASTA".
- 5011022008047 milk: "whey powder".
- 0851763006057 gluten: "spelt flour".

10 random REAL records re-checked, all REAL: 0190912100582, 0492610205485, 0007203672132, 0075450001396, 0760941241565, 5051399313634, 0674971180063, 0072981005251, 0073575703027, 0859098005318.

### Round 6: the 5 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) A free-from claim run into a storage line ("lactose-free storage") | 1 (A#10, 8008698048788) | The count's rule: R4(b)'s phrases don't include "lactose free" |
| (b) A singular "mono and diglyceride" | 1 (A#34, 0085239207192) | The count's rule: the glycerides exclusion matches "glycerides" only |
| (c) Garbled text, unclear whether soy is an ingredient or part of the warning | 1 (A#46, 0053326028074) | Unclear counts as not real |
| (d) A miso named by its base ("chickpea miso*"), no soy named | 1 (B, 0804879504207) | The soy-free-miso rule needs a bracket |
| (e) A milk substitute ("milk replacement (soya protein, …)") | 1 (B, 0075450174496) | A milk substitute read as dairy |

### Round 6 outcome

Result: **95 of 100 real** (checker A 47/50, checker B 48/50; the lead agrees with every call). The 95% Wilson interval is 88.8%-97.8%. Under the pre-registered rule (100/100 to claim) the count is **not claimed**. The measured precision is reported: 95/100. Progress across rounds: 73/100, then 90/100, then 95/100, then 93/100, then 97/100, then 95/100.

The figures are for engine `fa229b8` and the R1–R7 count rules. Whether the number is used anywhere public is the author's decision.

## Round 7 (rules 4cd40fb, engine fa229b8): 46/50 + 49/50 = 95/100

Run: `$C/run10` (`summary.json`; copy in [`results-strict-round7-2026-10-09.json`](results-strict-round7-2026-10-09.json)). Result files: `$C/run10/hc_a_result.md` and `hc_b_result.md`. The slowest shard took 2,446 s (wall clock 2,447 s). Determinism: shard 2 re-run gave identical counts apart from `seconds`. The rules (commit `4cd40fb`: R8 free-from adjacency, the glyceride singular correction, R9 precaution in the item, R10a base-named miso, R10b substitutes; `strict_sample` seed 17) were committed at 18:32, before the run (shards written 19:11); the engine is unchanged, `fa229b8`.

`A` is 3,457,538 / 826,465 (total 4,784,317 / 1,552,376), as before. `B` is 136,562 / 64,086, equal to round 6's; it differs from round 5's because the engine changed between round 5 and 6 (`9313dbb`, `fa229b8`). `strict_missed` is 8,436 for all records (list empty 2,081, partial 6,355) and 2,116 for popular ones (727 / 1,389), down from 8,516 / 2,142 in round 6.

The `strict_sample` came from reservoir seed 17 (pool of 200 records). 6 records overlapped earlier rounds and were excluded; the draw excluded every code in `run3` to `run7` and `run9` `hc_a`/`hc_b`. 100 were drawn with mulberry32 seed 20261013 from `run10/strict_sample.json` and split into `run10/hc_a.json` and `hc_b.json`, 50/50 between two independent checkers.

### Checker A

| # | code | missed families | ingredient words | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0054100009609 | sulphites | "sodium metabisulfite, potassium metabisulfite" | REAL | named in preservatives; allergen/traces lists empty |
| 2 | 4056489913078 | sulphites | "sodium metabisulphite" | REAL | preservative ingredient; list only apple |
| 3 | 0742287300120 | sulphites | "sodium metabisulphite" | REAL | ingredient; lists empty |
| 4 | 0844527032249 | milk | "whole milk solids, nonfat dry milk" | REAL | melting wafers component; lists gluten/soy only |
| 5 | 0076479162129 | sulphites | "sodium bisulfite" | REAL | ingredient; lists empty |
| 6 | 0021333399227 | milk | "buttermilk solids, nonfat milk, whey solids" | REAL | dairy ingredients; no milk tag |
| 7 | 0100001000457 | sulphites | "sodium metabisulfite" | REAL | in wrap ingredients; no sulphite tag |
| 8 | 5059697767654 | sulphites | "Sodium Metabisulphite" | REAL | preservative ingredient; lists empty |
| 9 | 0085239312339 | milk | "whey powder" | REAL | whey is milk; no milk tag |
| 10 | 5000237128169 | milk | "only 'also may contairi milk'" | NOT REAL | precaution sentence, not an ingredient |
| 11 | 0074175461300 | mollusc | "dried clam broth" | REAL (borderline) | clam is a mollusc (EU Annex II 14); not FALCPA; broth of clam named as ingredient |
| 12 | 0897540001020 | celery | "celery salt" | REAL (borderline) | celery and products thereof (EU Annex II 9); seasoning ingredient; list has only mustard |
| 13 | 0085239029961 | sulphites | "sodium metabisulfite (preservative)" | REAL | ingredient; lists empty |
| 14 | 5000128280976 | sulphites | "Preservative (Potassium Metabisulphite)" | REAL | ingredient; lists empty |
| 15 | 8712566128747 | sulphites | "preservative (potassium METABISULPHITE)" | REAL | list has mustard only |
| 16 | 0013562002566 | milk | "organic whey, organic nonfat milk, organic butter, cheddar cheese" | REAL | list has gluten only |
| 17 | 0196633939791 | sulphites | "sodium metabisulphite" | REAL | ingredient; lists empty |
| 18 | 0812881020400 | soy | "emulsifiers: soy lecithin" | REAL (borderline) | soy lecithin is not an Annex II exemption (only refined oil/fat, tocopherols, phytosterols); lists milk/peanuts only |
| 19 | 0860046002211 | sulphites | "Sodium Metabisulphite" | REAL | list gluten only |
| 20 | 0028400026734 | sulphites | "SODIUM METABISULFITE" | REAL | list has no sulphites |
| 21 | 0011110090720 | sulphites | "SODIUM METABISULFITE" | REAL | vegan label does not affect sulphites; lists gluten/soy |
| 22 | 0070896031884 | gluten | "wheat starch" | REAL (borderline) | wheat starch is wheat (not a maltodextrin/glucose-syrup exemption); list has soy only |
| 23 | 0027154313404 | sulphites | "SODIUM METABISULPHITE" | REAL | list gluten only |
| 24 | 0084617600013 | egg | "cage free eggs" | REAL | 'cage free' is not a free-from claim; no egg tag |
| 25 | 0629241000459 | milk | "milk chocolate, salted butter" | REAL | list nuts/soy only |
| 26 | 0054100173003 | sulphites | "potassium metabisulfite" | REAL | lists empty |
| 27 | 0041331021623 | milk | "COCONUT MILK" | NOT REAL | coconut milk is not dairy |
| 28 | 0044400125802 | sulphites | "sodium bisulfite (preservative)" | REAL | lists crustaceans/milk only |
| 29 | 5012454063451 | egg | "only 'LINDT MILK CHOCOLATE EGG' (product name)" | NOT REAL | product name, no egg ingredient |
| 30 | 4710037218601 | soy | "Sustainable Soya Flour" | REAL | list gluten only |
| 31 | 0859584005242 | egg | "cage-free eggs" | REAL | not a free-from claim; no egg tag |
| 32 | 0079606156336 | sulphites | "dough conditioner (sodium metabisulfite" | REAL | lists beef/gluten/soy |
| 33 | 0028000478247 | soy | "less than 0.5% of soy lecithin" | REAL | list milk only |
| 34 | 0070491801950 | sulphites | "sodium metabisulfite" | REAL | lists empty |
| 35 | 4009790007950 | gluten | "only 'could contain gluten'" | NOT REAL | precaution, not an ingredient (also all its tags aside, gluten not in text as ingredient) |
| 36 | 0851121004046 | milk | "unsalted butter" | REAL | list eggs/gluten |
| 37 | 0071007061400 | sulphites | "sodium metabisulfite" | REAL | list gluten/milk/soy |
| 38 | 0075450060669 | sulphites | "sodium metabisulfite (preservative)" | REAL | lists empty |
| 39 | 0742365004766 | milk | "Organic grade a lowfat milk" | REAL | lists empty |
| 40 | 0054100172907 | sulphites | "potassium metabisulfite" | REAL | lists empty |
| 41 | 0380021363303 | egg | "pasteurized liquid egg" | REAL | list gluten/soy |
| 42 | 0018894520313 | sulphites | "sodium bisulfite" | REAL | list milk only |
| 43 | 0890985000122 | sulphites | "sodium bisulfite (as preservative)" | REAL | lists empty |
| 44 | 0644209004560 | sulphites | "coconut with sodium metabisulfite (preservative)" | REAL | list nuts/soy |
| 45 | 0075730305961 | mustard | "mustard seed" | REAL | list has no mustard |
| 46 | 0099482421311 | soy | "organic soy lecithin" | REAL (borderline) | soy lecithin not exempt; list gluten only |
| 47 | 7090046315445 | sulphites | "SODIUM METABISULPHITE" | REAL | list peach only |
| 48 | 0607880101041 | sulphites | "sulfur dioxide (preservative)" | REAL | lists empty |
| 49 | 0086600240718 | fish | "Light tuna" | REAL | lists empty |
| 50 | 0038259126684 | sulphites | "sodium bisulfite (preservative)" | REAL | list milk only |

#### Totals
REAL 46, NOT REAL 4 of 50: 5000237128169, 0041331021623, 5012454063451, 4009790007950.

### Checker B

| # | code | missed families | ingredient words | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0032251406942 | soy | "enzyme modified soy protein" | REAL | ingredient; allergen list has no soy |
| 2 | 0072799036577 | soy | "emulsifier soy lecithin" | REAL | soy lecithin is soy; list lacks soy |
| 3 | 0015400859738 | soy | "hydrolyzed soy protein" | REAL | ingredient; list lacks soy |
| 4 | 0813224800154 | milk | "milk ingredients" | REAL | ingredient; list has no milk |
| 5 | 5059697265716 | sulphites | "Preservative (Sodium Metabisulphite)" | REAL | listed ingredient; list only pork |
| 6 | 0036632010735 | milk | "Cultured grade a low fat milk", "milk minerals" | REAL | milk first ingredient; lists empty |
| 7 | 0074175322038 | sulphites | "sulfur dioxide (preservative)" | REAL | named ingredient; lists empty |
| 8 | 8906143042445 | soy | "Cut Soy Granules" | REAL | soy ingredient; lists empty |
| 9 | 0018207990253 | celery | "celery salt" | REAL | celery is EU Annex II; list has fish only |
| 10 | 0004656702651 | sulphites | "sodium bisulfite" | REAL | preservative ingredient; list only milk |
| 11 | 0011213088723 | sulphites | "dough conditioner (sodium metabisulfite)" | REAL | ingredient; list lacks sulphites |
| 12 | 0749826125527 | tree nut | "almond butter" | REAL | almond; list has no nuts |
| 13 | 20350864 | fish | "Wild Salmon Fillet 63%" | REAL | salmon; list has milk, mustard only |
| 14 | 0086101210036 | sulphites | "sulfur dioxide" | REAL | named ingredient; lists empty |
| 15 | 0753182104898 | sulphites | "diced apples (with sulfur dioxide)" | REAL | separate item from the oil list; lists lack sulphites |
| 16 | 0688267549076 | sulphites | "sodium bisulfite preservativé" | REAL | (borderline) garbled brackets but sodium bisulfite is clearly named; list only milk |
| 17 | 0686700101799 | sulphites | "coconut (with sodium metabisulfite [preservative])" | REAL | ingredient; list lacks sulphites |
| 18 | 0890708001214 | sulphites | "apple {sulphur dioxide (preservative)}" | REAL | ingredient; list lacks sulphites |
| 19 | 0852160006268 | tree nut | "hazelnut paste" | REAL | hazelnut; list has no nuts |
| 20 | 0612227107518 | sulphites | "sodium metabisulfite" | REAL | ingredient; lists empty |
| 21 | 0031000007430 | sulphites | "Sodium Bisulfite" | REAL | ingredient; list has no sulphites |
| 22 | 8906005671820 | peanut | "processed on machinery that also processes peanuts" | NOT REAL | peanut appears only in a shared-machinery advice, not an ingredient |
| 23 | 0702218350266 | egg | "enzyme modified egg yolk" | REAL | egg yolk; list only milk |
| 24 | 0854060001725 | egg | "Cage-Free Eggs" | REAL | egg ingredient; list only gluten |
| 25 | 0094922752567 | sulphites | "sodium metabisulphite" | REAL | ingredient; list lacks sulphites |
| 26 | 0859061005987 | egg | "cage free eggs" | REAL | egg ingredient; list lacks egg |
| 27 | 0036426100017 | sulphites | "potassium metabisulfite (as preservative)" | REAL | ingredient; lists empty |
| 28 | 0070378640009 | sulphites | "sodium metabisulfite" | REAL | ingredient; list lacks sulphites |
| 29 | 11274631 | gluten | "enriched bleached wheat flour", "durum flour" | REAL | wheat flour; list has no gluten tag |
| 30 | 0852261007027 | peanut | "NATURAL PEANUT BUTTER" | REAL | peanut ingredient; list only milk |
| 31 | 0017696407150 | sulphites | "dough conditioner (sodium metabisulfite" | REAL | ingredient; list lacks sulphites |
| 32 | 4088600139739 | sulphites | "Preservative: Sodium Metabisulphite" | REAL | ingredient; list only soybeans |
| 33 | 0072488997783 | sesame | "Seaweed Sesame Seed" | REAL | sesame seed named as ingredient; list lacks sesame |
| 34 | 0041512103247 | sulphites | "sodium bisulfite and sodium benzoate (as preservatives)" | REAL | ingredient; lists empty |
| 35 | 5030696400056 | sulphites | "Preservative: Sodium Sulphite" | REAL | ingredient; list lacks sulphites |
| 36 | 5057624773075 | gluten | "Wheat Fibre" | REAL | (borderline) wheat-derived ingredient, not an Annex II exemption; lists empty |
| 37 | 0023933682570 | sulphites | "sulfur dioxide." | REAL | named ingredient; list lacks sulphites |
| 38 | 0023700039101 | sulphites | "sodium metabisulfite" | REAL | ingredient; neither list has sulphites |
| 39 | 0074329123474 | sulphites | "sodium bisulfite (as preservatives)" | REAL | ingredient; no-gluten label irrelevant |
| 40 | 0041380268055 | sulphites | "SULFUR DIOXIDE (PRESERVATIVE)" | REAL | ingredient; lists empty |
| 41 | 0026396908287 | crustacean | "Salted Baby Shrimp" | REAL | shrimp; list has fish only |
| 42 | 0020113002289 | sulphites | "sodium metabisulfite" | REAL | ingredient; lists empty |
| 43 | 5700381019824 | soy | "emulsifier (e322 of soy)" | REAL | soy lecithin; traces list is eggs/nuts only |
| 44 | 8033462320012 | egg | "egg white lysozyme" | REAL | (borderline) egg-derived lysozyme in cheese, named with "egg white"; list lacks egg |
| 45 | 0002362708054 | mustard | "#1 grade mustard seed" | REAL | mustard seed; lists empty |
| 46 | 0072730262065 | milk | "Grade a lowfat milk" | REAL | milk first ingredient; lists empty |
| 47 | 0767335000845 | gluten | "semolina durum wheat flour" | REAL | wheat pasta; lists empty |
| 48 | 0226620611604 | sulphites | "sun-dried tomatoes (tomatoes, sulfur dioxide)" | REAL | ingredient; list lacks sulphites |
| 49 | 0853923002435 | milk | "Grade a pasteurized milk" | REAL | milk first ingredient; list only apple |
| 50 | 0674806008241 | sulphites | "Sodium Metabisulphite (E223)" | REAL | ingredient; list only milk |

#### Totals
REAL 49, NOT REAL 1 of 50: 8906005671820.

Checkers combined: 95/100.

### Round 7 lead re-check

The lead re-checked every NOT REAL and every borderline. The lead agrees with every call of both checkers.

NOT REAL, by record:
- 5000237128169 (milk): NOT REAL, agree. "also may contairi milk." is an OCR typo of "contain" that escapes the precaution wording.
- 0041331021623 (milk): NOT REAL, agree. "COCONUT MILK (COCONUT MILK, WATER)": an engine bug, an `unless` phrase is masked only at its first occurrence, so the repeated "coconut milk" reads as milk (verified: scanIngredient("coconut milk") gives no hit; "coconut milk, coconut milk" gives milk).
- 5012454063451 (egg): NOT REAL, agree. "LINDT MILK CHOCOLATE EGG: Sugar, …" is a product-name heading (a chocolate egg) inside the ingredient text.
- 4009790007950 (gluten): NOT REAL, agree. "pecan nuts  could contain gluten, egg, soy, …": "could contain" is not in the precaution wording.
- 8906005671820 (peanut): NOT REAL, agree. "This product was processed on machinery that also processes peanuts": that shared-machinery phrasing is not in the precaution wording.

Borderline calls kept REAL, lead agrees:
- 0074175461300 mollusc: "dried clam broth"; EU Annex II molluscs.
- 0897540001020 celery: "celery salt".
- 0812881020400 soy: "emulsifiers: soy lecithin".
- 0070896031884 gluten: "wheat starch", not an exempt glucose syrup or maltodextrin.
- 0099482421311 soy: "organic soy lecithin".
- 0688267549076 sulphites: "sodium bisulfite" in garbled brackets.
- 5057624773075 gluten: "Wheat Fibre".
- 8033462320012 egg: "egg white lysozyme".

10 random REAL re-checked by the lead, all REAL: 0028000478247, 5059697767654, 5030696400056, 0041512103247, 0023700039101, 0813224800154, 0380021363303, 0044400125802, 0026396908287, 0612227107518.

### Round 7: the 5 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) An OCR typo of "contain" in a precaution ("also may contairi milk.") | 1 (A#10, 5000237128169) | The count's rule: the typo escapes the precaution wording |
| (b) A repeated `unless` phrase ("COCONUT MILK (COCONUT MILK, WATER)") | 1 (A#27, 0041331021623) | Engine bug: an `unless` phrase is masked only at its first occurrence |
| (c) A product-name heading inside the ingredient text ("LINDT MILK CHOCOLATE EGG: Sugar, …") | 1 (A#29, 5012454063451) | A chocolate egg read as egg |
| (d) "could contain" as the precaution wording | 1 (A#35, 4009790007950) | The count's rule: "could contain" is not in the precaution wording |
| (e) Shared-machinery phrasing ("processed on machinery that also processes peanuts") | 1 (B#22, 8906005671820) | The count's rule: that phrasing is not in the precaution wording |

### Round 7 outcome

Result: **95 of 100 real** (checker A 46/50, checker B 49/50; the lead agrees with every call). The 95% Wilson interval is 88.8%-97.8%. Under the pre-registered rule (100/100 to claim) the count is **not claimed**. The measured precision is reported: 95/100. Progress across rounds: 73/100, then 90/100, then 95/100, then 93/100, then 97/100, then 95/100, then 95/100.

The figures are for engine `fa229b8` and the Round-7 count rules. Whether the number is used anywhere public is the author's decision.

## Round 8 (rules 1caacd9, engine 55f497c): 50/50 + 48/50 = 98/100

Run: `$C/run11` (`summary.json`; copy in [`results-strict-round8-2026-10-09.json`](results-strict-round8-2026-10-09.json)). Result files: `$C/run11/hc_a_result.md` and `hc_b_result.md`. The slowest shard took 2,591.677 s (wall clock 2,594 s). Determinism: shard 2 re-run gave identical counts apart from `seconds`. The engine is `55f497c` (E8: unless phrases are masked at every occurrence, the root cause being that `wordRe` consumed its trailing space so a back-to-back repeat was not matched; "could contain" and "...on machinery that also..." are precautions). Before that commit the full-data gate showed 198 family losses, all repeated unless phrases, "could contain" or machinery sentences. The rules (commit `1caacd9`: R11 OCR precaution `/\bmay (?:also )?cont[a-z]*/`, R12 heading: a term directly followed by ":", `fold()` keeps ":"; `strict_sample` seed 21) were committed at 20:40:13; the run's `start.txt` has the same second, 20:40:13.

The audit of the engine change on the full data: all 183 changed records were re-run; the 21 records that became "no listed allergens" are all correct (the only source was a repeated coconut milk, coconut cream, rice, maize or corn flour, or tart cherries phrase); the 222 vanished groups are all back-to-back repeats of an unless phrase (174 of them the generic "sauce" possible-all hit leaking from a repeated "soy sauce"); there is no fail-open. "soy sauce" still gives soy and wheat contains.

`A` is 3,457,538 / 826,465, as before (total 4,784,317 / 1,552,376). `B` is 136,440 (136,562 in round 7). `strict_missed` is 8,401 for all records (list empty 2,069, partial 6,332) and 2,107 for popular ones (724 / 1,383), down from 8,436 and 2,116 in round 7.

The `strict_sample` came from reservoir seed 21 (pool of 200 records). 14 records overlapped earlier rounds and were excluded; the draw excluded every code in `run3` to `run7`, `run9` and `run10` `hc_a`/`hc_b`. 100 were drawn with mulberry32 seed 20261014 from `run11/strict_sample.json` and split into `run11/hc_a.json` and `hc_b.json`, 50/50 between two independent checkers.

### Checker A

| # | code | missed families | ingredient words | REAL / NOT REAL | reason |
|---|---|---|---|---|---|
| 1 | 0818570002788 | milk | "Organic dehydrated sweet cream" | REAL | cream is milk; lists lack milk |
| 2 | 0041498224639 | gluten | "white wheat berries" | REAL | wheat; lists have milk, nuts only |
| 3 | 0888109110086 | sulphites | "coconut (sulfite treated)" | REAL (borderline) | sulfite named as treatment of an ingredient; no sulphite tag |
| 4 | 0058449261377 | tree_nut | "cashew butter" | REAL | cashew; lists have milk, soy only |
| 5 | 5000462384323 | sulphites | "Preservative (Sodium Metabisulphite)" | REAL | named additive |
| 6 | 0036800330320 | crustacean | "Minced shrimp" | REAL | shrimp ingredient |
| 7 | 0033700000056 | peanut | "peanut meal" | REAL | peanut ingredient; en:nuts is tree nuts |
| 8 | 0612781401206 | sulphites | "Sodium Metabisulfite" | REAL | named additive |
| 9 | 0035826032218 | soy | "modified soy protein" | REAL | soy protein |
| 10 | 0011225041266 | milk | "non fat milk", "whey solids" | REAL | milk ingredient |
| 11 | 5000169127117 | sulphites | "preservatives (potassium sorbate, sodium metabisulphite)" | REAL | named additive |
| 12 | 0787545005249 | sulphites | "sodium bisulfite (color preservative)" | REAL | named additive |
| 13 | 5035766052319 | sulphites | "ANTIOXIDANT: SODIUM METABISULPHITE" | REAL | named additive |
| 14 | 0817472020159 | egg | "cage free eggs" | REAL | eggs; 'cage free' is not a free-from claim |
| 15 | 5051898664084 | milk | "milk sugar" | REAL (borderline) | milk sugar = lactose, a milk derivative under Annex II |
| 16 | 0073630014242 | sulphites | "dough conditioner (sodium metabisulfite)" | REAL | named additive |
| 17 | 4052766629922 | sulphites | "Preservatives (... Sodium Metabisulphite)" | REAL | named additive |
| 18 | 0707425600227 | sulphites | "potassium metabisulphite (e224) as preservative" | REAL | named additive; coconut milk irrelevant to this family |
| 19 | 4069365026656 | crustacean, sulphites | "vannamei shrimp"; "sodium metabisulfite" | REAL | both families named |
| 20 | 0194346002092 | sulphites | "SODIUM BISULFITE" | REAL | named additive |
| 21 | 0011110826862 | soy | "modified soy protein" | REAL | soy protein |
| 22 | 0610358991228 | milk | "unsalted butter", "whole milk powder" | REAL | milk ingredients |
| 23 | 5391521832962 | sulphites | "sodium metabisulphite" | REAL | named additive |
| 24 | 50413683 | sulphites | "sodium metabisulphite" | REAL | named additive |
| 25 | 0612781102707 | sulphites | "Sodium Metabisulfite" | REAL | named additive |
| 26 | 0609788026563 | mustard | "yellow mustard" | REAL | spice ingredient |
| 27 | 0030000568187 | milk | "buttermilk powder", "sodium caseinate" | REAL | milk ingredients |
| 28 | 45173028 | sesame | "Black sesame" | REAL | sesame ingredient |
| 29 | 0042400184690 | gluten | "Wheat farina" | REAL | wheat ingredient |
| 30 | 0810019604485 | tree_nut | "slivered almonds" | REAL | almond; tags lack en:nuts |
| 31 | 0070784505084 | milk | "milk lactose" | REAL | milk-derived lactose |
| 32 | 5010525048710 | lupin | "Lupin protein" | REAL | lupin ingredient |
| 33 | 0038259106808 | sulphites | "sodium bisulfite (preservative)" | REAL | named additive |
| 34 | 0041735005038 | soy | "soy sauce powder", "soya sauce" | REAL | soy sauce |
| 35 | 0023204382536 | sulphites | "sulfur dioxide ... added as preservatives" | REAL | named additive |
| 36 | 0788767005314 | sulphites | "sodium bisulfite" | REAL | named additive |
| 37 | 5054267003378 | sulphites | "Sodium Bisulphite" | REAL | named additive |
| 38 | 6944165001172 | sulphites | "Soybean(Contain Sulphites)" | REAL | explicit sulphite statement on ingredient |
| 39 | 0030034934163 | sulphites | "Sodium Bisulfite" | REAL | named additive |
| 40 | 5000218003195 | milk | "Skimmed milk" | REAL | milk ingredient |
| 41 | 0718117986321 | mustard | "yellow mustard" | REAL | mustard ingredient |
| 42 | 0731149393813 | egg | "modified egg white" | REAL (borderline) | text garbled ('food starch - modified egg white') but egg white named |
| 43 | 0725439801201 | mustard | "dijon mustard", "mustard seed", "mustard flour" | REAL | mustard ingredients |
| 44 | 0036406369380 | gluten | "pasta (clurum wheat semolina" | REAL | typo for durum; wheat semolina clear |
| 45 | 0030034069568 | sulphites | "Dough Conditioner (Sodium Metabisulfite)" | REAL | named additive |
| 46 | 3158697781676 | sulphites | "preservative (sodium bisulphite)" | REAL | named additive; en:mustard is a different family |
| 47 | 0688267084874 | gluten | "semolina wheat flour" | REAL | wheat |
| 48 | 0051933339750 | milk | "non fat milk", "dry whey" | REAL | milk ingredients |
| 49 | 0011225127922 | soy | "modified soy protein" | REAL | soy protein |
| 50 | 0050754108040 | soy | "soy grits" | REAL | soy ingredient |

#### Totals
Totals: REAL 50 / 50

NOT REAL: none

Borderline (all called REAL): 0888109110086 (sulfite treated coconut), 5051898664084 (milk sugar), 0731149393813 (garbled modified egg white)

### Checker B

| # | code | missed families | ingredient words | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0856244005857 | sulphites | "ferrous sulfite" | NOT REAL | (borderline) 'ferrous sulfite' is an iron-fortificant name (likely sulfate), not a sulphite preservative; unclear |
| 2 | 4681170020379 | sulphites | "sodium metabisulphite" | REAL | named ingredient; list has crustaceans only |
| 3 | 0845561001710 | soy | "textured soy protein" | REAL | soy protein ingredient; lists empty |
| 4 | 0072714004957 | milk | "whey yellow corn flour" | REAL | (borderline) missing comma, 'whey' is plainly named; lists lack milk |
| 5 | 0011433114455 | sulphites | "POTASSIUM METABISULFITE (PRESERVATIVE)" | REAL | named ingredient |
| 6 | 5908310281773 | egg | "egg mass" | REAL | egg ingredient; lists lack eggs |
| 7 | 0605388186720 | sulphites | "sodium bisulfite" | REAL | named ingredient |
| 8 | 0490710802054 | celery | "celery salt seasoning" | REAL | celery salt ingredient; no celery tag |
| 9 | 4007951002721 | sulphites | "sodium metabisulfite (antioxidant)" | REAL | named ingredient |
| 10 | 0817585011372 | sulphites | "Sodium Metabisulfite" | REAL | named ingredient; list has gluten only |
| 11 | 0830825001049 | egg | "whole egg solids" | REAL | egg ingredient; no eggs tag |
| 12 | 24342407 | soy | "emulsifier: soy lecithin" | REAL | soy lecithin ingredient; no soybeans tag |
| 13 | 0851353005255 | egg | "cage free eggs" | REAL | 'cage free' is not an allergen-free claim |
| 14 | 0015400870436 | sulphites | "preservative (sodium bisulfite)" | REAL | named ingredient |
| 15 | 0076479163126 | sulphites | "sodium bisulfite" | REAL | named ingredient |
| 16 | 4001724032687 | milk | "9.7 % EDAM CHEESE" | REAL | cheese ingredient; no milk tag |
| 17 | 0029000022003 | gluten | "contains less than 2% of wheat flour" | REAL | wheat flour ingredient; no gluten tag |
| 18 | 0872197635972 | egg | "dried egg yolk" | REAL | egg ingredient |
| 19 | 0041331049511 | sulphites | "ANTIOXIDANT (SODIUM METABISULPHITE)" | REAL | named ingredient |
| 20 | 0041190032860 | sulphites | "sodium sulfite" | REAL | named ingredient |
| 21 | 0819893020695 | milk | "nonfat milk" | REAL | milk ingredient; no milk tag |
| 22 | 0850765006072 | celery | "celery seed" | REAL | celery seed ingredient |
| 23 | 0050700003160 | sulphites | "sodium sulfite" | REAL | named ingredient |
| 24 | 5054268138673 | milk | "Canola Oill Milk Sugar" | REAL | (borderline) garbled run-on item, but 'Milk Sugar' (lactose) is plainly named; not oil-context |
| 25 | 0077541005177 | sulphites | "sodium bisulfite {preservative}" | REAL | named ingredient |
| 26 | 0041303011812 | milk | "non fat milk; whey solids" | REAL | milk ingredient; no milk tag |
| 27 | 0749826520919 | tree_nut | "almond butter" | REAL | almond ingredient; tags lack nuts |
| 28 | 0011213162089 | sulphites | "freshness protected by ... sodium bisulfite" | REAL | (borderline) sulphite sits in a sub-ingredient preservative note, but is named in the ingredient text |
| 29 | 0085239046166 | gluten | "semolina [durum wheat flour ...]" | REAL | wheat pasta; list has milk only |
| 30 | 5030765027498 | egg | "Dried Egg White; Pasteurised Egg" | REAL | egg ingredient; no eggs tag |
| 31 | 0070896221964 | gluten | "wheat starch" | REAL | wheat ingredient; no gluten tag |
| 32 | 0637480071505 | sulphites | "sodium metabisulfite" | REAL | named ingredient |
| 33 | 0073030808335 | celery | "dehydrated celery" | REAL | celery ingredient |
| 34 | 0747599314773 | soy | "soy lecithinan emulsifier" | REAL | soy lecithin ('lecithinan' = 'lecithin, an'); no soybeans tag |
| 35 | 0071725728678 | sulphites | "sulfur dioxide (as a preservative)" | REAL | named ingredient |
| 36 | 0053136893152 | soy | "corn syrup & soy lecithin" | REAL | soy lecithin ingredient |
| 37 | 0072250013185 | sulphites | "sodium metabisulfite" | REAL | named ingredient |
| 38 | 0741643037458 | milk, egg | "whey eggs" | REAL | (borderline) missing comma; 'whey' and 'eggs' both plainly named |
| 39 | 0098487301130 | milk | "nonfat milk" | REAL | milk ingredient |
| 40 | 0423000006573 | egg | "egg (in 'manufactured on equipment exposed to: soy, wheat, peanut, walnut, egg')" | NOT REAL | egg appears only in an equipment-exposure warning |
| 41 | 0659422092256 | tree_nut | "almond meal" | REAL | almond ingredient; tags lack nuts |
| 42 | 0024812500015 | soy | "hydrolyzed corn and wheat gluten and soy protein" | REAL | soy protein ingredient; list lacks soybeans |
| 43 | 0716221050242 | sulphites | "preserved with sulfur dioxide" | REAL | named ingredient |
| 44 | 0074175461577 | mollusc | "dried clam broth" | REAL | clam is a mollusc; no molluscs tag |
| 45 | 0096162618054 | sulphites | "sodium benzoate ... and sulfur dioxide" | REAL | named ingredient in raspberry filling |
| 46 | 0046015172233 | milk | "less than 2% of skim milk powder" | REAL | milk ingredient; list has soybeans only |
| 47 | 0031200010735 | sulphites | "sulfur dioxide [added as preservative]; sodium metabisulfite" | REAL | named ingredient |
| 48 | 0858494004017 | milk, egg | "hormone free butter; cage free eggs" | REAL | 'hormone free'/'cage free' are not allergen-free claims; both named |
| 49 | 0037100375561 | sulphites | "sulfur dioxide (preservative)" | REAL | named ingredient |
| 50 | 9416369199285 | gluten | "wheat cereal" | REAL | wheat ingredient; no gluten tag |

#### Totals
**Totals: REAL 48 / 50**
NOT REAL: 0856244005857, 0423000006573

Checkers combined: 98/100.

### Round 8 lead re-check

The lead re-checked every NOT REAL and every borderline. The lead agrees with every call of both checkers.

NOT REAL, by record:
- 0856244005857 (sulphites): NOT REAL, agree. "Enriched wheat flour (ferrous sulfite, niacin, ...)": almost certainly a typo for ferrous sulfate (the iron fortificant); unclear counts as not real.
- 0423000006573 (egg): NOT REAL, agree. "manufactured on equipment exposed to: soy, wheat, peanut, walnut, egg": a warning phrasing the engine did not know.

Borderline calls kept REAL, lead agrees:
- 0888109110086 sulphites: "coconut (sulfite treated)".
- 5051898664084 milk: "milk sugar" (lactose).
- 0731149393813 egg: "modified egg white".
- 0072714004957 milk: "whey yellow corn flour".
- 5054268138673 milk: "Milk Sugar".
- 0741643037458 milk and egg: "whey eggs".
- 0011213162089 sulphites: "freshness protected by ... sodium bisulfite".
- 0747599314773 soy: "soy lecithinan emulsifier".
- 0858494004017 milk and egg: "hormone free butter", "cage free eggs" (not free-from claims).

10 random REAL re-checked by the lead, all REAL: 5035766052319, 4681170020379, 0074175461577, 0041498224639, 0609788026563, 0073030808335, 0490710802054, 0015400870436, 0850765006072, 0050754108040.

### Round 8: the 2 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) "ferrous sulfite" in an enriched flour (a typo for the iron fortificant ferrous sulfate) | 1 (B#1, 0856244005857) | The count's rule: the term is not a sulphite preservative |
| (b) "manufactured on equipment exposed to: soy, wheat, peanut, walnut, egg" | 1 (B#40, 0423000006573) | The engine's precaution wording does not know this phrasing |

### Round 8 outcome

Result: **98 of 100 real** (checker A 50/50, checker B 48/50; the lead agrees with every call). The 95% Wilson interval is 93.0%-99.4%. Under the pre-registered rule (100/100 to claim) the count is **not claimed**. The measured precision is reported: 98/100. Progress across rounds: 73/100, then 90/100, then 95/100, then 93/100, then 97/100, then 95/100, then 95/100, then 98/100.

The figures are for engine `55f497c` and the Round-8 count rules.

## Round 9 (rules 4f0a9a4, engine 402b308): 48/50 + 45/50 = 93/100

Run: `$C/run12` (`summary.json`; copy in [`results-strict-round9-2026-10-09.json`](results-strict-round9-2026-10-09.json)). Result files: `$C/run12/hc_a_result.md` and `hc_b_result.md`. The slowest shard took 2,848.0 s (wall clock 2,848 s). Determinism: shard 2 re-run gave identical counts apart from `seconds` (2,848.0 s in the 8-way run, 2,208.1 s solo). The engine is `402b308` (E9: "(manufactured|made|produced|processed|packed|packaged) on equipment exposed to" is a precaution). Before that commit the full-data text-only gate (575 s scan) showed 2 records / 6 family losses (0423000006573: peanut, tree_nut, egg, gluten, soy; 0241148304494: peanut), all inside "on equipment exposed to" sentences, all to may_contain+possible, nothing to none. The rules (commit `4f0a9a4`: R13, a sulphite term directly preceded by "ferrous" does not count; `strict_sample` seed 23; 51 fixtures) were committed at 22:27:30; the run's `start.txt` is 22:27:39, after the commit.

Old engine `55f497c` against new engine `402b308` on all records: `changed` 0, `to_none` 0 (E9's two records keep "contains" for those families through their Open Food Facts allergen tags).

`A` is 3,457,538 / 826,465, as before (total 4,784,317 / 1,552,376). `B` is 136,440 (popular 64,046), unchanged from round 8. `strict_named` is 163,056 / 55,789. `strict_missed` is 8,388 for all records (list empty 2,069, partial 6,319) and 2,106 for popular ones (724 / 1,382), down from 8,401 and 2,107 in round 8.

The `strict_sample` came from reservoir seed 23 (pool of 200 records). 23 records overlapped earlier rounds and were excluded; the draw excluded every code in `run3` to `run7`, `run9`, `run10` and `run11` `hc_a`/`hc_b`. 100 were drawn with mulberry32 seed 20261015 from `run12/strict_sample.json` and split into `run12/hc_a.json` and `hc_b.json`, 50/50 between two independent checkers.

Both checkers reported that the operating system denied them read access to `bench/README.md` at the time (a macOS folder-permission lapse, since fixed). They judged on the full hand-check protocol and the exclusion guidance given verbatim in their instructions, not on the README text; their notes say so at the top of each table.

### Checker A

Note: bench/README.md returned EPERM (unreadable from this session); judged on the protocol and rules as stated in the task. R1-R13 text was not seen.

| # | code | missed | ingredient words | call | reason |
|---|---|---|---|---|---|
| 1 | 5026489470962 | milk | "Vegetable Ghee" | NOT REAL | vegetable ghee is plant fat, no milk named |
| 2 | 0036800445437 | sulphites | "sodium metabisulfite (preservative)" | REAL | sulphite additive, no sulphite tag |
| 3 | 0041498154332 | sulphites | "sodium metabisulphite" | REAL | ingredient additive, tags lack sulphites |
| 4 | 8003340805214 | gluten | "barley malt extract" | REAL | barley ingredient; gluten tag absent (nuts trace is not gluten) |
| 5 | 0688267174599 | soy | "modified soy protein" | REAL | soy ingredient, no soybeans tag |
| 6 | 0041679944004 | soy | "SOY PROTEIN ISOLATE" | REAL | soy ingredient, tags milk only |
| 7 | 0644209425136 | egg, milk | "dried whole eggs"; "nonfat dried milk", "whole milk powder" | REAL | both families named as ingredients, neither tagged |
| 8 | 0034952584622 | sulphites | "sodium metabisulfite (preservative)" | REAL | no tags at all |
| 9 | 0070253106286 | milk | "non fat milk", "whey solids" | REAL | milk ingredient, no milk tag |
| 10 | 0622297510446 | gluten | "unbleached wheat flour" | REAL | wheat flour, no gluten tag |
| 11 | 0021130981106 | gluten | "semolina wheat flour" | REAL | wheat, no gluten tag |
| 12 | 0818562024286 | sulphites | "Sodium Metabisulfite" (in dried mango) | REAL | sulphite ingredient |
| 13 | 5060004214594 | sulphites | "Preservative (Metabisulphite)" | REAL | sulphite additive |
| 14 | 0849455000018 | sulphites | "sodium metabisulfite*" | REAL | sulphite additive |
| 15 | 5016084293660 | soy | "Hydrolysed vegetable protein (containing Soya)" | REAL | soya stated in ingredient |
| 16 | 0070253296918 | sulphites | "sodium bisulfite" | REAL | sulphite additive |
| 17 | 0015400841108 | soy | "modified soy protein" | REAL | soy ingredient |
| 18 | 8719200086081 | soy | "emulsifiers (e322 (from soya)" | REAL | soya lecithin named; text partly garbled but English (borderline) |
| 19 | 0011110888204 | sulphites | "SODIUM BISULFITE [PRESERVATIVES]" | REAL | sulphite additive |
| 20 | 0852704005146 | sulphites | "antioxidant: sodium metabisulphite" | REAL | sulphite additive |
| 21 | 6009704171898 | sulphites | "glucose syrup (preservative (sodium metabisulphite))" | REAL | sulphite additive |
| 22 | 0749400223991 | soy | "isolated soy protein" | REAL | soy ingredient |
| 23 | 4069366112235 | sulphites | "Preservative: Sodium Sulphite" | REAL | sulphite additive |
| 24 | 4088600399508 | sulphites | "preservative: sodium metabisulphite" | REAL | sulphite additive |
| 25 | 4056489900481 | sulphites | "Preservative: Sodium Metabisulphite" | REAL | sulphite additive |
| 26 | 4088600243962 | sulphites | "preservatives (potassium sorbate, sodium metabisulphite)" | REAL | sulphite additive |
| 27 | 0041130303265 | sulphites | "sulfur dioxide (preservative)" | REAL | SO2 additive |
| 28 | 0752423449590 | egg | "egg protein" | REAL | egg ingredient, tags nuts only |
| 29 | 0741643046009 | egg | "pasteurized whole egg" | REAL | egg ingredient |
| 30 | 0075450002119 | soy | "modified soy protein" | REAL | soy ingredient |
| 31 | 0077260041340 | sulphites | "coconut with sodium metabisulfite", "sulfur dioxide (preserves color)" | REAL | sulphite named as ingredient additive |
| 32 | 0011213903019 | soy | "modified soy protein" | REAL | soy ingredient |
| 33 | 0853197004326 | fish | "Wild keta salmon" | REAL | fish ingredient, no fish tag |
| 34 | 5391518712161 | egg | "Pasteurised Li Whole Egg" | REAL | whole egg ingredient; "Li" is a typo (borderline) |
| 35 | 9300462341149 | fish | "Herring fillets (65%)" | REAL | fish ingredient, no tags |
| 36 | 0072431004827 | sulphites | "sulfur dioxide", "sodium metabisulfite" | REAL | sulphite additives |
| 37 | 0011110889935 | soy | "hydroxylated soy lecithin" | REAL | soy lecithin, not an oil/flavouring exemption (borderline) |
| 38 | 0071117193220 | gluten | "semolina wheat flour" | REAL | wheat, no gluten tag |
| 39 | 0037500750067 | soy | "hydrolyzed soy protein" | REAL | soy ingredient |
| 40 | 0671372200024 | gluten | "spelt flour" | REAL | spelt is a wheat species (borderline: name is not "wheat") |
| 41 | 0060383203542 | peanut | "may not be suitable for those with peanut allergy" | NOT REAL | warning only; "pea protein" is not peanut |
| 42 | 0850066968130 | tree_nut | "Cashew Blend" | REAL | cashew is a tree nut named as ingredient (borderline: "blend" vague) |
| 43 | 0756963180036 | gluten | "Whole wheat flour" | REAL | wheat, no gluten tag |
| 44 | 0041144799153 | egg | "EGG YOLKS" | REAL | egg ingredient |
| 45 | 03177024 | sulphites | "preservative (sodium metabisulphite)" | REAL | sulphite additive |
| 46 | 0080000518705 | fish | "Light tuna" | REAL | fish ingredient |
| 47 | 5052320699032 | sulphites | "Sodium Metabisulphite" | REAL | sulphite additive |
| 48 | 0041270930963 | sulphites | "dried fruit treated with sulfur dioxide" | REAL | SO2 treatment of ingredients, not a may-contain (borderline: processing note) |
| 49 | 0043717265102 | sulphites | "ANTIOXIDANT: SODIUM METABISULPHITE" | REAL | sulphite additive |
| 50 | 0076840001781 | soy | "soy lecithin" | REAL | soy lecithin ingredient |

## Totals
REAL 48 / 50

NOT REAL: 5026489470962 (#1, vegetable ghee), 0060383203542 (#41, peanut only in warning)

Borderline: #18, #34, #37, #40, #42, #48

### Checker B

Note: bench README was unreadable (EPERM), so rules R1-R13 were NOT applied; judged on the protocol text in the task only.

| # | code | missed families | ingredient words | verdict | reason |
|---|---|---|---|---|---|
| 1 | 3273221115922 | tree_nut | almond protein 2.4% | REAL | almond named as ingredient; tags only soybeans |
| 2 | 0050000053285 | gluten, milk | wheat flour; sodium caseinate | REAL | both named; tags pork/soybeans only |
| 3 | 0038708950297 | milk | pasteurized milk (mozzarella, provolone, romano cheese) | REAL | cheese made from milk; tags gluten only |
| 4 | 0092825109495 | soy, milk | hydrolyzed soy protein; sodium caseinate | REAL | both named; tags gluten only |
| 5 | 0087848242229 | sulphites | Dried Apples (Treated With Sulfur Dioxide To Preserve Color) | REAL (borderline) | sulfur dioxide named in ingredient; tags lack sulphites (borderline: treatment wording) |
| 6 | 0047834063047 | fish | CLAM EXTRACT (SHELL FISH) | NOT REAL | clam/shellfish is a mollusc (already tagged en:molluscs), no finfish named |
| 7 | 0878425007405 | gluten | durum wheat semolina | REAL | wheat named; ferrous sulfate irrelevant; tags soybeans only |
| 8 | 0850009366450 | sulphites | sodium metabisulphite | REAL | sulphite additive; tags nuts only |
| 9 | 0638031002511 | gluten | VITAL WHEAT GLUTEN | REAL | wheat gluten; no tags |
| 10 | 0048000005595 | fish | light tuna | REAL | tuna is fish; no tags |
| 11 | 5036829756588 | milk | (none; 'Butter Beans') | NOT REAL | butter beans are legumes, not milk/butter |
| 12 | 0072412250045 | sulphites | potassium metabisulfite (as as preservative) | REAL | sulphite; no tags |
| 13 | 0021130335442 | sulphites | SULFUR DIOXIDE (PRESERVATIVE) | REAL | sulphite; no tags |
| 14 | 0041190050697 | sulphites | SODIUM SULFITE | REAL | sulphite; tags gluten/soy only |
| 15 | 0041497556052 | sulphites | SODIUM METABISULFITE | REAL | sulphite; tags gluten only |
| 16 | 0068400113416 | gluten | Wheat pasta | REAL | wheat; tags milk/soy only |
| 17 | 0085239910986 | sulphites | figs (preserved with sulfur dioxide) | REAL | sulfur dioxide named; tags gluten/soy only |
| 18 | 0858045004657 | milk | Macadamia milk; coconut cream | NOT REAL | plant milk/cream, not dairy |
| 19 | 0780993731586 | sulphites | dried apricots (sulfur dioxide as a preservative) | REAL | sulphite; tags lack sulphites |
| 20 | 0739126000174 | mustard | mustard flour | REAL | mustard ingredient; no tags |
| 21 | 0830825001223 | egg | whole egg solids | REAL | egg ingredient; tags gluten only |
| 22 | 0085239013212 | sulphites | sodium metabisulfite | REAL | sulphite in coconut; tags lack sulphites |
| 23 | 0021130306176 | sulphites | sodium sulfite | REAL | sulphite; tags gluten/soy only |
| 24 | 0073210002928 | sulphites | potassium metabisulfite | REAL | sulphite; no tags |
| 25 | 0016000515376 | milk | nonfat dry milk | REAL | milk ingredient; tags nuts only |
| 26 | 0073170129574 | mustard | SPICES INCLUDING MUSTARD | REAL | mustard named as spice ingredient; tags beef/pork |
| 27 | 8851081283002 | sulphites | Sodium Metabisulfite | REAL | sulphite; no tags |
| 28 | 0852095004667 | peanut | (only in 'made in a faci...' fragment) | NOT REAL | peanut appears only in facility statement, not an ingredient |
| 29 | 0054267003465 | sulphites | sodium bisulphite | REAL | sulphite; no tags |
| 30 | 0015418012613 | sulphites | sodium metabisulphite | REAL | sulphite; no tags |
| 31 | 0071007055829 | sulphites | sodium metabisulfite | REAL | sulphite in dough conditioners; tags lack sulphites |
| 32 | 0725439981187 | sulphites | sodium metabisulfite | REAL | sulphite; tags celery only |
| 33 | 0011150981323 | soy | SOYBEAN OI[L] (text truncated) | NOT REAL | only soybean oil (truncated, oil exemption); no soy protein/lecithin shown |
| 34 | 0741643005679 | milk | hydrolyzed whey protein | REAL | whey = milk; tags beef/pork/soy |
| 35 | 5063446495293 | sulphites | Preservative (Sodium Metabisulphite) | REAL | sulphite; tags beef only |
| 36 | 0041735043214 | sulphites | Sulfur Dioxide | REAL | sulphite; no tags |
| 37 | 5000221603740 | tree_nut | Ground Almonds | REAL | almond; tags eggs only |
| 38 | 0074175303365 | sulphites | sodium bisulfite | REAL | sulphite; tags milk only |
| 39 | 5052675040206 | tree_nut | cashew nuts | REAL | cashew named; traces lack nuts, allergens only milk |
| 40 | 3020254878504 | sulphites | Sodium Metabisulphite (E-223) | REAL | sulphite; no tags |
| 41 | 5000354904790 | soy | emulsifier (e322) (contains soya | REAL (borderline) | soya named in ingredient parenthetical (borderline: text truncated, advice fragment nearby) |
| 42 | 0850709005505 | milk | whole milk powder; milk fat | REAL | milk; tags gluten/soy only |
| 43 | 0041268205073 | sulphites | sodium sulfite | REAL | sulphite; tags gluten/soy only |
| 44 | 0041498138059 | sulphites | sodium metabisulfite | REAL | sulphite; no tags |
| 45 | 5035766050100 | sulphites | SODIUM METABISULPHITE | REAL | sulphite; no tags |
| 46 | 0066086100881 | sulphites | SODIUM BISULFITE | REAL | sulphite; no tags |
| 47 | 0021140031570 | egg | enzyme modified egg yolk | REAL | egg; tags milk only |
| 48 | 29074846 | soy | Soybeans (8%) | REAL | soybeans named (odd 'suitable nut' text irrelevant); tags gluten only |
| 49 | 0030100506539 | sulphites | sodium sulfite | REAL | sulphite; tags gluten/milk/soy only |
| 50 | 0855569211820 | tree_nut | Cashew Butter | REAL | cashew; allergens/traces lack nuts (only peanuts) |

**REAL 45 / 50**

NOT REAL: #6 0047834063047, #11 5036829756588, #18 0858045004657, #28 0852095004667, #33 0011150981323

Checkers combined: 93/100.

### Round 9 lead re-check

The lead re-checked every NOT REAL and every borderline. The lead agrees with every call of both checkers.

NOT REAL, by record:
- 5026489470962 (milk): NOT REAL, agree. "Green Chilli Vegetable Ghee": vegetable ghee (vanaspati) is a plant fat.
- 0060383203542 (peanut): NOT REAL, agree. "This product contains pea protein. It may not be suitable for those with peanut allergy.": a warning; the not-suitable rule needs the sentence to begin "not suitable" or "unsuitable".
- 0047834063047 (fish): NOT REAL, agree. "CLAM EXTRACT (SHELL FISH)": "shell fish" as two words is read as fish; clam is a mollusc and en:molluscs is already listed.
- 5036829756588 (milk): NOT REAL, agree. "Butter Beans": legumes.
- 0858045004657 (milk): NOT REAL, agree. "Macadamia milk" and "coconut cream": plant milk and cream; macadamia milk is not in the plant-milk list.
- 0852095004667 (peanut): NOT REAL, agree. Garbled factory warning "*made in a faci riconut peanut rad gre gluten free free kosher facility...".
- 0011150981323 (soy): NOT REAL, agree. Text truncated at "SOYBEAN OI": soybean oil (oil exemption); the truncation escapes R1.

Borderline calls kept REAL, lead agrees:
- 8719200086081 soy: "emulsifiers (e322 (from soya)".
- 5391518712161 egg: "Pasteurised Li Whole Egg".
- 0011110889935 soy: "hydroxylated soy lecithin".
- 0671372200024 gluten: "spelt flour" (spelt is wheat and named in EU Annex II).
- 0850066968130 tree_nut: "Cashew Blend".
- 0041270930963 sulphites: "dried fruit treated with sulfur dioxide".
- 0087848242229 sulphites: "Dried Apples (Treated With Sulfur Dioxide To Preserve Color)".
- 5000354904790 soy: "emulsifier (e322) (contains soya".

10 random REAL re-checked by the lead, all REAL: 0622297510446, 0741643046009, 3020254878504, 0041497556052, 0850009366450, 8851081283002, 9300462341149, 0741643005679, 0070253106286, 0021130306176.

### Round 9: the 7 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) Plant fat, legume or plant milk read as dairy ("Vegetable Ghee", "Butter Beans", "Macadamia milk", "coconut cream") | 3 (A#1, B#11, B#18) | The count's rules: plant-milk list lacks macadamia; ghee and butter beans are not dairy |
| (b) A warning read as an ingredient ("It may not be suitable for those with peanut allergy") | 1 (A#41, 0060383203542) | The not-suitable rule needs the sentence to begin "not suitable" or "unsuitable" |
| (c) "SHELL FISH" as two words read as fish | 1 (B#6, 0047834063047) | Clam is a mollusc, already listed |
| (d) Garbled factory warning | 1 (B#28, 0852095004667) | OCR garbage around "made in a facility" |
| (e) Text truncated at "SOYBEAN OI" | 1 (B#33, 0011150981323) | Soybean oil is exempt; the truncation escapes R1 |

### Round 9 outcome

Result: **93 of 100 real** (checker A 48/50, checker B 45/50; the lead agrees with every call). The 95% Wilson interval is 86.3%-96.6%. Round 9 was declared the last round (decision 2026-10-09); the author asked for a further round on 2026-10-10, see round 10. The count is **not claimed**. The reported figure is the measured precision of the final engine and rules: 93 of 100. Progress across rounds: 73/100, then 90/100, then 95/100, then 93/100, then 97/100, then 95/100, then 95/100, then 98/100, then 93/100. Rounds 5 to 9 ranged 93-98.

The figures are for engine `402b308` and the Round-9 count rules.

## Round 10 (rules cd8ffb8, engine 17287f8): 49/50 + 50/50 = 99/100

Run: `$C/run13` (`summary.json`; copy in [`results-strict-round10-2026-10-10.json`](results-strict-round10-2026-10-10.json)). Result files: `$C/run13/hc_a_result.md` and `hc_b_result.md`. The slowest shard took 2,725.325 s (wall clock 2,725 s). Determinism: shard 2 re-run gave identical counts apart from `seconds` (2,725.3 s in the 8-way run, 2,190.7 s solo).

The author asked for a further round (2026-10-10), after round 9 had been declared the final round (2026-10-09); round 10 is now the latest. Round 9's 93/100 stands above and is not replaced.

The round-9 fixes: engine `bbbc069` (vegetable/vanaspati ghee: milk possible; "may/might not be suitable for ... allergy" sentences are precautions; "shell fish" reads as shellfish; macadamia milk: milk possible; superscript digits normalised to spaces, which fixed "Butter Beans³") and bench `7ad05e5` (R9 extended to "made in a", facility, factory and "manufactured in/on" items; R1 extended to a term followed by "o" or "oi" at the end of the text). Full-data gate: 62 records lost "contains", all intended; one record went to none (5036829756588, allergen-free text).

The exploratory sweep (not a measured round): a scratch run with a 400-record sample (seed 31); 359 unchecked records were read by four checkers, and 350 of 359 were real. It led to E10 = `17287f8` ("Not suitable for ... allergy" after an "Allergy advice:" label is a precaution) and R14 (contains-declaration; documented in the README with its trade-off). Gate: 85 records lost "contains", all intended patterns.

The rules (R1-R14) were pre-registered in commit `cd8ffb8`, committed 02:39:51; the run's start was 02:40:33, after the commit. The engine is `17287f8`. `strict_sample` seed 29. The draw: mulberry32 seed 20261016 from `run13/strict_sample.json`, excluding the codes of rounds 1 to 9 and all exploratory codes (`ex_1` to `ex_4`), split into `run13/hc_a.json` and `hc_b.json`, 50/50 between two independent checkers.

`A` and the total are unchanged (3,457,538 and 826,465 for `A`). `B` is 136,392 (popular 64,016). `strict_missed` is 8,298 for all records (list empty 2,050, partial 6,248) and 2,069 for popular ones (716 / 1,353), against 8,388 and 2,106 in round 9 (run12). Old engine `402b308` against new engine `17287f8` on all records: `changed` 67, `to_none` 1 (4064347220411, "Live Kefir Cultures¹": the existing "kefir culture" mask now applies once the superscript is normalised).

### Checker A

| # | code | missed families | words that name it | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0016000485884 | tree_nut | almond pieces | REAL | named as ingredient; not in allergen/traces tags |
| 2 | 0041380212096 | sulphites | sodium sulfite | REAL | named as ingredient; not in allergen/traces tags |
| 3 | 0075450125702 | sulphites | sodium bisulfite (preservative) | REAL | named as ingredient; not in allergen/traces tags |
| 4 | 0226620808370 | sulphites | sun-dried tomatoes (..sulfur dioxide preservative) | REAL | named as ingredient; not in allergen/traces tags |
| 5 | 0198715973648 | sulphites | sodium metabisulphite | REAL | named as ingredient; not in allergen/traces tags |
| 6 | 0086101029409 | sulphites | sulfur dioxide | REAL | named as ingredient; not in allergen/traces tags |
| 7 | 0657579070264 | sulphites | potassium metabisulphite | REAL | named as ingredient; not in allergen/traces tags |
| 8 | 0060383010843 | soy | hydrolyzed corn and wheat and soy protein | REAL | named as ingredient; not in allergen/traces tags |
| 9 | 0027246101001 | sulphites | sodium metabisulphite (coconut milk is not the hit) | REAL | named as ingredient; not in allergen/traces tags |
| 10 | 4792098088140 | sulphites | Sodium Metabisulphite (E 223) | REAL | named as ingredient; not in allergen/traces tags |
| 11 | 0079606020163 | milk,sulphites | dairy whey; sodium metabisulfite | REAL | named as ingredient; not in allergen/traces tags |
| 12 | 0030700751124 | soy | enzyme modified soy protein | REAL | named as ingredient; not in allergen/traces tags |
| 13 | 0041498217860 | egg | eggs | REAL | named as ingredient; not in allergen/traces tags |
| 14 | 0025753028781 | sulphites | sodium bisulfite (as a preservative) | REAL | named as ingredient; not in allergen/traces tags |
| 15 | 9099842625169 | sulphites | preservative: sodium metabisulphite | REAL | named as ingredient; not in allergen/traces tags |
| 16 | 0011110150493 | sulphites | SODIUM METABISULFITE | REAL | named as ingredient; not in allergen/traces tags |
| 17 | 0722252200693 | milk | almonds butter (nut butter, not dairy; no other milk ingredient found) | NOT REAL | butter here is almond butter; no dairy ingredient |
| 18 | 0767335000807 | gluten | semolina durum wheat flour | REAL | named as ingredient; not in allergen/traces tags |
| 19 | 0070896375568 | gluten | wheat starch | REAL (borderline) | wheat starch counts as wheat (gluten) under EU/FALCPA; gluten tag absent for wheat? tag en:gluten absent, so missed |
| 20 | 0077260087010 | sulphites | coconut with sodium metabisulfite | REAL | named as ingredient; not in allergen/traces tags |
| 21 | 0070784220086 | soy | hydrolyzed soy protein | REAL | named as ingredient; not in allergen/traces tags |
| 22 | 0027086184042 | sulphites | sodium metabisulfite | REAL | named as ingredient; not in allergen/traces tags |
| 23 | 0713733914703 | sulphites | sodium metabisulfite for color retention | REAL | named as ingredient; not in allergen/traces tags |
| 24 | 0859088004093 | sulphites | sodium bisulfite (preservatives) | REAL | named as ingredient; not in allergen/traces tags |
| 25 | 0858324006648 | mustard | dijon mustard, mustard seed | REAL | named as ingredient; not in allergen/traces tags |
| 26 | 0023700039095 | sulphites | sodium metabisulfite | REAL | named as ingredient; not in allergen/traces tags |
| 27 | 6780721055810 | sulphites | Sodium metabisulphite | REAL | named as ingredient; not in allergen/traces tags |
| 28 | 0632674580160 | soy | isolated soy protein | REAL | named as ingredient; not in allergen/traces tags |
| 29 | 0029519223120 | gluten | enriched wheat flour | REAL | named as ingredient; not in allergen/traces tags |
| 30 | 0206850001208 | egg | whole egg powder | REAL | named as ingredient; not in allergen/traces tags |
| 31 | 0891128148237 | sulphites | antioxidant (sodium metabisulphite) | REAL | named as ingredient; not in allergen/traces tags |
| 32 | 0041497193509 | gluten | durum wheat semolina | REAL | named as ingredient; not in allergen/traces tags |
| 33 | 0079606811556 | sulphites | Dough Conditioner (Sodium Metabisulfite) | REAL | named as ingredient; not in allergen/traces tags |
| 34 | 0071117025071 | gluten | semolina wheat flour | REAL | named as ingredient; not in allergen/traces tags |
| 35 | 27436219 | sulphites | Preservative (Sodium Metabisulphite) | REAL | named as ingredient; not in allergen/traces tags |
| 36 | 0070253150159 | sulphites | sulfur dioxide (preservative) | REAL | named as ingredient; not in allergen/traces tags |
| 37 | 20521226 | egg | free-range egg yolk / chicken egg yolk | REAL | named as ingredient; not in allergen/traces tags |
| 38 | 0708615110779 | sulphites | Sodium Metabisulphite [Preservative] | REAL | named as ingredient; not in allergen/traces tags |
| 39 | 0259426018308 | milk | concentrated butter, skimmed milk powder | REAL | named as ingredient; not in allergen/traces tags |
| 40 | 5060425720537 | sesame | Tahini Sesame Seed Paste | REAL | named as ingredient; not in allergen/traces tags |
| 41 | 0043787015911 | mollusc | SEA CLAMS AND SEA CLAM JUICE | REAL | named as ingredient; not in allergen/traces tags |
| 42 | 0796220077099 | gluten | enriched flour (wheat flour...) | REAL | named as ingredient; not in allergen/traces tags |
| 43 | 0041322136626 | sulphites | sodium bisulfite (as a preservative) | REAL | named as ingredient; not in allergen/traces tags |
| 44 | 0041196438413 | gluten | Semolina Wheat | REAL | named as ingredient; not in allergen/traces tags |
| 45 | 5054267003385 | sulphites | Sodium Bisulphite (preservative) | REAL | named as ingredient; not in allergen/traces tags |
| 46 | 0011213072067 | soy | modified soy protein | REAL | named as ingredient; not in allergen/traces tags |
| 47 | 3800213621019 | egg | egg melang (misspelt egg melange) | REAL (borderline) | misspelt but unambiguous egg melange |
| 48 | 0085239221242 | sulphites | dough conditioner (sodium metabisulfite) | REAL | named as ingredient; not in allergen/traces tags |
| 49 | 0011110139603 | sulphites | caramel color (contains sodium bisulfite) | REAL (borderline) | sulphite inside caramel colour sub-ingredient, named in parentheses as contained |
| 50 | 0041338576119 | sulphites | sodium metabisulfite (as a preservative) | REAL | named as ingredient; not in allergen/traces tags |

#### Totals
REAL 49 / 50

NOT REAL: 0722252200693 (#17, milk)

Borderline: #19, #47, #49

### Checker B

| # | code | missed families | words that name it | verdict | reason |
|---|---|---|---|---|---|
| 1 | 0858406005095 | egg | pasteurized egg mass | REAL | named as ingredient; not in snapshot allergens/traces |
| 2 | 5000221606567 | egg | dried fibre egg white | REAL | named as ingredient; not in snapshot allergens/traces |
| 3 | 0728119512015 | fish | skipjack tuna | REAL | named as ingredient; not in snapshot allergens/traces |
| 4 | 0072992043518 | tree_nut | dry roasted macadamia nuts (nut itself, tags only milk/soy, traces peanuts) | REAL | named as ingredient; not in snapshot allergens/traces |
| 5 | 0850016323026 | tree_nut | Organic Almond Butter (ground almonds) | REAL (borderline) | named as ingredient; not in snapshot allergens/traces |
| 6 | 0009300004053 | sulphites | see ingredient list (hit terms: bisulfite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 7 | 0036800580831 | gluten | see ingredient list (hit terms: semolina, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 8 | 0759386046422 | sulphites | see ingredient list (hit terms: bisulfite, shrimp) | REAL | named as ingredient; not in snapshot allergens/traces |
| 9 | 0078742004327 | sulphites | see ingredient list (hit terms: egg, metabisulfite, milk, pecan, soy, wheat, whey) | REAL | named as ingredient; not in snapshot allergens/traces |
| 10 | 0009300007610 | sulphites | see ingredient list (hit terms: metabisulfite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 11 | 5000354113796 | sulphites | see ingredient list (hit terms: metabisulphite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 12 | 0070896031891 | gluten | wheat starch | REAL (borderline) | named as ingredient; not in snapshot allergens/traces |
| 13 | 5000169622902 | sulphites | see ingredient list (hit terms: metabisulphite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 14 | 0840423100044 | gluten | see ingredient list (hit terms: almond, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 15 | 0111113636243 | milk, sulphites | see ingredient list (hit terms: cheese, durum, metabisulphite, milk, mozzarella, semolina, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 16 | 0056518000322 | sulphites | see ingredient list (hit terms: sulfur dioxide) | REAL | named as ingredient; not in snapshot allergens/traces |
| 17 | 0072655000964 | sulphites | see ingredient list (hit terms: bisulfite, butter, cream, milk, soy, soy sauce) | REAL | named as ingredient; not in snapshot allergens/traces |
| 18 | 0041460386051 | soy | see ingredient list (hit terms: barley, soy) | REAL | named as ingredient; not in snapshot allergens/traces |
| 19 | 4056489903703 | sulphites | see ingredient list (hit terms: metabisulphite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 20 | 0041380090243 | soy | see ingredient list (hit terms: soybean) | REAL | named as ingredient; not in snapshot allergens/traces |
| 21 | 5901177154044 | soy, egg | see ingredient list (hit terms: egg, milk, soy, wheat, whey) | REAL | named as ingredient; not in snapshot allergens/traces |
| 22 | 0047469067557 | soy | soy polysaccharides | REAL (borderline) | named as ingredient; not in snapshot allergens/traces |
| 23 | 00033626 | gluten | see ingredient list (hit terms: rye) | REAL | named as ingredient; not in snapshot allergens/traces |
| 24 | 0019962672415 | gluten | see ingredient list (hit terms: wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 25 | 0046567005812 | sulphites | see ingredient list (hit terms: bisulfite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 26 | 0897540001006 | celery | celery salt | REAL | named as ingredient; not in snapshot allergens/traces |
| 27 | 0072799830359 | soy | see ingredient list (hit terms: butterfat, milk, milk powder, soy) | REAL | named as ingredient; not in snapshot allergens/traces |
| 28 | 8000380205523 | peanut | see ingredient list (hit terms: barley, cream, milk, milk powder, peanut, soy, wheat, whey) | REAL | named as ingredient; not in snapshot allergens/traces |
| 29 | 0041322248923 | sulphites | see ingredient list (hit terms: bisulfite, shrimp, wheat, whey) | REAL | named as ingredient; not in snapshot allergens/traces |
| 30 | 0070759127297 | sulphites | see ingredient list (hit terms: metabisulfite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 31 | 0876941007718 | sulphites | see ingredient list (hit terms: metabisulfite, soy, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 32 | 0852949001040 | egg | see ingredient list (hit terms: egg, soy) | REAL | named as ingredient; not in snapshot allergens/traces |
| 33 | 0051000249548 | egg | see ingredient list (hit terms: butter, cream, egg, whey, yolk) | REAL | named as ingredient; not in snapshot allergens/traces |
| 34 | 0053136893855 | soy | see ingredient list (hit terms: butter, cream, peanut, soy) | REAL | named as ingredient; not in snapshot allergens/traces |
| 35 | 5037448002476 | egg | see ingredient list (hit terms: butter, egg, milk, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 36 | 0079606010102 | sulphites | see ingredient list (hit terms: metabisulfite, soy, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 37 | 0780993277640 | soy | see ingredient list (hit terms: celery, celery seed, soy) | REAL | named as ingredient; not in snapshot allergens/traces |
| 38 | 0035300434637 | soy | see ingredient list (hit terms: soy, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 39 | 4099100162189 | mustard | ground mustard seed | REAL | named as ingredient; not in snapshot allergens/traces |
| 40 | 4088600567631 | sulphites | see ingredient list (hit terms: metabisulphite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 41 | 0071100211696 | milk | nonfat buttermilk | REAL | named as ingredient; not in snapshot allergens/traces |
| 42 | 8600043034417 | gluten, sulphites | see ingredient list (hit terms: butter, metabisulphite, milk, milk powder, soy, soybean, wheat, whey) | REAL | named as ingredient; not in snapshot allergens/traces |
| 43 | 5017317000116 | sulphites | see ingredient list (hit terms: metabisulphite, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 44 | 0722337816054 | sulphites | see ingredient list (hit terms: soybean, sulfur dioxide, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 45 | 0727915198041 | sulphites | see ingredient list (hit terms: metabisulfite, sulfur dioxide) | REAL | named as ingredient; not in snapshot allergens/traces |
| 46 | 0883967382903 | sulphites | see ingredient list (hit terms: bisulfite) | REAL | named as ingredient; not in snapshot allergens/traces |
| 47 | 0851353005149 | egg | see ingredient list (hit terms: barley, egg, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |
| 48 | 0761088840918 | sulphites | see ingredient list (hit terms: bisulfite, butter, cream) | REAL | named as ingredient; not in snapshot allergens/traces |
| 49 | 0085239030509 | egg | see ingredient list (hit terms: egg, milk, soy, wheat, whey) | REAL | named as ingredient; not in snapshot allergens/traces |
| 50 | 5030765033376 | egg, milk | see ingredient list (hit terms: egg, milk, milk powder, wheat) | REAL | named as ingredient; not in snapshot allergens/traces |

#### Totals
REAL 50 / 50

NOT REAL: none

Borderline: #5, #12, #22

Checkers combined: 99/100.

### Round 10 lead re-check

The lead re-checked every NOT REAL and every borderline. The lead agrees with every call of both checkers.

NOT REAL, by record:
- 0722252200693 (milk): NOT REAL, agree. "almonds butter" is almond butter (the plant-butter mask covers "almond butter", not the plural form).

Borderline calls kept REAL, lead agrees:
- 3800213621019 egg: "egg melang".
- 0070896375568 gluten and 0070896031891 gluten: "wheat starch".
- 0011110139603 sulphites: "caramel color (contains sodium bisulfite)".
- 0850016323026 tree_nut: "Organic Almond Butter".
- 0047469067557 soy: "soy polysaccharides".

10 random REAL re-checked by the lead, all REAL: 9099842625169, 0070784220086, 0046567005812, 0041322248923, 5000354113796, 5000221606567, 5000169622902, 0079606010102, 5017317000116, 0085239221242.

### Round 10: the 1 NOT REAL, by cause

| Cause | Records | Where the gap is |
|---|---|---|
| (a) Plant butter in the plural read as dairy ("almonds butter") | 1 (A#17, 0722252200693) | The plant-butter mask covers "almond butter", not the plural form |

### Round 10 outcome

Result: **99 of 100 real** (checker A 49/50, checker B 50/50; the lead agrees with every call). The 95% Wilson interval is 94.6%-99.8%. The count is **not claimed**: the pre-registered rule needs 100 of 100. The reported figure is the measured precision of the final engine and rules: 99 of 100. Progress across rounds: 73/100, then 90/100, then 95/100, then 93/100, then 97/100, then 95/100, then 95/100, then 98/100, then 93/100, then 99/100.

The figures are for engine `17287f8` and the Round-10 count rules (R1-R14).
