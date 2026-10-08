# Hand-check of metric B (40 records)

Seed 20261008 (random.Random(seed).shuffle over samples.json list of 200, first 40). Live API fetch 2026-10-08; 18 records got HTTP 429 on first pass and were refetched. Live records matched samples except where noted.

Verdicts: R real, F false, U unclear. Strict: wine/wine vinegar/Worcestershire with no explicit sulphite/anchovy = unclear; "may contain" sentences = false (not an ingredient).

| # | code | missed families | triggering words | family verdicts | record | reason |
|---|---|---|---|---|---|---|
| 1 | 2205725004250 | gluten | "farine de graines de caroube" (carob seed flour) -> flour | gluten=F | false | carob flour is not a cereal; FR text, hit via tag |
| 2 | 0852986007005 | mollusc | "Shrimp" -> mollusc:shellfish | mollusc=F | false | shrimp is a crustacean (OFF lists en:crustaceans); shellfish term wrongly mapped to mollusc |
| 3 | 3800233780420 | sesame, peanut | "May contain traces of sesame seeds"; "peanuts" in same may-contain sentence | sesame=F, peanut=F | false | precautionary statement only, ingredient is 100% almonds |
| 4 | 4311596606016 | sulphites | "antioxidant: sodium metabisulfite" (E223) | sulphites=R | real | sulphite preservative named; allergens_tags only has de:Natriummetabisulfit, no en: sulphites tag |
| 5 | 0015400838870 | soy | "partially hydrogenated soybean oil" | soy=U | unclear | soybean oil: refined-oil exemption (EU Annex II / FALCPA) applies if highly refined; not stated |
| 6 | 3288690000013 | sulphites | "vin blanc" (white wine) via tag | sulphites=U | unclear | wine usually carries sulphites but text does not say >10 mg/kg; a small amount in dough |
| 7 | 9300617301462 | peanut | "MAY CONTAIN WHEAT, PEANUTS, TREENUTS" | peanut=F | false | precautionary statement, not an ingredient (peanut already in traces_tags) |
| 8 | 0641908932200 | fish | "worcestershire sauce" | fish=U | unclear | classic Worcestershire has anchovy, vegetarian versions exist; no anchovy named |
| 9 | 6287002130681 | sulphites | "Antioxidant (E223)" = sodium metabisulphite | sulphites=R | real | E223 explicit |
| 10 | 8710939006470 | sulphites | "rode wijnextractpoeder" (red wine extract powder) | sulphites=U | unclear | wine extract; sulphites not stated; NL text |
| 11 | 0814866029491 | gluten | "soy sauce (soy)" | gluten=U | unclear | soy sauce is usually wheat-brewed but ingredient declares only (soy); wheat not named |
| 12 | 20716639 | peanut, gluten, egg, soy | "39% Peanuts"; "Wheat Flour", "Soy Sauce Powder (Soya Beans, Wheat ...)"; "Whole Egg Powder"; "Soya Beans", "Soy Sauce Powder" | peanut=R, gluten=R, egg=R, soy=R | real | all four named plainly; allergens_tags only en:nuts |
| 13 | 7702103104229 | gluten | "malta en polvo" (malt powder) | gluten=R | real | malt = barley malt by default (lower confidence; ES text, barley not named) |
| 14 | 3229820787350 | sulphites | "vinaigre de vin" (wine vinegar) | sulphites=U | unclear | wine vinegar may carry sulphites; not stated |
| 15 | 0038000179983 | gluten | "malt flavor" | gluten=R | real | malt flavor is barley-derived (EU gluten); note FALCPA itself covers wheat only |
| 16 | 2617708001765 | milk | "crema de chocolate" -> milk:cream (via tag en:chocolate-cream) | milk=F | false | chocolate cream is a filling, no dairy named; milk is in traces_tags only ("puede contener leche") |
| 17 | 5032490052578 | sulphites, fish | "Wine Vinegar", "White Wine Vinegar"; "Worcester Sauce"; "Ranch Style Caesar Mayonnaise" (caesar is false) | sulphites=U, fish=U | unclear | no sulphite/anchovy named; vinegar and Worcester sauce only |
| 18 | 0850856007025 | egg | "usda eggs, whole. raw" | egg=R | real | eggs named; allergens_tags only gluten, milk |
| 19 | 0077260069887 | sulphites | "coconut with sodium metabisulfite (preserves whiteness)" | sulphites=R | real | explicit sulphite |
| 20 | 4070308138909 | gluten | "Johannisbrotkernmehl" (carob flour) -> flour | gluten=F | false | carob flour via tag; quark/yoghurt product |
| 21 | 8445290760258 | milk | "CHOC MOCHA" -> milk:mocha | milk=F | false | packaging OCR, no ingredient list; "mocha" is not milk |
| 22 | 5000181024012 | milk | "BRITISH MILK PASTEURISED, SKIMMED, FRESH FILTERED MILK" | milk=R | real | product is milk; allergens_tags empty |
| 23 | 3273220083345 | gluten | "farine de graines de caroube" (carob flour) | gluten=F | false | carob flour; soy dessert |
| 24 | 3254550025977 | milk | "Cream from unpasteurised cow's milk" | milk=R | real | butter; allergens_tags empty |
| 25 | 3222473041725 | milk | "traces of milk" inside ingredient text | milk=F | false | precautionary phrase, not an ingredient (milk in traces_tags) |
| 26 | 0023384344416 | sesame | "sesame oil", "black sesame seed, white sesame seed" | sesame=R | real | sesame named; allergens_tags lacks sesame |
| 27 | 9358553100441 | soy | "soy ptotein" (typo for protein) | soy=R | real | soy protein; allergens_tags only chicken, gluten |
| 28 | 0735850257228 | soy | "may contain traces of wheat (gluten), milk and soy" | soy=F | false | precautionary statement (soy already in traces_tags) |
| 29 | 0086785211664 | sulphites | "THIS ALLURING WINE CAPTURES..." marketing text | sulphites=U | unclear | a wine; no ingredient list, only marketing copy; sulphites likely but not in text |
| 30 | 8002330008857 | soy | "Può contenere tracce di altra frutta a guscio e soia" | soy=F | false | precautionary statement (soia in traces_tags) |
| 31 | 0811112030621 | gluten | "TART CHERRY" -> wheat:tart / gluten:tart | gluten=F | false | "tart" matched as a cereal word (likely spelt/"tartary" alias); cherry |
| 32 | 7616800460291 | sulphites | "disulfite de sodium" (E223) | sulphites=R | real | explicit sulphite; FR text |
| 33 | 6430074358594 | gluten | "gluteeniton kaurahiutale" (gluten-free oat flakes) -> gluten:oat | gluten=F | false | explicitly gluten-free oats; FI text |
| 34 | 0036800473942 | sulphites | "sodium sulfite" | sulphites=R | real | explicit sulphite; allergens_tags gluten, soybeans only |
| 35 | 7791620009827 | milk | OCR "Contienelechey.soia" (contiene leche y soja) | milk=R | real | garbled OCR but reads as "contains milk and soy"; allergens_tags lacks milk |
| 36 | 6927744830127 | mollusc | "extrait de crevettes" (shrimp extract) -> mollusc:shellfish | mollusc=F | false | shrimp is a crustacean (en:crustaceans already set) |
| 37 | 8711200438631 | gluten | "farine de graines de caroube" (carob flour) | gluten=F | false | carob flour; bouillon |
| 38 | 8422823110070 | sulphites | "E-220" | sulphites=R | real | E220 sulphur dioxide named; allergens_tags empty |
| 39 | 3274613030076 | crustacean | "escargots (mollusques)" -> crustacean:shellfish | crustacean=F | false | snail is a mollusc (en:molluscs already set), not a crustacean |
| 40 | 5400601358626 | milk | "Lait pasteurisé 1% de matières grasses" | milk=R | real_traces_only | milk is the main ingredient; allergens_tags empty, traces_tags has en:milk |
