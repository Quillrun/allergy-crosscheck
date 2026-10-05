// The MCP surface: nine tools and one MCP Apps view (the Echo Show screen).

import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ALLERGENS,
  checkIngredients,
  checkProduct,
  evaluate,
  normalize,
  resolveAllergies,
  scanIngredient,
  splitIngredients,
  suggestSwaps,
} from "../../packages/allergen-guard/src/index.ts";
import type { CheckResult, Person, Swap, Verdict } from "../../packages/allergen-guard/src/index.ts";
import type { Sources } from "./sources.ts";
import { localDate } from "./store.ts";
import type { Profile, Store } from "./store.ts";

export const WIDGET_URI = "ui://allergy-guard/verdict.html";
export const WIDGET_MIME = "text/html;profile=mcp-app";
const WIDGET_HTML = readFileSync(new URL("../../public/widget.html", import.meta.url), "utf8");
// MCP Apps link on each tool definition, plus Alexa+'s invoking/invoked status lines.
// Alexa+ also reads resourceUri from each tool result, so reply() repeats it there.
const ui = (invoking: string, invoked: string) => ({ ui: { resourceUri: WIDGET_URI, invoking, invoked }, "ui/resourceUri": WIDGET_URI });
const RESULT_META = { ui: { resourceUri: WIDGET_URI }, "ui/resourceUri": WIDGET_URI };

const READ_ME = " Read me the ingredients and I'll check them.";
const DISCLAIMER = "Allergy Guard reads ingredient data that can be wrong or out of date. Always check the label. It is not medical advice and not an emergency service.";
const VOICE_RULE =
  "Read the returned `speech` to the user as written. Never tell the user a food is safe, and never soften an 'unsafe' or 'cannot confirm' verdict.";

/** What the Echo Show screen renders. */
export type View = {
  kind: "recipe_check" | "product_check" | "needs_choice" | "people" | "shopping" | "recipe" | "message";
  title: string;
  speech: string;
  overall?: Verdict;
  people?: { name: string; verdict: Verdict; reasons: string[]; guest?: boolean; allergies?: string[]; until?: string }[];
  items?: { text: string; flags: { allergen: string; kind: string }[] }[];
  swaps?: Swap[];
  candidates?: { barcode: string; name: string; brand?: string }[];
  shopping?: { item: string; note?: string }[];
  dataIssues?: string[];
  source?: { label: string };
  disclaimer: string;
};

