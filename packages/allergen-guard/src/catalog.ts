// Allergen catalogue: the EU's 14 regulated allergens plus the US "Big 9",
// with wheat kept separate from gluten (a wheat allergy is not coeliac disease).

export type AllergenId =
  | "peanut"
  | "tree_nut"
  | "milk"
  | "egg"
  | "wheat"
  | "gluten"
  | "soy"
  | "sesame"
  | "fish"
  | "crustacean"
  | "mollusc"
  | "celery"
  | "mustard"
  | "lupin"
  | "sulphites";

export const ALLERGENS: Record<AllergenId, { label: string; spoken: string }> = {
  peanut: { label: "Peanuts", spoken: "peanuts" },
  tree_nut: { label: "Tree nuts", spoken: "tree nuts" },
  milk: { label: "Milk", spoken: "milk" },
  egg: { label: "Egg", spoken: "egg" },
  wheat: { label: "Wheat", spoken: "wheat" },
  gluten: { label: "Gluten", spoken: "gluten" },
  soy: { label: "Soy", spoken: "soy" },
  sesame: { label: "Sesame", spoken: "sesame" },
  fish: { label: "Fish", spoken: "fish" },
  crustacean: { label: "Crustaceans", spoken: "shellfish" },
  mollusc: { label: "Molluscs", spoken: "molluscs" },
  celery: { label: "Celery", spoken: "celery" },
  mustard: { label: "Mustard", spoken: "mustard" },
  lupin: { label: "Lupin", spoken: "lupin" },
  sulphites: { label: "Sulphites", spoken: "sulphites" },
};

export const ALL_ALLERGENS = Object.keys(ALLERGENS) as AllergenId[];

// What people actually say, mapped to catalogue ids. "Shellfish" covers both
// crustaceans and molluscs on purpose: the stricter reading is the safe one.
const ALIASES: Record<string, AllergenId[]> = {
  peanut: ["peanut"],
  peanuts: ["peanut"],
  groundnut: ["peanut"],
  "tree nut": ["tree_nut"],
  "tree nuts": ["tree_nut"],
  nut: ["tree_nut", "peanut"],
  nuts: ["tree_nut", "peanut"],
  almonds: ["tree_nut"],
  cashews: ["tree_nut"],
  hazelnuts: ["tree_nut"],
  walnuts: ["tree_nut"],
  milk: ["milk"],
  dairy: ["milk"],
  lactose: ["milk"],
  cheese: ["milk"],
  egg: ["egg"],
  eggs: ["egg"],
  wheat: ["wheat", "gluten"],
  gluten: ["gluten"],
  coeliac: ["gluten"],
  celiac: ["gluten"],
  soy: ["soy"],
  soya: ["soy"],
  soybean: ["soy"],
  soybeans: ["soy"],
  sesame: ["sesame"],
  fish: ["fish"],
  shellfish: ["crustacean", "mollusc"],
  crustacean: ["crustacean"],
  crustaceans: ["crustacean"],
  shrimp: ["crustacean"],
  prawns: ["crustacean"],
  mollusc: ["mollusc"],
  molluscs: ["mollusc"],
  mollusk: ["mollusc"],
  mollusks: ["mollusc"],
  celery: ["celery"],
  mustard: ["mustard"],
  lupin: ["lupin"],
  lupine: ["lupin"],
  sulphites: ["sulphites"],
  sulfites: ["sulphites"],
  sulphite: ["sulphites"],
  sulfite: ["sulphites"],
  "sulphur dioxide": ["sulphites"],
  "sulfur dioxide": ["sulphites"],
  seafood: ["fish", "crustacean", "mollusc"],
  "shell fish": ["crustacean", "mollusc"],
  "cow s milk": ["milk"],
  "milk protein": ["milk"],
  casein: ["milk"],
  whey: ["milk"],
  "egg white": ["egg"],
  "egg yolk": ["egg"],
  "sesame seed": ["sesame"],
  "pine nut": ["tree_nut"],
  "brazil nut": ["tree_nut"],
  almond: ["tree_nut"],
  cashew: ["tree_nut"],
  hazelnut: ["tree_nut"],
  walnut: ["tree_nut"],
  pecan: ["tree_nut"],
  pistachio: ["tree_nut"],
  macadamia: ["tree_nut"],
  prawn: ["crustacean"],
  crab: ["crustacean"],
  lobster: ["crustacean"],
  oyster: ["mollusc"],
  mussel: ["mollusc"],
  squid: ["mollusc"],
};

// "nut allergy", "lactose intolerant", "gluten-free": the qualifier isn't the allergen.
const QUALIFIERS = /\b(an?|to|allerg(y|ies|ic)|intoleran(t|ce)|sensitiv(e|ity)|free)\b/g;

