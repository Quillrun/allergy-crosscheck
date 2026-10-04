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
};

/** Resolve spoken allergy names. Unknown names come back in `unknown`, never silently dropped. */
export function resolveAllergies(names: string[]): { ids: AllergenId[]; unknown: string[] } {
  const ids = new Set<AllergenId>();
  const unknown: string[] = [];
  for (const raw of names) {
    const key = normalize(raw);
    const direct = (ALLERGENS as Record<string, unknown>)[key.replace(/ /g, "_")] ? [key.replace(/ /g, "_") as AllergenId] : undefined;
    const hit = ALIASES[key] ?? direct;
    if (hit) hit.forEach((id) => ids.add(id));
    else if (key) unknown.push(raw.trim());
  }
  return { ids: [...ids], unknown };
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

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
const NOT_DAIRY_BUTTER = ["peanut butter", "cocoa butter", "shea butter", "apple butter", "nut butter", "almond butter", "cashew butter", "seed butter", "sunflower butter", "sunflower seed butter", "butter bean", "butter beans"];
const NOT_WHEAT_FLOUR = [
  "rice flour", "corn flour", "cornflour", "maize flour", "almond flour", "coconut flour", "chickpea flour", "gram flour",
  "buckwheat flour", "potato flour", "tapioca flour", "cassava flour", "oat flour", "gluten free flour", "soy flour",
  "soya flour", "lupin flour", "sorghum flour", "teff flour", "millet flour", "quinoa flour", "banana flour", "arrowroot flour",
];
const NOT_WHEAT_PASTA = ["rice pasta", "gluten free pasta", "chickpea pasta", "lentil pasta", "corn pasta", "rice lasagne", "gluten free lasagne"];
const BAKED: AllergenId[] = ["milk", "egg", "tree_nut", "peanut", "soy"];

export const TERMS: Term[] = [
  // peanut
  { terms: ["peanut", "groundnut", "arachis", "monkey nut", "satay"], contains: ["peanut"] },
  // tree nuts
  {
    terms: ["almond", "hazelnut", "filbert", "walnut", "cashew", "pecan", "pistachio", "brazil nut", "macadamia", "pine nut",
      "pignoli", "pinoli", "praline", "marzipan", "frangipane", "gianduja", "nutella", "chestnut"],
    contains: ["tree_nut"],
  },
  { terms: ["nut"], contains: ["tree_nut"], possible: ["peanut"], unless: ["pine nut", "brazil nut", "monkey nut"] },
  { terms: ["pesto"], contains: ["tree_nut", "milk"], possible: ["peanut"] },
  { terms: ["nougat"], contains: [], possible: ["tree_nut", "peanut", "egg", "milk"] },
  { terms: ["amaretti", "macaron", "orgeat", "romesco", "baklava", "dukkah"], contains: ["tree_nut"], possible: ["egg", "wheat", "gluten", "sesame"] },
  { terms: ["amaretto", "frangelico", "nocino", "biscotti", "mole", "nut oil"], contains: [], possible: ["tree_nut", "peanut"] },
  // milk
  { terms: ["milk", "buttermilk", "milk powder"], contains: ["milk"], unless: PLANT_MILKS },
  { terms: ["butter", "ghee"], contains: ["milk"], unless: NOT_DAIRY_BUTTER },
  { terms: ["cream", "sour cream", "creme fraiche", "half and half"], contains: ["milk"], unless: ["cream of tartar", "coconut cream", "ice cream"] },
  {
    terms: ["cheese", "parmesan", "parmigiano", "pecorino", "mozzarella", "cheddar", "ricotta", "feta", "mascarpone", "gouda", "brie",
      "camembert", "gruyere", "halloumi", "paneer", "burrata", "quark", "skyr"],
    contains: ["milk"],
  },
  { terms: ["yogurt", "yoghurt", "kefir", "whey", "casein", "caseinate", "lactose", "lactalbumin", "custard", "bechamel", "ice cream"], contains: ["milk"], unless: ["coconut yogurt", "coconut yoghurt"] },
  { terms: ["curd"], contains: ["milk"], unless: ["bean curd", "lemon curd"] },
  { terms: ["lemon curd"], contains: ["milk", "egg"] },
  // egg
  { terms: ["egg", "yolk", "albumen", "albumin", "ovalbumin", "lysozyme", "meringue", "hollandaise", "eggnog"], contains: ["egg"] },
  { terms: ["mayonnaise", "mayo", "aioli"], contains: ["egg"], possible: ["mustard"] },
  // wheat and gluten
  { terms: ["wheat", "semolina", "durum", "spelt", "kamut", "farro", "einkorn", "emmer", "couscous", "bulgur", "bulgar", "freekeh", "seitan", "graham"], contains: ["wheat", "gluten"] },
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
  { terms: ["barley", "rye", "oat", "oatmeal", "malt", "malt vinegar", "malt extract", "brewer s yeast", "beer", "ale", "lager", "triticale", "bran"], contains: ["gluten"] },
  { terms: ["gluten free"], contains: [], possible: ["milk", "egg", "soy", "tree_nut", "peanut", "sesame"] },
  // soy
  { terms: ["soy", "soya", "soybean", "soja", "tofu", "bean curd", "tempeh", "edamame", "miso", "shoyu", "tamari", "natto", "textured vegetable protein", "tvp"], contains: ["soy"] },
  { terms: ["lecithin", "vegetable protein"], contains: [], possible: ["soy"] },
  { terms: ["emulsifier"], contains: [], possible: ["soy", "egg"] },
  { terms: ["margarine", "vegetable spread"], contains: [], possible: ["milk", "soy"] },
  { terms: ["vegetable oil"], contains: [], possible: ["soy", "peanut"] },
  // sesame
  { terms: ["sesame", "tahini", "tahina", "halva", "halvah", "halwa", "gomasio", "benne", "hummus", "houmous", "za atar", "zaatar"], contains: ["sesame"] },
  // fish
  {
    terms: ["fish", "salmon", "tuna", "cod", "anchovy", "anchovies", "sardine", "haddock", "trout", "mackerel", "tilapia", "halibut",
      "pollock", "hake", "herring", "sea bass", "swordfish", "snapper", "plaice", "pangasius", "catfish", "carp", "perch", "eel",
      "caviar", "roe", "surimi", "fish sauce", "nam pla", "bonito"],
    contains: ["fish"],
  },
  { terms: ["worcestershire"], contains: ["fish"], possible: ["gluten"] },
  { terms: ["caesar dressing"], contains: ["fish"], possible: ["egg", "milk"] },
  { terms: ["dashi"], contains: [], possible: ["fish"] },
  // crustaceans and molluscs
  { terms: ["shrimp", "prawn", "crab", "lobster", "crayfish", "crawfish", "langoustine", "krill", "scampi"], contains: ["crustacean"] },
  { terms: ["shellfish"], contains: ["crustacean", "mollusc"] },
  { terms: ["clam", "mussel", "oyster", "scallop", "squid", "calamari", "octopus", "snail", "escargot", "cuttlefish", "abalone", "whelk", "cockle"], contains: ["mollusc"], unless: ["oyster mushroom", "king oyster mushroom"] },
  // celery, mustard, lupin, sulphites
  { terms: ["celery", "celeriac", "celery salt", "celery seed"], contains: ["celery"] },
  { terms: ["stock", "broth", "bouillon", "stock cube", "gravy"], contains: [], possible: ["celery", "wheat", "gluten"] },
  { terms: ["mustard", "dijon"], contains: ["mustard"] },
  { terms: ["lupin", "lupine", "lupini"], contains: ["lupin"] },
  {
    terms: ["sulphite", "sulfite", "sulphur dioxide", "sulfur dioxide", "metabisulphite", "metabisulfite", "bisulphite", "wine",
      "e220", "e221", "e222", "e223", "e224", "e225", "e226", "e227", "e228"],
    contains: ["sulphites"],
  },
  { terms: ["dried apricot", "dried fruit"], contains: [], possible: ["sulphites"] },
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
};