export function createServer(store: Store, sources: Sources): McpServer {
  const server = new McpServer(
    { name: "allergy-guard", title: "Allergy Guard", version: "0.1.0" },
    { instructions: `Allergy Guard keeps a household's food allergies and checks recipes and products against them. ${VOICE_RULE}` },
  );

  server.registerResource(
    "verdict-screen",
    WIDGET_URI,
    { title: "Allergy Guard screen", description: "Verdict card for Echo Show and other MCP Apps hosts", mimeType: WIDGET_MIME },
    async () => ({ contents: [{ uri: WIDGET_URI, mimeType: WIDGET_MIME, text: WIDGET_HTML }] }),
  );

  server.registerTool(
    "save_person",
    {
      title: "Save someone's allergies",
      description:
        "Save or update a household member or guest and their food allergies, e.g. 'Maya is allergic to peanuts' or 'the Johnsons' boy Leo is coming Saturday, he can't have sesame'. Guests can have an end date.",
      inputSchema: {
        name: z.string().min(1).max(60).describe("Person's name"),
        allergies: z.array(z.string()).min(1).describe("Allergies in plain words: peanuts, tree nuts, dairy, egg, wheat, gluten, soy, sesame, fish, shellfish, celery, mustard, lupin, sulphites"),
        guest: z.boolean().optional().describe("True for a visitor rather than a household member"),
        until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Last day a guest's allergies apply (YYYY-MM-DD)"),
        replace: z.boolean().optional().describe("True only when the user says an allergy no longer applies; the list then replaces what's saved. Otherwise new allergies are added"),
      },
      annotations: { idempotentHint: true },
      _meta: ui("Saving…", "Saved"),
    },
    async ({ name, allergies, guest, until, replace }) => {
      const { ids, unknown } = resolveAllergies(allergies);
      if (unknown.length) {
        return reply({
          kind: "message",
          title: "Allergy not recognised",
          speech: `I can't check for ${unknown.join(" or ")} yet, so I haven't ${store.find(name) ? `changed ${store.find(name)!.name}'s list` : `saved ${name}`}. I can track peanuts, tree nuts, milk, egg, wheat, gluten, soy, sesame, fish, shellfish, celery, mustard, lupin and sulphites.`,
          disclaimer: DISCLAIMER,
        }, true);
      }
      if (until && until < localDate()) {
        return reply({
          kind: "message",
          title: "That date has passed",
          speech: `${spokenDate(until)} has already passed, so I haven't saved ${name}. Tell me the last day they'll be eating with you.`,
          disclaimer: DISCLAIMER,
        }, true);
      }
      // An end date only makes sense for a visitor.
      const { saved: p, before } = store.savePerson({ name: name.trim(), allergies: ids, guest: Boolean(guest || until), until }, replace);
      const who = p.guest ? `guest ${p.name}${p.until ? ` until ${spokenDate(p.until)}` : ""}` : p.name;
      const added = before ? ids.filter((a) => !before.allergies.includes(a)) : [];
      const speech = !before
        ? `Got it. I'll check everything for ${who}: ${spokenList(p.allergies)}.`
        : replace
          ? `Updated ${who}. I'll now check for ${spokenList(p.allergies)} only.`
          : added.length
            ? `Added ${spokenList(added)} for ${who}. I'm checking for ${spokenList(p.allergies)}.`
            : `I already check ${spokenList(p.allergies)} for ${who}.`;
      return reply({
        kind: "people",
        title: "Saved",
        speech,
        people: peopleRows(store.allPeople()),
        disclaimer: DISCLAIMER,
      });
    },
  );

  server.registerTool(
    "remove_person",
    {
      title: "Remove someone",
      description: "Stop checking for a household member or guest.",
      inputSchema: { name: z.string().min(1) },
      annotations: { destructiveHint: true, idempotentHint: true },
      _meta: ui("Removing…", "Removed"),
    },
    async ({ name }) => {
      const removed = store.removePerson(name);
      return reply({
        kind: "people",
        title: "Household",
        speech: removed ? `Removed ${name}.` : `I don't have anyone called ${name}.`,
        people: peopleRows(store.allPeople()),
        disclaimer: DISCLAIMER,
      }, !removed);
    },
  );

  server.registerTool(
    "list_people",
    {
      title: "Who's being checked",
      description: "List household members and guests with their allergies.",
      annotations: { readOnlyHint: true },
      _meta: ui("Checking who is saved…", "Household"),
    },
    async () => {
      const all = store.allPeople();
      return reply({
        kind: "people",
        title: "Household",
        speech: all.length
          ? all.map((p) => `${p.name}${p.guest ? " (guest)" : ""}: ${spokenList(p.allergies)}`).join(". ") + "."
          : "Nobody's saved yet. Tell me who eats here and what they're allergic to.",
        people: peopleRows(all),
        disclaimer: DISCLAIMER,
      });
    },
  );

  server.registerTool(
    "find_recipe",
    {
      title: "Find a recipe",
      description: "Look up a recipe's ingredient list by dish name (for example 'lasagne'), so it can be checked with check_recipe.",
      inputSchema: { dish: z.string().min(1) },
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: ui("Finding the recipe…", "Recipe found"),
    },
    async ({ dish }) => {
      const { recipe, error } = await sources.recipe(dish);
      if (!recipe) {
        return reply({
          kind: "message",
          title: "Recipe not found",
          speech: error ? `I couldn't look that up: ${error}. Read me the ingredients instead.` : `I couldn't find a recipe for ${dish}. Read me the ingredients instead.`,
          disclaimer: DISCLAIMER,
        }, true);
      }
      return reply({
        kind: "recipe",
        title: recipe.name,
        speech: `I found ${recipe.name} with ${recipe.ingredients.length} ingredients. Want me to check it?`,
        items: recipe.ingredients.map((text) => ({ text, flags: [] })),
        source: { label: "TheMealDB" },
        disclaimer: DISCLAIMER,
      });
    },
  );

  server.registerTool(
    "check_recipe",
    {
      title: "Check a recipe",
      description: `Check food against everyone's allergies (or only the people named in 'for'): a dish ('lasagne'), a single food or ingredient ('hummus', 'a banana', 'oyster sauce'), or a list of ingredients. Returns a verdict per person, the risky ingredients, and swaps that don't trip anyone else's allergy. ${VOICE_RULE}`,
      inputSchema: {
        ingredients: z.union([z.array(z.string()), z.string()]).optional().describe("Ingredient lines, or the ingredient list as text. If the user lists ingredients, always pass them here, even when they also name the dish"),
        dish: z.string().optional().describe("Only when the user gives no ingredients: a dish name to look up, e.g. 'lasagne'"),
        recipe_name: z.string().optional().describe("A name to show for the recipe, e.g. 'Grandma's pesto'"),
        for: z.array(z.string()).optional().describe("Only check for these people; default is everyone currently saved"),
      },
      annotations: { readOnlyHint: true },
      _meta: ui("Checking the recipe…", "Recipe checked"),
    },
    async ({ ingredients, dish, recipe_name, for: names }) => {
      const { people, missing } = pick(store, names);
      let source: View["source"];
      let note = "";
      let nameLine: string | undefined;
      const unknown: string[] = [];
      if (!ingredients && dish) {
        // The dish name is checked too: "shrimp pad thai" names its shellfish even if the recipe found doesn't.
        nameLine = `${dish} (the dish name)`;
        const { recipe, error } = await sources.recipe(dish);
        if (recipe) {
          ingredients = recipe.ingredients;
          recipe_name = recipe_name ?? recipe.name;
          source = { label: "TheMealDB" };
          if (normalize(recipe.name) !== normalize(dish)) note = ` I didn't find ${dish} exactly, so I checked ${recipe.name}.`;
        } else {
          ingredients = [];
          recipe_name = recipe_name ?? dish;
          unknown.push(error ? `I couldn't look up ${dish} (${error}), so its ingredients are unknown.` : `I couldn't find a recipe for ${dish}, so its ingredients are unknown.`);
          note = READ_ME;
        }
      }
      let result = checkIngredients(splitIngredients(ingredients ?? []), people);
      if (nameLine && dish) {
        // The name only adds what it names outright; its other words ("tonight's") aren't ingredients.
        const lines = [...result.lines, { text: nameLine, hits: scanIngredient(dish) }];
        result = { ...evaluate(lines.flatMap((l) => l.hits), people, unknown.length ? unknown : result.dataIssues), lines };
      }
      if (note === READ_ME && result.people.every((p) => p.verdict === "unsafe")) note = ""; // nothing more to learn
      const swaps = suggestSwaps(result.lines.filter((l) => l.text !== nameLine), people);
      return reply({
        kind: "recipe_check",
        title: recipe_name ? `${recipe_name}` : "Recipe check",
        overall: result.overall,
        speech: withMissing(result, missing) + note + (swaps.length ? " I've put swaps on the screen." : ""),
        people: verdictRows(result, store),
        items: result.lines
          .map((l) => ({
            text: l.text,
            flags: l.hits
              .filter((h) => people.some((p) => p.allergies.includes(h.allergen)))
              .map((h) => (h.unknown ? { allergen: "Not recognised", kind: "unknown" } : { allergen: ALLERGENS[h.allergen].label, kind: h.kind })),
          }))
          .filter((i) => i.text !== nameLine || i.flags.length), // the name only shows when it flags something
        swaps,
        dataIssues: result.dataIssues,
        source,
        disclaimer: DISCLAIMER,
      });
    },
  );

  server.registerTool(
    "check_product",
    {
      title: "Check a product",
      description: `Check one specific packaged product against everyone's allergies: the one the user just scanned on their phone (set scanned), by barcode, or by its product or brand name ('Nutella', 'Heinz ketchup'). For a plain food or ingredient with no brand ('hummus', 'a banana'), use check_recipe with ingredients instead. If a name matches several products, this returns the choices instead of guessing; ask the user which one, then call again with its barcode. ${VOICE_RULE}`,
      inputSchema: {
        barcode: z.string().optional().describe("The barcode (EAN/UPC digits), e.g. from a choice returned earlier"),
        name: z.string().optional().describe("Product name, e.g. 'Nutella' or 'Kellogg's granola'"),
        scanned: z.boolean().optional().describe("true when the user means the product they just scanned with the Allergy Guard scan page ('what I just scanned', 'this one I scanned')"),
        for: z.array(z.string()).optional().describe("Only check for these people; default is everyone currently saved"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: ui("Checking the product…", "Product checked"),
    },
    async ({ barcode, name, scanned, for: names }) => {
      const { people, missing } = pick(store, names);
      let code = barcode?.trim();
      if (scanned && !code) {
        const scan = store.recentScan();
        if (!scan) {
          return reply({ kind: "message", title: "Nothing scanned", speech: "I don't have a recent scan. Scan the barcode on your phone, or tell me the product's name.", disclaimer: DISCLAIMER }, true);
        }
        code = scan.barcode;
      }
      if (!code) {
        if (!name?.trim()) {
          return reply({ kind: "message", title: "Which product?", speech: "Scan its barcode on your phone, or tell me the product's name.", disclaimer: DISCLAIMER }, true);
        }
        const found = await sources.searchProducts(name);
        if (found.error || !found.candidates) {
          return productReply(name, checkProduct(null, people, found.error), people, store, missing);
        }
        if (found.candidates.length === 0) return productReply(name, checkProduct(null, people), people, store, missing);
        if (found.candidates.length > 1) {
          return reply({
            kind: "needs_choice",
            title: `Which ${name}?`,
            speech: `I found ${found.candidates.length} products called ${name}, and they're not the same. ${whichOne(found.candidates)}`,
            candidates: found.candidates.slice(0, 5),
            disclaimer: DISCLAIMER,
          });
        }
        code = found.candidates[0].barcode;
      }
      const { product, error } = await sources.product(code);
      return productReply(product?.product_name ?? name ?? code, checkProduct(product ?? null, people, error), people, store, missing, product ? { label: "Open Food Facts" } : undefined);
    },
  );

  server.registerTool(
    "add_to_shopping_list",
    {
      title: "Add to shopping list",
      description: "Add items (for example the swaps from a recipe check) to the household shopping list.",
      inputSchema: { items: z.array(z.string()).min(1), note: z.string().optional() },
      _meta: ui("Adding to the list…", "List updated"),
    },
    async ({ items, note }) => {
      const list = store.addItems(items, note);
      return reply({ kind: "shopping", title: "Shopping list", speech: `Added ${joinWords(items)}. You have ${list.length} item${list.length === 1 ? "" : "s"} on the list.`, shopping: list, disclaimer: DISCLAIMER });
    },
  );

  server.registerTool(
    "get_shopping_list",
    { title: "Shopping list", description: "Read the household shopping list.", annotations: { readOnlyHint: true }, _meta: ui("Reading the list…", "Shopping list") },
    async () => {
      const list = store.shopping();
      const names = list.map((i) => i.item);
      const spoken = names.length > 6 ? [...names.slice(0, 5), `${names.length - 5} more`] : names;
      return reply({ kind: "shopping", title: "Shopping list", speech: list.length ? `On the list: ${joinWords(spoken)}.` : "The shopping list is empty.", shopping: list, disclaimer: DISCLAIMER });
    },
  );

  server.registerTool(
    "remove_from_shopping_list",
    {
      title: "Remove from shopping list",
      description: "Remove one item from the shopping list.",
      inputSchema: { item: z.string().min(1) },
      annotations: { destructiveHint: true, idempotentHint: true },
      _meta: ui("Removing from the list…", "List updated"),
    },
    async ({ item }) => {
      const removed = store.removeItem(item);
      return reply({ kind: "shopping", title: "Shopping list", speech: removed ? `Removed ${item}.` : `${item} wasn't on the list.`, shopping: store.shopping(), disclaimer: DISCLAIMER }, !removed);
    },
  );

  return server;
}

function productReply(label: string, result: CheckResult, people: Person[], store: Store, missing: string[], source?: View["source"]) {
  return reply({
    kind: "product_check",
    title: label,
    overall: result.overall,
    speech: withMissing(result, missing),
    people: verdictRows(result, store),
    items: groupHits(result, people),
    dataIssues: result.dataIssues,
    source,
    disclaimer: DISCLAIMER,
  });
}

function groupHits(result: CheckResult, people: Person[]): View["items"] {
  const relevant = result.hits.filter((h) => people.some((p) => p.allergies.includes(h.allergen)));
  const bySource = new Map<string, { allergen: string; kind: string }[]>();
  for (const h of relevant) bySource.set(h.source, [...(bySource.get(h.source) ?? []), { allergen: ALLERGENS[h.allergen].label, kind: h.kind }]);
  return [...bySource].map(([text, flags]) => ({ text, flags }));
}

/** Resolve "for" names to saved people. Unknown names are reported, never silently skipped. */
function pick(store: Store, names?: string[]): { people: Person[]; missing: string[] } {
  if (!names?.length) return { people: store.activePeople(), missing: [] };
  const people: Person[] = [];
  const missing: string[] = [];
  for (const n of names) {
    const p = store.find(n);
    if (p) people.push(p);
    else missing.push(n);
  }
  return { people, missing };
}

function withMissing(result: CheckResult, missing: string[]): string {
  if (!missing.length) return result.speech;
  const note = `I don't have allergies saved for ${joinWords(missing)}, so I couldn't check for them.`;
  return result.people.length ? `${note} ${result.speech}` : note;
}

function verdictRows(result: CheckResult, store: Store): View["people"] {
  return result.people.map((r) => {
    const p = store.find(r.name);
    return { name: r.name, verdict: r.verdict, reasons: r.reasons, guest: p?.guest, allergies: p?.allergies.map((a) => ALLERGENS[a].label) };
  });
}

// Read the choices out only when they sound different; five products all called "Nutella" can't be told apart by ear.
function whichOne(candidates: { name: string; brand?: string }[]): string {
  const labels = candidates.slice(0, 3).map((c) => (c.brand && c.brand.toLowerCase() !== c.name.toLowerCase() ? `${c.name} by ${c.brand}` : c.name));
  const distinct = new Set(labels.map((l) => l.toLowerCase())).size === labels.length;
  return distinct ? `Which one: ${joinWords(labels, "or")}? Or read me the barcode.` : "Pick one on the screen, or read me the barcode.";
}

function peopleRows(all: Profile[]): View["people"] {
  return all.map((p) => ({ name: p.name, verdict: "no_listed_allergens" as Verdict, reasons: [], guest: p.guest, until: p.until, allergies: p.allergies.map((a) => ALLERGENS[a].label) }));
}

function reply(view: View, isError = false) {
  const lines = [view.overall ? `VERDICT: ${view.overall.toUpperCase().replace(/_/g, " ")}` : "", `Say to the user: ${view.speech}`];
  if (view.candidates?.length) lines.push(`Choices: ${view.candidates.map((c) => `${c.name}${c.brand ? ` (${c.brand})` : ""} [barcode ${c.barcode}]`).join("; ")}`);
  if (view.kind === "recipe" && view.items?.length) lines.push(`Ingredients: ${view.items.map((i) => i.text).join("; ")}`);
  if (view.swaps?.length) lines.push(`Swaps: ${view.swaps.map((s) => `${s.replace} -> ${s.options.join(" / ")}`).join("; ")}`);
  return { content: [{ type: "text" as const, text: lines.filter(Boolean).join("\n") }], structuredContent: view as unknown as Record<string, unknown>, isError, _meta: RESULT_META };
}

// "2026-10-10" -> "Saturday 10 October": dates are heard, not read.
const spokenDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const soon = date.getTime() - Date.now() < 300 * 86_400_000; // within the coming months, the weekday says enough
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", ...(soon ? {} : { year: "numeric" }) });
};

const spokenList = (ids: Profile["allergies"]) => joinWords(ids.map((a) => ALLERGENS[a].spoken));
const joinWords = (xs: string[], last = "and") => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} ${last} ${xs[xs.length - 1]}`);