/** Resolve spoken allergy names. Unknown names come back in `unknown`, never silently dropped. */
export function resolveAllergies(names: string[]): { ids: AllergenId[]; unknown: string[] } {
  const ids = new Set<AllergenId>();
  const unknown: string[] = [];
  // "peanuts and tree nuts", "dairy, eggs": one name per allergen.
  for (const raw of names.flatMap((n) => n.split(/,|&|\band\b|\bor\b|\bplus\b/i))) {
    const key = normalize(raw).replace(QUALIFIERS, " ").replace(/\s+/g, " ").trim();
    const singular = key.replace(/(es|s)$/, "");
    const direct = (ALLERGENS as Record<string, unknown>)[key.replace(/ /g, "_")] ? [key.replace(/ /g, "_") as AllergenId] : undefined;
    const hit = ALIASES[key] ?? ALIASES[singular] ?? ALIASES[key.replace(/s$/, "")] ?? direct;
    if (hit) hit.forEach((id) => ids.add(id));
    else if (raw.trim()) unknown.push(raw.trim()); // includes names in scripts this catalogue can't read
  }
  return { ids: [...ids], unknown };
}

export function normalize(text: string): string {
  return text
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "") // zero-width characters and soft hyphens can't split a word
    .normalize("NFKD") // fullwidth and other compatibility forms become plain letters

    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\be (\d{3,4}[a-z]?)\b/g, "e$1") // "E-220", "E 220" -> "e220"
    .trim();
}

/**
 * Allergen words from other languages that are not English words. English ingredient text
 * containing one of these is partly untranslated, so a clean scan of it can't be trusted.
 * Left out on purpose: "ei", "ble", "mani", "latte" (English words or too short to be safe).
 */
export const FOREIGN_ALLERGEN_WORDS: ReadonlySet<string> = new Set(
  "trigo, hvete, hvetemel, weizen, weizenmehl, tarwe, harina, farine, lait, leche, melk, milch, huevo, huevos, eier, oeuf, oeufs, uovo, soja, soia, cacahuete, cacahuetes, erdnuss, almendra, almendras, avellana, avellanas, noisette, noisettes, haselnuss, haselnusse, nocciole, sesamo, ajonjoli, apio, selleri, sellerie, moutarde, senf, mostaza, sulfitos, solfiti, pescado, poisson, fisk, pesce".split(",").map((w) => normalize(w)),
);

/**
 * One dictionary entry. `contains` means the ingredient is that allergen;
 * `possible` means it often hides one (sauces, stocks, chocolate) and must
 * never be waved through. `unless` lists phrases that cancel the match
 * ("peanut butter" is not dairy butter).
 */
export type Term = {
  terms: string[];
  contains: AllergenId[];
  possible?: AllergenId[] | "all";
  unless?: string[];
};

const PLANT_MILKS = ["almond milk", "oat milk", "soy milk", "soya milk", "rice milk", "coconut milk", "cashew milk", "hemp milk", "pea milk", "plant milk"];
// Rarer, and also what OCR makes of "contains nuts, peanut, milk": masked from dairy milk but still possible milk (the nut term flags the nut).
const RARE_PLANT_MILKS = ["corn milk", "peanut milk", "walnut milk", "hazelnut milk"];
const NOT_DAIRY_BUTTER = ["peanut butter", "cocoa butter", "shea butter", "apple butter", "nut butter", "almond butter", "cashew butter", "seed butter", "sunflower butter", "sunflower seed butter", "butter bean", "butter beans", "coconut butter", "cacao butter", "mango butter", "kokum butter", "butter flavour", "butter flavor", "butter flavouring", "butter flavoring", "parkii butter", "butyrospermum parkii butter",
  "hazelnut butter", "pecan butter", "pistachio butter", "walnut butter", "macadamia butter", "brazil nut butter", "pumpkin seed butter", "sesame butter", "soy butter", "soynut butter", "fruit butter"];
