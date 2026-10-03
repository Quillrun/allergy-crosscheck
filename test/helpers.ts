import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server/app.ts";
import type { Llm } from "../src/sim/agent.ts";
import { Sources } from "../src/server/sources.ts";
import type { Fetcher } from "../src/server/sources.ts";
import { Store } from "../src/server/store.ts";

export const NUTELLA = {
  code: "3017624010701",
  product_name: "Nutella",
  brands: "Ferrero",
  allergens_tags: ["en:nuts"],
  traces_tags: ["en:milk", "en:nuts", "en:soybeans"],
  ingredients_text_en: "sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin",
};

/** Offline stand-ins for Open Food Facts and TheMealDB. */
export const fakeFetch: Fetcher = (async (input: string | URL | Request) => {
  const url = String(input);
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  if (url.includes("/api/v2/product/3017624010701")) return json({ status: 1, product: NUTELLA });
  if (url.includes("/api/v2/product/0098008952506")) return json({ status: 1, product: { code: "0098008952506", product_name: "Nutella" } });
  if (url.includes("/api/v2/product/")) return json({ status: 0 });
  if (url.includes("search.openfoodfacts.org") && url.includes("q=Nutella")) {
    return json({ hits: [{ code: "3017624010701", product_name: "Nutella", brands: ["Ferrero"] }, { code: "0098008952506", product_name: "Nutella", brands: ["Nutella"] }] });
  }
  if (url.includes("search.openfoodfacts.org") && url.includes("q=offline")) throw new TypeError("fetch failed");
  if (url.includes("search.openfoodfacts.org")) return json({ hits: [] });
  if (url.includes("themealdb.com") && url.includes("s=lasagne")) {
    return json({ meals: [{ idMeal: "52844", strMeal: "Lasagne", strIngredient1: "Olive Oil", strMeasure1: "1 tblsp", strIngredient2: "Celery", strMeasure2: "1 Stick", strIngredient3: "Lasagne Sheets", strMeasure3: "500g", strIngredient4: "Creme Fraiche", strMeasure4: "400ml", strIngredient5: "Parmesan Cheese", strMeasure5: "50g", strIngredient6: "", strMeasure6: "" }] });
  }
  if (url.includes("themealdb.com")) return json({ meals: null });
  return json({}, 404);
}) as Fetcher;

export async function startApp(llm?: Llm) {
  const dir = mkdtempSync(join(tmpdir(), "allergy-guard-"));
  const store = new Store(join(dir, "household.json"));
  const http = createApp({ store, sources: new Sources(fakeFetch, 2000), llm });
  await new Promise<void>((r) => http.listen(0, "127.0.0.1", r));
  const port = (http.address() as AddressInfo).port;
  return {
    store,
    dir,
    port,
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((r) => { http.closeAllConnections(); http.close(() => r()); }),
  };
}
