// External data: Open Food Facts (packaged products) and TheMealDB (recipes).
// Every failure is returned as an error string, never thrown past this module,
// so a dead network turns into "I can't confirm" instead of a crash or a guess.

import type { OffProduct } from "../../packages/allergen-guard/src/index.ts";

export type Fetcher = typeof fetch;
export type Candidate = { barcode: string; name: string; brand?: string };
export type Recipe = { name: string; ingredients: string[] };

const USER_AGENT = "AllergyCrosscheck/0.1 (+https://github.com/quillrun)";
const PRODUCT_FIELDS = "code,product_name,brands,allergens_tags,traces_tags,ingredients_tags,ingredients_text_en,ingredients_text";

export class Sources {
  private fetcher: Fetcher;
  private timeoutMs: number;
  private cache = new Map<string, { at: number; value: unknown }>();

  constructor(fetcher: Fetcher = fetch, timeoutMs = 6000) {
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  async product(barcode: string): Promise<{ product?: OffProduct; error?: string }> {
    if (!/^\d{6,14}$/.test(barcode)) return { error: "that barcode doesn't look valid" };
    const res = await this.json(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${PRODUCT_FIELDS}`);
    if (res.error) return { error: res.error };
    const body = res.value as { status?: number; product?: OffProduct };
    if (body.status !== 1 || !body.product) return {};
    return { product: body.product };
  }

  async searchProducts(query: string): Promise<{ candidates?: Candidate[]; error?: string }> {
    const q = encodeURIComponent(query.trim());
    const res = await this.json(`https://search.openfoodfacts.org/search?q=${q}&page_size=5&fields=code,product_name,brands`);
    if (res.error) return { error: res.error };
    const hits = ((res.value as { hits?: { code?: string; product_name?: string; brands?: string | string[] }[] }).hits ?? [])
      .filter((h) => h.code && h.product_name)
      .map((h) => ({ barcode: h.code as string, name: h.product_name as string, brand: Array.isArray(h.brands) ? h.brands[0] : h.brands }));
    return { candidates: hits };
  }

  /** A dish by name. If the full name isn't found, leading words are dropped ("shrimp pad thai" -> "pad thai"). */
  async recipe(name: string): Promise<{ recipe?: Recipe; error?: string }> {
    const words = name.trim().split(/\s+/);
    let meal: Record<string, string | null> | undefined;
    for (let i = 0; i < words.length && !meal; i++) {
      const query = words.slice(i).join(" ");
      if (i > 0 && query.length < 4) break;
      const res = await this.json(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
      if (res.error) return { error: res.error };
      meal = ((res.value as { meals?: Record<string, string | null>[] | null }).meals ?? [])[0];
    }
    if (!meal) return {};
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = (meal[`strIngredient${i}`] ?? "").trim();
      const measure = (meal[`strMeasure${i}`] ?? "").trim();
      if (ing) ingredients.push(measure ? `${measure} ${ing}` : ing);
    }
    return { recipe: { name: meal.strMeal ?? name, ingredients } };
  }

  private async json(url: string): Promise<{ value?: unknown; error?: string }> {
    const hit = this.cache.get(url);
    if (hit && Date.now() - hit.at < 10 * 60_000) return { value: hit.value };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this.fetcher(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, signal: ctrl.signal });
      if (!res.ok) return { error: `the food database answered ${res.status}` };
      const value = await res.json();
      this.cache.set(url, { at: Date.now(), value });
      return { value };
    } catch (err) {
      return { error: ctrl.signal.aborted ? "the food database timed out" : `the food database couldn't be reached (${(err as Error).message})` };
    } finally {
      clearTimeout(timer);
    }
  }
}