const NOT_WHEAT_FLOUR = [
  "rice flour", "corn flour", "cornflour", "maize flour", "almond flour", "coconut flour", "chickpea flour", "gram flour",
  "buckwheat flour", "potato flour", "tapioca flour", "cassava flour", "oat flour", "gluten free flour", "soy flour",
  "soya flour", "lupin flour", "sorghum flour", "teff flour", "millet flour", "quinoa flour", "banana flour", "arrowroot flour",
  "carob flour", "carob seed flour", "carob bean flour", "locust bean flour", "mustard flour", "peanut flour", "lentil flour", "pea flour",
  "masa flour", "corn masa flour", "flax flour", "flaxseed flour", "linseed flour", "rye flour", "barley flour", "malt flour",
  "amaranth flour", "konjac flour", "bean flour", "broad bean flour", "fava bean flour", "garbanzo flour", "garbanzo bean flour", "chickpeas flour",
  "sunflower seed flour", "seed flour", "hemp flour", "pumpkin seed flour", "tigernut flour", "tiger nut flour", "yam flour", "cauliflower flour",
  "citrus flour", "cashew flour", "almonds flour", "chestnut flour", "hazelnut flour", "walnut flour", "flour treatment agent", "flour treatment",
];
const NOT_WHEAT_PASTA = ["rice pasta", "gluten free pasta", "chickpea pasta", "lentil pasta", "corn pasta", "rice lasagne", "gluten free lasagne"];
const CULTURES = ["yogurt culture", "yoghurt culture", "cheese culture", "kefir culture"];
const SULPHITE_CARAMEL = ["sulphite ammonia caramel", "sulfite ammonia caramel", "caustic sulphite caramel", "caustic sulfite caramel"];
const BAKED: AllergenId[] = ["milk", "egg", "tree_nut", "peanut", "soy"];
// What a product sold as gluten-free may still contain: binders, nut and legume flours (lupin is common in gluten-free baking).
export const GLUTEN_FREE_MAY_CONTAIN: AllergenId[] = ["milk", "egg", "soy", "tree_nut", "peanut", "sesame", "lupin"];

