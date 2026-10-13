import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createApp } from "../src/server/app.ts";
import type { AppOptions } from "../src/server/app.ts";
import type { Llm } from "../src/sim/agent.ts";
import { Sources } from "../src/server/sources.ts";
import type { Fetcher } from "../src/server/sources.ts";
import { Store } from "../src/server/store.ts";

const NUTELLA = {
  code: "3017624010701",
  product_name: "Nutella",
  brands: "Ferrero",
  allergens_tags: ["en:nuts"],
  traces_tags: ["en:milk", "en:nuts", "en:soybeans"],
  ingredients_text_en: "sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin",
};

/** Milk is named only in the ingredient text: allergens_tags and traces_tags are empty, as Open Food Facts often has them. */
const MILK_IN_TEXT = {
  code: "4001112223338",
  product_name: "Creamy Oat Bar",
  brands: "Acme",
  allergens_tags: [],
  traces_tags: [],
  ingredients_text_en: "oats, sugar, skimmed milk powder, salt",
};

/** Open Food Facts often returns product_name: "" for a record that has a barcode and nothing else. */
const NAMELESS = { code: "4001112224441", product_name: "", allergens_tags: [], traces_tags: [], ingredients_text_en: "water, salt" };

/** Offline stand-ins for Open Food Facts and TheMealDB. */
export const fakeFetch: Fetcher = (async (input: string | URL | Request) => {
  const url = String(input);
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  if (url.includes("/api/v2/product/3017624010701")) return json({ status: 1, product: NUTELLA });
  if (url.includes("/api/v2/product/4001112223338")) return json({ status: 1, product: MILK_IN_TEXT });
  if (url.includes("/api/v2/product/4001112224441")) return json({ status: 1, product: NAMELESS });
  if (url.includes("/api/v2/product/0098008952506")) return json({ status: 1, product: { code: "0098008952506", product_name: "Nutella" } });
  if (url.includes("/api/v2/product/")) return json({ status: 0 });
  if (url.includes("search.openfoodfacts.org") && url.includes("q=Nutella")) {
    return json({ hits: [{ code: "3017624010701", product_name: "Nutella", brands: ["Ferrero"] }, { code: "0098008952506", product_name: "Nutella", brands: ["Nutella"] }] });
  }
  if (url.includes("search.openfoodfacts.org") && url.includes("q=spread")) {
    return json({ hits: [{ code: "1", product_name: "Spread", brands: ["Acme"] }, { code: "2", product_name: "spread", brands: ["Acme"] }] });
  }
  // The live 'hot cocoa mix' search (2026-10-11): three of five have no brand and no size.
  if (url.includes("search.openfoodfacts.org") && url.includes("q=hot%20cocoa%20mix")) {
    return json({ hits: [
      { code: "0015700051443", product_name: "Swiss Miss Dark Chocolate", brands: ["Swiss Miss"], quantity: "(8 x 1.25 oz) 10 oz (283 g)" },
      { code: "0758108109865", product_name: "Hot cocoa mix" },
      { code: "0078742154657", product_name: "Hot Cocoa Mix", brands: ["Walmart"], quantity: "40 oz" },
      { code: "0070980171977", product_name: "Hot cocoa mix" },
      { code: "0011161153443", product_name: "Hot cocoa mix" },
    ] });
  }
  if (url.includes("search.openfoodfacts.org") && url.includes("q=Ferrero")) return json({ hits: [{ code: "3017624010701", product_name: "Nutella", brands: ["Ferrero"] }] });
  if (url.includes("search.openfoodfacts.org") && url.includes("q=offline")) throw new TypeError("fetch failed");
  if (url.includes("search.openfoodfacts.org")) return json({ hits: [] });
  if (url.includes("themealdb.com") && url.includes("s=lasagne")) {
    return json({ meals: [{ idMeal: "52844", strMeal: "Lasagne", strIngredient1: "Olive Oil", strMeasure1: "1 tblsp", strIngredient2: "Celery", strMeasure2: "1 Stick", strIngredient3: "Lasagne Sheets", strMeasure3: "500g", strIngredient4: "Creme Fraiche", strMeasure4: "400ml", strIngredient5: "Parmesan Cheese", strMeasure5: "50g", strIngredient6: "", strMeasure6: "" }] });
  }
  if (url.includes("themealdb.com") && url.endsWith("s=carbonara")) {
    return json({ meals: [{ idMeal: "2", strMeal: "Spaghetti alla Carbonara", strIngredient1: "Spaghetti", strMeasure1: "320g", strIngredient2: "Egg Yolks", strMeasure2: "6", strIngredient3: "Pecorino", strMeasure3: "50g" }] });
  }
  if (url.includes("themealdb.com")) return json({ meals: null });
  return json({}, 404);
}) as Fetcher;

export async function startApp(llm?: Llm, extra: Partial<AppOptions> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "allergy-crosscheck-"));
  const store = new Store(join(dir, "household.json"));
  const http = createApp({ store, sources: new Sources(fakeFetch, 2000), llm, ...extra });
  await new Promise<void>((r) => http.listen(0, "127.0.0.1", r));
  const port = (http.address() as AddressInfo).port;
  return {
    store,
    port,
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((r) => { http.closeAllConnections(); http.close(() => { rmSync(dir, { recursive: true, force: true }); r(); }); }),
  };
}

/** An MCP client over real Streamable HTTP, playing Alexa+. */
export async function connect(app: { url: string }): Promise<Client> {
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${app.url}/mcp`)));
  return client;
}

export type View = Record<string, any>;
export type ToolResult = { structuredContent: View; content: { text: string }[]; isError?: boolean };
export const callTool = async (client: Client, name: string, args: Record<string, unknown> = {}) => (await client.callTool({ name, arguments: args })) as ToolResult;
