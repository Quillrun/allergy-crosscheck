# Hand-check of the strict count

The strict count (README, "The count we claim") was hand-checked in five rounds against rules fixed before each run. The rule: draw 100 records from the 200-record `strict_sample`, judge each on the snapshot record, and claim the count only if 100 of 100 are real. The original protocol allowed 2 rounds; round 3 ran under the Round-3 rules the README fixed on 2026-10-08, after round 2, with the same 100-of-100 decision rule. Round 4 ran under the Round-4 rules (R1–R6, README, fixed 2026-10-09), again with the same decision rule. Round 5 ran under the Round-5 rules (R1–R7, README, fixed 2026-10-09), with the same decision rule. A record is real only if the English ingredient text names, as an ingredient, something that contains the allergen, and neither the allergen list nor the "may contain" list names it. Unclear counts as not real.

In the tables below, `$C` stands for the local cache directory `~/Library/Caches/allergy-crosscheck`. The records are public Open Food Facts data. Each checker's table is copied verbatim from its result file.

| | Engine commit | Run | Sample | Checkers | Result |
|---|---|---|---|---|---|
| Round 1 | `2595749` | `$C/run3` | seed 77031, 100 records | A and B, 50 each | 73/100 |
| Round 2 | `1186f6e` | `$C/run4` | 200-record `strict_sample` (seed 7), no overlap with round 1; 100 drawn with mulberry32 seed 20261008 | A and B, independent, 50 each | 90/100 |
| Round 3 | `4c7c554` (rules `4f64c78`) | `$C/run5` | 200-record `strict_sample` (reservoir seed 3); 4 records overlapping rounds 1-2 excluded; 100 drawn with mulberry32 seed 20261009 | A and B, independent, 50 each | 95/100 |
| Round 4 | `4c7c554` (unchanged since round 3; count rules R1–R6, commit `b737e42`) | `$C/run6` | 200-record `strict_sample` (reservoir seed 5); 8 records overlapping rounds 1-3 excluded; 100 drawn with mulberry32 seed 20261010 | A and B, independent, 50 each | 93/100 |
| Round 5 | `872b0ec` (rules `4549ccd`, pre-registered before the run; count rules R1–R7) | `$C/run7` | 200-record `strict_sample` (reservoir seed 9); 5 records overlapping earlier rounds excluded; 100 drawn with mulberry32 seed 20261011 | A and B, independent, 50 each | 97/100 after lead re-check (96/100 by the checkers alone) |

Round 2 also compared the new engine against the old one (`2595749`). Determinism: shard 2 re-run gave identical counts apart from timing.

## Round 1 (engine 2595749, seed 77031): 38/50 + 35/50 = 73/100

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

## Round 2 (engine 1186f6e, rules from the README): 45/50 + 45/50 = 90/100

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

The figures are for engine `1186f6e`. The fixes for (d) and (e) change the engine, not this measurement. Whether the number is used anywhere public is the operator's decision.

## Round 3 (engine 4c7c554, rules 4f64c78, Round-3 rules from the README): 47/50 + 48/50 = 95/100

Run: `$C/run5` (`summary.json`; trimmed copy in [`results-strict-round3-2026-10-09.json`](results-strict-round3-2026-10-09.json)). Result files: `$C/run5/hc_a_result.md` and `hc_b_result.md`. The run took 38.9 minutes wall clock. Determinism: shard 2 re-run gave identical counts apart from timing. The old-engine comparison is against `1186f6e` (`$C/snap-1186f6e`).

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

Under the pre-registered rule (100/100 to claim) the count is **not claimed**. The measured precision is reported: 95/100, 95% Wilson interval 88.7%-97.8%. Progress across rounds: 73/100, then 90/100, then 95/100.

The figures are for engine `4c7c554` with the round-3 rules (`4f64c78`). Whether the number is used anywhere public is the operator's decision.

## Round 4 (rules b737e42, engine 4c7c554): 46/50 + 47/50 = 93/100

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

The figures are for engine `4c7c554` and the R1–R6 count rules. Whether the number is used anywhere public is the operator's decision.

## Round 5 (rules 4549ccd, engine 872b0ec): 47/50 + 49/50 = 96/100 by the checkers, 97/100 after lead re-check

Run: `$C/run7` (`summary.json`; copy in [`results-strict-round5-2026-10-09.json`](results-strict-round5-2026-10-09.json)). Result files: `$C/run7/hc_a_result.md` and `hc_b_result.md`. The slowest shard took 2,391 s. Determinism: shard 2 re-run gave identical counts apart from `seconds`. The rules (commit `4549ccd`) were pre-registered before the run; the engine as run is `872b0ec`.

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

Separately, and not part of the count: the round-5 vanished-hit audit of the run found two fail-opens introduced in engine `872b0ec`. The allergy-advice strip removed a real "For allergens see cereals containing gluten, nuts, soya and sulphites" (5013803340155, gluten lost), and "peanut milk" as a plant milk hid "milk" in garbled text (0034952369342). It also found asafoetida (0664648120492) losing its only gluten signal. These are being fixed in a separate engine commit.

The figures are for engine `872b0ec` and the R1–R7 count rules. Whether the number is used anywhere public is the operator's decision.