export const TERMS: Term[] = [
  // peanut
  { terms: ["peanut", "groundnut", "arachis", "arachis hypogaea", "monkey nut", "satay"], contains: ["peanut"] },
  // tree nuts
  {
    terms: ["almond", "hazelnut", "filbert", "walnut", "cashew", "pecan", "pistachio", "brazil nut", "macadamia", "pine nut",
      "prunus amygdalus", "prunus dulcis", "corylus avellana", "juglans regia", "anacardium occidentale", "bertholletia excelsa", "pistacia vera",
      "tree nut", "treenut", "chesnut", "pignoli", "pinoli", "praline", "marzipan", "frangipane", "gianduja", "nutella", "chestnut"],
    contains: ["tree_nut"],
    unless: ["water chestnut", "chestnut mushroom"],
  },
  { terms: ["nut"], contains: ["tree_nut"], possible: ["peanut"], unless: ["pine nut", "brazil nut", "monkey nut", "tree nut", "nutmeg nut"] },
  { terms: ["pesto"], contains: ["tree_nut", "milk"], possible: ["peanut"] },
  { terms: ["nougat"], contains: [], possible: ["tree_nut", "peanut", "egg", "milk"] },
  { terms: ["amaretti", "macaron", "orgeat", "romesco", "baklava", "dukkah"], contains: ["tree_nut"], possible: ["egg", "wheat", "gluten", "sesame"] },
  { terms: ["amaretto", "frangelico", "nocino", "biscotti", "mole", "nut oil"], contains: [], possible: ["tree_nut", "peanut"] },
  // milk
  { terms: ["milk", "buttermilk", "milk powder", "milkfat"], contains: ["milk"], unless: [...PLANT_MILKS, ...RARE_PLANT_MILKS, "milk thistle"] },
  { terms: RARE_PLANT_MILKS, contains: [], possible: ["milk"] },
  { terms: ["butter", "ghee", "butterfat"], contains: ["milk"], unless: NOT_DAIRY_BUTTER },
  { terms: ["cream", "sour cream", "creme fraiche", "half and half"], contains: ["milk"], unless: ["cream of tartar", "coconut cream", "ice cream", "cream soda", "cream crackers", "oat cream", "soy cream", "soya cream", "cashew cream", "almond cream", "rice cream", "plant cream", "vegan cream"] },
  {
    terms: ["cheese", "parmesan", "parmigiano", "pecorino", "mozzarella", "cheddar", "ricotta", "feta", "mascarpone", "gouda", "brie",
      "camembert", "gruyere", "halloumi", "paneer", "burrata", "quark", "skyr"],
    contains: ["milk"],
    unless: ["cheese culture"],
  },
  { terms: ["milkshake", "cappuccino", "flat white", "macchiato", "frappuccino", "hot chocolate"], contains: ["milk"], possible: ["soy", "tree_nut"], unless: [...PLANT_MILKS, ...RARE_PLANT_MILKS] },
  { terms: ["mocha"], contains: [], possible: ["milk"] },
  { terms: ["barley grass", "wheat grass"], contains: [], possible: ["gluten", "wheat"] }, // young leaves, gluten only if seeds get in
  { terms: ["butter flavour", "butter flavor", "butter flavouring", "butter flavoring"], contains: [], possible: ["milk"] },
  { terms: ["smoothie"], contains: [], possible: ["milk", "tree_nut", "peanut", "soy"] },
  { terms: ["yogurt", "yoghurt", "yoghourt", "kefir", "whey", "casein", "caseinate", "lactose", "lactalbumin", "custard", "bechamel", "ice cream"], contains: ["milk"], unless: ["coconut yogurt", "coconut yoghurt", ...CULTURES, "yogurt alternative", "yoghurt alternative"] },
  { terms: CULTURES, contains: [], possible: ["milk"] }, // a starter culture is usually grown on milk, not always
  { terms: ["yogurt alternative", "yoghurt alternative"], contains: [], possible: ["milk"] }, // usually plant-based; the label decides
  { terms: ["curd"], contains: ["milk"], unless: ["bean curd", "lemon curd"] },
  { terms: ["lemon curd"], contains: ["milk", "egg"] },
  // egg
  { terms: ["egg", "yolk", "albumen", "albumin", "ovalbumin", "lysozyme", "meringue", "hollandaise", "eggnog"], contains: ["egg"], unless: ["egg plant", "egg noodle free", "egg roll"] },
  { terms: ["egg roll"], contains: [], possible: ["egg", "wheat", "gluten"] },
  { terms: ["mayonnaise", "mayo", "aioli"], contains: ["egg"], possible: ["mustard"] },
  // wheat and gluten
  { terms: ["wheat", "semolina", "durum", "spelt", "kamut", "farro", "einkorn", "emmer", "couscous", "bulgur", "bulgar", "freekeh", "seitan", "graham", "wheatflour", "wheatgerm"], contains: ["wheat", "gluten"], unless: ["wheat grass", "rice semolina", "corn semolina", "maize semolina"] },
  { terms: ["gluten", "cereals containing gluten"], contains: ["gluten"], possible: ["wheat"], unless: ["corn gluten", "maize gluten"] },
  { terms: ["flour"], contains: ["wheat", "gluten"], unless: NOT_WHEAT_FLOUR },
  {
    terms: ["pasta", "spaghetti", "macaroni", "penne", "fusilli", "linguine", "tagliatelle", "fettuccine", "lasagne", "lasagna", "ravioli",
      "tortellini", "gnocchi", "udon", "lasagne sheet", "lasagna sheet"],
    contains: ["wheat", "gluten"],
    possible: ["egg"],
    unless: NOT_WHEAT_PASTA,
  },
  { terms: ["bread", "breadcrumb", "panko", "pita", "pitta", "naan", "bagel", "crouton", "cracker", "pizza", "tortilla", "wonton", "dumpling", "ramen"], contains: ["wheat", "gluten"], possible: ["milk", "egg", "soy", "sesame"], unless: ["corn tortilla", "gluten free bread", "rice cracker", "rye bread", "pumpernickel"] },
  // Rye is gluten, not wheat, but most rye breads are part wheat flour.
  { terms: ["rye bread", "pumpernickel"], contains: ["gluten"], possible: ["wheat", "milk", "egg", "soy", "sesame"] },
  { terms: ["cake", "cookie", "biscuit", "pastry", "puff pastry", "filo", "phyllo", "croissant", "pie crust", "brownie", "muffin", "waffle", "pancake", "doughnut", "donut", "scone"], contains: ["wheat", "gluten"], possible: BAKED },
  { terms: ["soba"], contains: [], possible: ["wheat", "gluten"] },
  { terms: ["noodle"], contains: [], possible: ["wheat", "gluten", "egg"], unless: ["rice noodle", "glass noodle", "rice vermicelli"] },
  { terms: ["soy sauce", "teriyaki"], contains: ["soy", "wheat", "gluten"] },
  { terms: ["barley", "rye", "oat", "oatmeal", "malt", "malt vinegar", "malt extract", "brewer s yeast", "beer", "ale", "lager", "triticale", "bran"], contains: ["gluten"], unless: ["rice bran", "maize bran", "corn bran", "mustard bran", "soy bran", "barley grass", "wheat grass"] },
  { terms: ["gluten free"], contains: [], possible: GLUTEN_FREE_MAY_CONTAIN },
  // soy
  { terms: ["soy", "soya", "soybean", "soyabean", "soja", "tofu", "bean curd", "tempeh", "edamame", "miso", "shoyu", "tamari", "natto", "textured vegetable protein", "tvp", "glycine max"], contains: ["soy"] },
  // HVP with no named source is soy, wheat or corn; the sourced forms ("hydrolyzed wheat protein") match their own source term
  { terms: ["hydrolyzed vegetable protein", "hydrolysed vegetable protein", "hydrolyzed plant protein", "hydrolysed plant protein", "hvp"], contains: [], possible: ["gluten", "wheat", "soy"] },
  // commercial asafoetida (hing) is routinely compounded with wheat flour
  { terms: ["asafoetida", "asafetida", "hing"], contains: [], possible: ["gluten", "wheat"] },
  { terms: ["lecithin", "e322", "vegetable protein"], contains: [], possible: ["soy"] },
  { terms: ["emulsifier"], contains: [], possible: ["soy", "egg"] },
  { terms: ["margarine", "vegetable spread"], contains: [], possible: ["milk", "soy"] },
  { terms: ["vegetable oil"], contains: [], possible: ["soy", "peanut"] },
  // sesame
  { terms: ["sesame", "sesamum indicum", "tahini", "tahina", "halva", "halvah", "halwa", "gomasio", "benne", "hummus", "houmous", "za atar", "zaatar"], contains: ["sesame"] },
  // fish
  {
    terms: ["fish", "salmon", "tuna", "cod", "anchovy", "anchovies", "sardine", "haddock", "trout", "mackerel", "tilapia", "halibut",
      "pollock", "hake", "herring", "sea bass", "swordfish", "snapper", "plaice", "pangasius", "catfish", "carp", "perch", "eel",
      "caviar", "roe", "surimi", "fish sauce", "nam pla", "bonito", "codfish", "saltfish", "barramundi", "bacalao", "baccala", "salmo salar", "theragra chalcogramma", "gadus", "katsuwonus pelamis", "thunnus"],
    contains: ["fish"],
  },
  { terms: ["worcestershire"], contains: ["fish"], possible: ["gluten"] },
  { terms: ["caesar dressing"], contains: ["fish"], possible: ["egg", "milk"] },
  { terms: ["dashi"], contains: [], possible: ["fish"] },
  // crustaceans and molluscs
  { terms: ["shrimp", "prawn", "crab", "lobster", "crayfish", "crawfish", "langoustine", "krill", "scampi", "crustacean", "crustacea", "crabmeat"], contains: ["crustacean"] },
  { terms: ["shellfish"], contains: ["crustacean", "mollusc"] },
  { terms: ["clam", "mussel", "oyster", "scallop", "squid", "calamari", "octopus", "snail", "escargot", "cuttlefish", "abalone", "whelk", "cockle", "conch", "mollusc", "mollusk", "cephalopod"], contains: ["mollusc"], unless: ["oyster mushroom", "king oyster mushroom"] },
  // celery, mustard, lupin, sulphites
  { terms: ["celery", "celeriac", "celery salt", "celery seed"], contains: ["celery"] },
  { terms: ["stock", "broth", "bouillon", "stock cube", "gravy"], contains: [], possible: ["celery", "wheat", "gluten"] },
  { terms: ["mustard", "dijon"], contains: ["mustard"] },
  { terms: ["lupin", "lupine", "lupini"], contains: ["lupin"] },
  {
    terms: ["sulphite", "sulfite", "sulphur dioxide", "sulfur dioxide", "metabisulphite", "metabisulfite", "bisulphite", "bisulfite", "wine",
      "e220", "e221", "e222", "e223", "e224", "e225", "e226", "e227", "e228"],
    contains: ["sulphites"],
    unless: SULPHITE_CARAMEL,
  },
  { terms: SULPHITE_CARAMEL, contains: [], possible: ["sulphites"] }, // E150b: made with sulphite, not a sulphite ingredient
  { terms: ["dried apricot", "dried fruit", "raisin", "sultana", "currant", "prune", "dried mango", "glace cherry", "maraschino",
      "cider", "champagne", "prosecco", "cava", "port", "sherry", "vermouth", "mirin", "sake", "balsamic", "vinegar", "verjuice",
      "sauerkraut", "pickled", "pickle", "jam", "marmalade", "bottled lemon juice", "potato chips", "crisps"], contains: [], possible: ["sulphites"] },
  // dishes and composites whose recipe names the allergen, or usually hides it
  { terms: ["brioche", "challah"], contains: ["wheat", "gluten", "egg"], possible: ["milk", "sesame"] },
  { terms: ["quiche", "crepe", "crepes", "pancake", "waffle", "yorkshire pudding", "french toast", "tempura", "spaetzle", "eclair", "profiterole"], contains: ["wheat", "gluten", "egg"], possible: ["milk"] },
  { terms: ["frittata", "omelette", "omelet", "souffle", "custard", "hollandaise", "bearnaise", "aioli", "carbonara", "eggnog"], contains: ["egg"], possible: ["milk", "wheat", "gluten"] },
  { terms: ["marshmallow"], contains: [], possible: ["egg", "milk", "wheat", "gluten"] },
  { terms: ["tiramisu", "cheesecake", "trifle"], contains: ["milk", "egg", "wheat", "gluten"] },
  { terms: ["gelato", "mousse", "panna cotta", "creme brulee", "rice pudding", "labneh", "raclette", "quark", "kefir", "paneer", "tzatziki", "raita", "lassi", "bechamel", "alfredo", "non dairy creamer"], contains: ["milk"], possible: ["egg", "tree_nut"], unless: ["kefir culture"] },
  { terms: ["fudge", "toffee", "caramel", "butterscotch"], contains: [], possible: ["milk", "tree_nut"] },
  { terms: ["korma", "biryani", "pasanda", "tikka masala", "butter chicken"], contains: [], possible: ["tree_nut", "peanut", "milk", "mustard", "celery"] },
  { terms: ["falafel", "shawarma", "baba ganoush", "baba ghanoush", "halva", "halwa", "furikake", "gomasio", "simit", "tarator"], contains: [], possible: ["sesame", "wheat", "gluten"] },
  { terms: ["burger bun", "hamburger bun", "bagel bun", "sesame bun"], contains: ["wheat", "gluten"], possible: ["sesame", "milk", "egg", "soy"] },
  { terms: ["hot dog", "sausage", "salami", "chorizo", "pepperoni", "frankfurter", "mortadella", "pate", "terrine", "meatball", "burger", "nugget"], contains: [], possible: ["wheat", "gluten", "milk", "soy", "mustard", "celery", "sulphites", "tree_nut", "egg"] },
  { terms: ["sushi", "maki", "nigiri", "sashimi", "poke"], contains: ["fish"], possible: ["crustacean", "sesame", "soy", "egg", "wheat", "gluten"], unless: ["sushi rice"] },
  { terms: ["paella", "gumbo", "jambalaya", "cioppino", "seafood", "fruits de mer", "laksa", "tom yum", "tom kha", "vongole", "frutti di mare"], contains: [], possible: ["crustacean", "mollusc", "fish", "celery", "wheat", "gluten", "peanut"] },
  { terms: ["bisque", "chowder"], contains: ["milk"], possible: ["crustacean", "mollusc", "fish", "celery", "wheat", "gluten"] },
  { terms: ["bouillabaisse", "fish stew", "fumet", "taramasalata", "lox", "gefilte", "katsuobushi", "bagoong", "isinglass", "ikura"], contains: ["fish"], possible: ["crustacean", "mollusc", "celery"] },
  { terms: ["caesar salad", "caesar"], contains: ["fish", "egg"], possible: ["milk", "wheat", "gluten"] },
  { terms: ["kimchi", "gochujang", "doenjang", "kecap manis", "teriyaki", "bibimbap", "pad thai"], contains: [], possible: ["soy", "fish", "crustacean", "sesame", "wheat", "gluten", "peanut"] },
  { terms: ["mirepoix", "soffritto", "sofrito", "waldorf", "old bay"], contains: ["celery"], possible: ["tree_nut", "egg"] },
  { terms: ["soup", "bouquet garni", "v8", "bloody mary"], contains: [], possible: ["celery", "milk", "wheat", "gluten", "mustard"] },
  { terms: ["piccalilli", "sarson", "mustard seed", "mustard greens"], contains: ["mustard"] },
  { terms: ["vinaigrette", "chutney", "relish", "wasabi", "horseradish", "pickling spice", "tonkatsu", "remoulade"], contains: [], possible: ["mustard", "sulphites", "egg", "celery"] },
  { terms: ["orzo", "roux", "okonomiyaki", "gnocchi", "pastry", "pie", "tart", "cake", "biscuit", "cookie", "muffin", "scone", "crumble", "batter", "dumpling"], contains: ["wheat", "gluten"], possible: ["milk", "egg", "tree_nut", "peanut", "soy"], unless: ["tart cherry", "tart cherries", "rice cake", "shepherd s pie", "cottage pie", "fish pie"] },
  { terms: ["vegan burger", "veggie burger", "plant based burger", "meat substitute"], contains: [], possible: ["soy", "wheat", "gluten", "lupin", "mustard", "celery", "sesame"] },
  // a few words from other languages that name an allergen outright
  { terms: ["dulce de leche", "mozarella", "millk"], contains: ["milk"] },
  { terms: ["pretzel", "baguette", "ciabatta", "focaccia", "sourdough", "croissant", "wrapper", "filo", "phyllo", "puff pastry", "shortcrust"], contains: ["wheat", "gluten"], possible: ["milk", "egg", "sesame", "soy"] },
  { terms: ["porridge", "corn flakes", "cornflakes", "rice krispies"], contains: [], possible: ["gluten", "milk"] },
  { terms: ["suet", "mincemeat"], contains: [], possible: ["wheat", "gluten", "tree_nut", "sulphites"] },
  { terms: ["kielbasa", "morcilla", "kabanos", "black pudding", "haggis"], contains: [], possible: ["wheat", "gluten", "milk", "soy", "mustard", "celery", "sulphites"] },
  { terms: ["ketchup", "barbecue", "barbeque", "bbq", "hot sauce", "hotsauce", "sriracha", "salsa"], contains: [], possible: ["celery", "mustard", "sulphites", "soy", "wheat", "gluten"] },
  { terms: ["turkish delight", "baklawa"], contains: [], possible: ["tree_nut", "wheat", "gluten"] },
  { terms: ["fromage", "kase", "queso", "formaggio", "lait", "leche", "latte", "milch", "sahne", "nata", "beurre", "mantequilla"], contains: ["milk"] },
  { terms: ["oeuf", "oeufs", "huevo", "huevos", "uovo", "uova", "ei", "eier"], contains: ["egg"] },
  { terms: ["cacahuete", "cacahuate", "erdnuss", "arachide"], contains: ["peanut"] },
  { terms: ["altramuz", "altramuces"], contains: ["lupin"] },
  // composites that can hide anything
  { terms: ["chocolate"], contains: [], possible: ["milk", "soy", "tree_nut", "peanut"] },
  { terms: ["granola", "muesli", "cereal"], contains: [], possible: ["tree_nut", "peanut", "gluten", "wheat", "milk", "soy", "sesame"] },
  {
    terms: ["sauce", "seasoning", "spice mix", "spice blend", "flavouring", "flavoring", "natural flavour", "natural flavor",
      "curry paste", "curry powder", "dressing", "marinade", "stuffing", "protein powder", "ready meal"],
    contains: [],
    possible: "all",
    unless: ["fish sauce", "soy sauce"], // defined products with their own entries
  },
];

