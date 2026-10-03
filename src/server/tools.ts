// The MCP surface: nine tools and one MCP Apps view (the Echo Show screen).

import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ALLERGENS,
  checkIngredients,
  checkProduct,
  resolveAllergies,
  suggestSwaps,
} from "../../packages/allergen-guard/src/index.ts";
import type { CheckResult, Person, Swap, Verdict } from "../../packages/allergen-guard/src/index.ts";
import type { Sources } from "./sources.ts";
import type { Profile, Store } from "./store.ts";

export const WIDGET_URI = "ui://allergy-guard/verdict.html";
export const WIDGET_MIME = "text/html;profile=mcp-app";
const WIDGET_HTML = readFileSync(new URL("../../public/widget.html", import.meta.url), "utf8");
const UI = { ui: { resourceUri: WIDGET_URI }, "ui/resourceUri": WIDGET_URI };

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
  source?: { label: string; url?: string };
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
        name: z.string().min(1).describe("Person's name"),
        allergies: z.array(z.string()).min(1).describe("Allergies in plain words: peanuts, tree nuts, dairy, egg, wheat, gluten, soy, sesame, fish, shellfish, celery, mustard, lupin, sulphites"),
        guest: z.boolean().optional().describe("True for a visitor rather than a household member"),
        until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Last day a guest's allergies apply (YYYY-MM-DD)"),
      },
      annotations: { idempotentHint: true },
      _meta: UI,
    },
    async ({ name, allergies, guest, until }) => {
      const { ids, unknown } = resolveAllergies(allergies);
      if (unknown.length) {
        return reply({
          kind: "message",
          title: "Allergy not recognised",
          speech: `I can't check for ${unknown.join(" or ")} yet, so I haven't saved ${name}. I can track peanuts, tree nuts, milk, egg, wheat, gluten, soy, sesame, fish, shellfish, celery, mustard, lupin and sulphites.`,
          disclaimer: DISCLAIMER,
        }, true);
      }
      const p = store.savePerson({ name: name.trim(), allergies: ids, guest: guest ?? false, until });
      const who = p.guest ? `guest ${p.name}${p.until ? ` until ${p.until}` : ""}` : p.name;
      return reply({
        kind: "people",
        title: "Saved",
        speech: `Got it. I'll check everything for ${who}: ${spokenList(p.allergies)}.`,
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
      _meta: UI,
    },
    async ({ name }) => {
      const removed = store.removePerson(name);
      return reply({
        kind: "people",
        title: "Household",
        speech: removed ? `Removed ${name}.` : `I don't have anyone called ${name}.`,
        people: peopleRows(store.allPeople()),
        disclaimer: DISCLAIMER,
      });
    },
  );

  server.registerTool(
    "list_people",
    {
      title: "Who's being checked",
      description: "List household members and guests with their allergies.",
      annotations: { readOnlyHint: true },
      _meta: UI,
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
      _meta: UI,
    },
    async ({ dish }) => {
      const { recipe, error } = await sources.recipe(dish);
      if (!recipe) {
        return reply({
          kind: "message",
          title: "Recipe not found",
          speech: error ? `I couldn't look that up: ${error}. Read me the ingredients instead.` : `I couldn't find a recipe for ${dish}. Read me the ingredients instead.`,
          disclaimer: DISCLAIMER,
        });
      }
      return reply({
        kind: "recipe",
        title: recipe.name,
        speech: `I found ${recipe.name} with ${recipe.ingredients.length} ingredients. Want me to check it?`,
        items: recipe.ingredients.map((text) => ({ text, flags: [] })),
        source: { label: "TheMealDB", url: recipe.source },
        disclaimer: DISCLAIMER,
      });
    },
  );

  server.registerTool(
    "check_recipe",
    {
      title: "Check a recipe",
      description: `Check a recipe's ingredients against everyone's allergies (or only the people named in 'for'). Returns a verdict per person, the risky ingredients, and swaps that don't trip anyone else's allergy. ${VOICE_RULE}`,
      inputSchema: {
        ingredients: z.union([z.array(z.string()), z.string()]).optional().describe("Ingredient lines, or the ingredient list as text"),
        dish: z.string().optional().describe("Instead of ingredients: a dish name to look up, e.g. 'lasagne'"),
        recipe_name: z.string().optional(),
        for: z.array(z.string()).optional().describe("Only check for these people; default is everyone currently saved"),
      },
      annotations: { readOnlyHint: true },
      _meta: UI,
    },
    async ({ ingredients, dish, recipe_name, for: names }) => {
      const { people, missing } = pick(store, names);
      let source: View["source"];
      if (!ingredients && dish) {
        const { recipe, error } = await sources.recipe(dish);
        if (!recipe) {
          return reply({
            kind: "message",
            title: "Recipe not found",
            speech: error ? `I couldn't look up ${dish}: ${error}. Read me the ingredients instead.` : `I couldn't find a recipe for ${dish}. Read me the ingredients instead.`,
            disclaimer: DISCLAIMER,
          });
        }
        ingredients = recipe.ingredients;
        recipe_name = recipe_name ?? recipe.name;
        source = { label: "TheMealDB", url: recipe.source };
      }
      const result = checkIngredients(ingredients ?? [], people);
      const swaps = suggestSwaps(result.lines, people);
      return reply({
        kind: "recipe_check",
        title: recipe_name ? `${recipe_name}` : "Recipe check",
        overall: result.overall,
        speech: withMissing(result, missing) + (swaps.length ? " I've put swaps on the screen." : ""),
        people: verdictRows(result, store),
        items: result.lines.map((l) => ({
          text: l.text,
          flags: l.hits.filter((h) => people.some((p) => p.allergies.includes(h.allergen))).map((h) => ({ allergen: ALLERGENS[h.allergen].label, kind: h.kind })),
        })),
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
      description: `Check a packaged food against everyone's allergies, by barcode or by name. If a name matches several products, this returns the choices instead of guessing; ask the user which one, then call again with its barcode. ${VOICE_RULE}`,
      inputSchema: {
        barcode: z.string().optional(),
        name: z.string().optional().describe("Product name, e.g. 'Nutella' or 'Kellogg's granola'"),
        for: z.array(z.string()).optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: UI,
    },
    async ({ barcode, name, for: names }) => {
      const { people, missing } = pick(store, names);
      let code = barcode?.trim();
      if (!code) {
        if (!name?.trim()) {
          return reply({ kind: "message", title: "Which product?", speech: "Tell me the product's name, or read me the barcode.", disclaimer: DISCLAIMER });
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
            speech: `I found ${found.candidates.length} products called ${name}, and they're not the same. Which one: ${found.candidates
              .slice(0, 3)
              .map((c, i) => `${i + 1}, ${c.name}${c.brand ? ` by ${c.brand}` : ""}`)
              .join("; ")}?`,
            candidates: found.candidates,
            disclaimer: DISCLAIMER,
          });
        }
        code = found.candidates[0].barcode;
      }
      const { product, error } = await sources.product(code);
      return productReply(product?.product_name ?? name ?? code, checkProduct(product ?? null, people, error), people, store, missing, product ? { label: "Open Food Facts", url: `https://world.openfoodfacts.org/product/${code}` } : undefined);
    },
  );

  server.registerTool(
    "add_to_shopping_list",
    {
      title: "Add to shopping list",
      description: "Add items (for example the swaps from a recipe check) to the household shopping list.",
      inputSchema: { items: z.array(z.string()).min(1), note: z.string().optional() },
      _meta: UI,
    },
    async ({ items, note }) => {
      const list = store.addItems(items, note);
      return reply({ kind: "shopping", title: "Shopping list", speech: `Added ${joinWords(items)}. You have ${list.length} item${list.length === 1 ? "" : "s"} on the list.`, shopping: list, disclaimer: DISCLAIMER });
    },
  );

  server.registerTool(
    "get_shopping_list",
    { title: "Shopping list", description: "Read the household shopping list.", annotations: { readOnlyHint: true }, _meta: UI },
    async () => {
      const list = store.shopping();
      return reply({ kind: "shopping", title: "Shopping list", speech: list.length ? `On the list: ${joinWords(list.map((i) => i.item))}.` : "The shopping list is empty.", shopping: list, disclaimer: DISCLAIMER });
    },
  );

  server.registerTool(
    "remove_from_shopping_list",
    {
      title: "Remove from shopping list",
      description: "Remove one item from the shopping list.",
      inputSchema: { item: z.string().min(1) },
      annotations: { destructiveHint: true, idempotentHint: true },
      _meta: UI,
    },
    async ({ item }) => {
      const removed = store.removeItem(item);
      return reply({ kind: "shopping", title: "Shopping list", speech: removed ? `Removed ${item}.` : `${item} wasn't on the list.`, shopping: store.shopping(), disclaimer: DISCLAIMER });
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

function peopleRows(all: Profile[]): View["people"] {
  return all.map((p) => ({ name: p.name, verdict: "no_listed_allergens" as Verdict, reasons: [], guest: p.guest, until: p.until, allergies: p.allergies.map((a) => ALLERGENS[a].label) }));
}

function reply(view: View, isError = false) {
  const lines = [view.overall ? `VERDICT: ${view.overall.toUpperCase().replace(/_/g, " ")}` : "", `Say to the user: ${view.speech}`];
  if (view.candidates?.length) lines.push(`Choices: ${view.candidates.map((c) => `${c.name}${c.brand ? ` (${c.brand})` : ""} [barcode ${c.barcode}]`).join("; ")}`);
  if (view.kind === "recipe" && view.items?.length) lines.push(`Ingredients: ${view.items.map((i) => i.text).join("; ")}`);
  if (view.swaps?.length) lines.push(`Swaps: ${view.swaps.map((s) => `${s.replace} -> ${s.options.join(" / ")}`).join("; ")}`);
  return { content: [{ type: "text" as const, text: lines.filter(Boolean).join("\n") }], structuredContent: view as unknown as Record<string, unknown>, isError };
}

const spokenList = (ids: Profile["allergies"]) => joinWords(ids.map((a) => ALLERGENS[a].spoken));
const joinWords = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