// Open Food Facts allergen tags, mapped to catalogue ids.
export const OFF_ALLERGEN_TAGS: Record<string, AllergenId[]> = {
  "en:peanuts": ["peanut"],
  "en:nuts": ["tree_nut"],
  "en:milk": ["milk"],
  "en:eggs": ["egg"],
  "en:gluten": ["gluten"],
  "en:wheat": ["wheat", "gluten"],
  "en:soybeans": ["soy"],
  "en:sesame-seeds": ["sesame"],
  "en:fish": ["fish"],
  "en:crustaceans": ["crustacean"],
  "en:molluscs": ["mollusc"],
  "en:celery": ["celery"],
  "en:mustard": ["mustard"],
  "en:lupin": ["lupin"],
  "en:sulphur-dioxide-and-sulphites": ["sulphites"],
  "en:red-caviar": ["fish"],
  // OFF allergen ids for things this engine doesn't track: no hit. Any other unknown tag still blocks a clean answer.
  ...Object.fromEntries(
    ["none", "pork", "beef", "chicken", "apple", "banana", "peach", "orange", "kiwi", "gelatin", "yamaimo", "matsutake"].map((t) => [`en:${t}`, [] as AllergenId[]]),
  ),
};

// OFF labels that claim an allergen is absent. A claim can't be verified here, so an ingredient hit it covers
// is "check the label", never "contains" (the allergen list and traces still count in full).
export const FREE_FROM_LABELS: Record<string, AllergenId[]> = {
  "en:no-gluten": ["gluten"],
  "en:certified-gluten-free": ["gluten"],
  "en:no-milk": ["milk"],
  "en:no-eggs": ["egg"],
  "en:no-soy": ["soy"],
  "en:no-peanuts": ["peanut"],
  "en:no-nuts": ["tree_nut"],
  "en:vegan": ["milk", "egg", "fish", "crustacean", "mollusc"],
};

// OFF tags each label ingredient with its parent categories (a rice flour is also "flour"). These categories
// cover foods with and without the allergen, so on their own they say nothing; when the label itself says the word, it's read as usual.
export const GENERIC_CATEGORIES = new Set([
  "flour", "cereal flour", "wholemeal flour", "cereal", "nut", "vegetable oil", "vegetable oil and fat", "sauce", "flavouring", "natural flavouring", "shellfish",
]);

// Plain foods: single ingredients that don't hide one of the allergens above. In a
// recipe, a word that is neither a plain food, an allergen term, nor a filler word
// below is not recognised, and the answer for it is "can't confirm", never "none listed".
export const PLAIN_FOODS: string[] = (
  // vegetables and herbs
  "onion shallot leek garlic carrot potato sweet potato yam parsnip turnip swede beetroot beet radish cabbage kale spinach chard lettuce " +
  "rocket arugula watercress cucumber courgette zucchini aubergine eggplant pepper capsicum chilli chili jalapeno tomato tomatoe passata " +
  "mushroom broccoli cauliflower brussels sprout asparagus artichoke fennel okra pea peas bean beans lentil chickpea corn sweetcorn maize " +
  "pumpkin squash butternut marrow avocado olive caper gherkin spring scallion chive chives parsley coriander cilantro basil mint " +
  "rosemary thyme oregano marjoram sage dill tarragon bay leaf leaves lemongrass ginger galangal turmeric cumin paprika cinnamon " +
  "nutmeg clove cloves cardamom star anise allspice saffron vanilla peppercorn chillies pak choi bok choy beansprout sprouts edamame " +
  "garden greens herb herbs root " +
  // fruit
  "apple pear banana orange lemon lime grapefruit clementine mandarin tangerine grape strawberry raspberry blueberry blackberry " +
  "cranberry cherry plum peach nectarine apricot mango papaya pineapple melon watermelon kiwi passion fruit fig date pomegranate " +
  "coconut rhubarb lychee guava berries berry zest " +
  // meat, poultry
  "chicken beef pork lamb mutton veal turkey duck goose venison rabbit bacon ham pancetta prosciutto gammon mince minced steak " +
  "breast thigh thighs drumstick drumsticks wing wings fillet fillets chop chops loin shoulder leg ribs rib brisket belly liver kidney " +
  "oxtail bone bones joint carcass " +
  // grains, starches, pulses (gluten-free unless named above)
  "rice basmati jasmine arborio risotto quinoa polenta cornmeal millet buckwheat tapioca cornstarch arrowroot potato starch " +
  // fats, sugars, basics
  "oil vegetable sunflower rapeseed canola water ice salt sugar caster icing brown demerara muscovado honey syrup maple golden " +
  "molasses treacle agave yeast baking soda bicarbonate powder cocoa gelatine gelatin agar pectin stevia " +
  "cayenne scotch bonnet habanero chipotle ancho tamarind cannellini borlotti kidney pinto haricot mung broad shiitake enoki " +
  "portobello daikon sorrel savoy iceberg napa hispi sweetheart callaloo breadfruit plantain yuca cassava " +
  "bamboo shoot cob russet maris piper king edward jersey royal braeburn bramley granny smith blackcurrant redcurrant gooseberry " +
  "elderflower blossom pod pods palm caraway poppy fenugreek nigella sumac mace juniper kaffir makrut cardomom achiote annatto " +
  "sirloin tenderloin flank shin shank shanks rump topside silverside skirt chuck corned goat jamon iberico parma serrano lardon lardons " +
  "lard dripping shortening essence extract cacao coco arepa pico gallo colouring coloring cordial sirop " +
  "plant plants shallots challots rose peel jerusalem gem taro longan pandan padron yucca glutinous sticky navy toor dal grits truffle refried charlotte " +
  // drinks
  "coffee tea juice lemonade cola rum brandy whisky whiskey vodka gin tequila"
).split(" ").filter(Boolean);

// Quantities, units, preparation and filler words: ignored when deciding whether a line is recognised.
export const FILLER_WORDS: string[] = (
  "g kg mg ml l cl dl oz lb lbs tsp tbsp tbs tbls tblsp tablespoon tablespoons teaspoon teaspoons cup cups pint pints quart " +
  "pinch dash handful bunch sprig sprigs stick sticks slice slices piece pieces can cans tin tins jar jars pack packet bag " +
  "head heads clove bulb knob drop drops splash glass box block sheet sheets ball balls cube cubes rasher rashers stalk stalks " +
  "whole half halves quarter quarters large medium small big little thin thick extra virgin light dark heavy double single " +
  "fresh frozen dried ground crushed chopped finely roughly diced sliced minced grated shredded peeled deseeded seeded halved " +
  "quartered cubed julienned trimmed boneless skinless skin on off cooked uncooked raw boiled roasted toasted smoked plain " +
  "beaten melted softened cold hot warm room temperature to taste for serving serve garnish topping optional about approx " +
  "and or of the a an with without in into plus few some more less little each per x lean mixed assorted organic free range " +
  "baby young new ripe firm good quality fine coarse level heaped rounded generous squeeze juiced zested drained rinsed " +
  "soaked overnight sprinkle drizzle as needed if desired other any your favourite favorite style white red green yellow black " +
  "all purpose self raising frying dry thinly ounce ounces pound pounds tinned canned sprinkling sprinking spinkling kosher cut " +
  "granulated clear soft boiling dusting litre litres liter liters milliliters millilitres required brushing one two three four five six " +
  "parts part cooking instant top flaked flakes handfull freshly steamed fry skinned summer floury mashed wash back separated seperated " +
  "unwaxed bottle bottles grain pitted full sized size tips wild stir paper fried filled chilled cuts high heat concentrate inch inches " +
  "strong english greek chinese italian mexican swiss jamaican turkish french spanish thai indian japanese korean american " +
  "fast action powdered desiccated whipping clotted condensed evaporated tubs tub tiger birds eye fat pot savoury rolled smoky vine " +
  "food pulp crumbs wholemeal skimmed semi greasing grating baked hard mature mild very split thickness neutral dissolved thumb bashed " +
  "coarsely strained stewing waxy jumbo square cured flat sun pounded fermented brine " +
  "seed seeds spice spices sea grams gram mix meat natural de chips " +
  "puree paste pink purple strips strip chunks chunk florets floret wedges wedge rings ring sauce-free unsalted salted sweetened unsweetened"
).split(" ").filter(Boolean);
