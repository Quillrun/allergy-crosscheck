// The failure paths behind "offline means I can't confirm": a bad status, a hang, a dead network and the cache.

import { test } from "node:test";
import assert from "node:assert/strict";
import { Sources } from "../src/server/sources.ts";
import type { Fetcher } from "../src/server/sources.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
/** A fetcher that counts its calls and answers with `answer`. */
const counting = (answer: (url: string) => Response | Promise<Response>) => {
  const urls: string[] = [];
  const fetcher = (async (input: string | URL | Request) => { urls.push(String(input)); return answer(String(input)); }) as Fetcher;
  return { fetcher, urls };
};
/** Like a real fetch: never answers, rejects when the caller aborts. */
const hanging: Fetcher = ((_input: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
  init?.signal?.addEventListener("abort", () => reject(new DOMException("This operation was aborted", "AbortError")));
})) as Fetcher;

test("a 500 from the food database comes back as an error string, not a throw or an empty result", async () => {
  const { fetcher } = counting(() => json({ error: "boom" }, 500));
  const s = new Sources(fetcher, 1000);
  assert.deepEqual(await s.product("3017624010701"), { error: "the food database answered 500" });
  assert.deepEqual(await s.searchProducts("Nutella"), { error: "the food database answered 500" });
  assert.deepEqual(await s.recipe("lasagne"), { error: "the food database answered 500" });
});

test("a lookup that hangs past timeoutMs gives up with a timeout error", async () => {
  const s = new Sources(hanging, 50);
  const started = Date.now();
  const r = await s.product("3017624010701");
  assert.deepEqual(r, { error: "the food database timed out" });
  assert.ok(Date.now() - started < 2000, "returned long after the timeout");
  assert.deepEqual(await s.searchProducts("Nutella"), { error: "the food database timed out" });
  assert.deepEqual(await s.recipe("lasagne"), { error: "the food database timed out" });
});

test("a dead network names the cause and never throws", async () => {
  const s = new Sources((async () => { throw new TypeError("fetch failed"); }) as Fetcher, 1000);
  assert.deepEqual(await s.product("3017624010701"), { error: "the food database couldn't be reached (fetch failed)" });
});

test("an unparseable body is an error, not a product", async () => {
  const s = new Sources((async () => new Response("<html>tunnel error</html>", { status: 200 })) as Fetcher, 1000);
  const r = await s.product("3017624010701");
  assert.equal(r.product, undefined);
  assert.match(r.error ?? "", /couldn't be reached/);
});

test("the same lookup is fetched once; a different one is fetched again", async () => {
  const { fetcher, urls } = counting(() => json({ status: 1, product: { code: "x", product_name: "Nutella" } }));
  const s = new Sources(fetcher, 1000);
  assert.equal((await s.product("3017624010701")).product?.product_name, "Nutella");
  assert.equal((await s.product("3017624010701")).product?.product_name, "Nutella");
  assert.equal(urls.length, 1);
  await s.product("0050700000220");
  assert.equal(urls.length, 2);
});

test("errors are not cached: the next lookup tries again and can succeed", async () => {
  let n = 0;
  const { fetcher, urls } = counting(() => (++n === 1 ? json({}, 500) : json({ status: 1, product: { code: "x", product_name: "Nutella" } })));
  const s = new Sources(fetcher, 1000);
  assert.ok((await s.product("3017624010701")).error);
  assert.equal((await s.product("3017624010701")).product?.product_name, "Nutella");
  assert.equal(urls.length, 2);
});

test("a cached lookup is fetched again after ten minutes", async (t) => {
  const { fetcher, urls } = counting(() => json({ status: 1, product: { code: "x", product_name: "Nutella" } }));
  const s = new Sources(fetcher, 1000);
  t.mock.timers.enable({ apis: ["Date"], now: 1_000_000 });
  await s.product("3017624010701");
  t.mock.timers.setTime(1_000_000 + 9 * 60_000);
  await s.product("3017624010701");
  assert.equal(urls.length, 1);
  t.mock.timers.setTime(1_000_000 + 10 * 60_000 + 1);
  await s.product("3017624010701");
  assert.equal(urls.length, 2);
});

test("not found is an empty result, not an error: an unknown barcode, no search hits, no such dish", async () => {
  const { fetcher } = counting((url) => (url.includes("search.openfoodfacts") ? json({ hits: [] }) : url.includes("themealdb") ? json({ meals: null }) : json({ status: 0 })));
  const s = new Sources(fetcher, 1000);
  assert.deepEqual(await s.product("012345678905"), {});
  assert.deepEqual(await s.searchProducts("zzzz"), { candidates: [] });
  assert.deepEqual(await s.recipe("zzzz zzzz"), {});
});

test("a barcode that is not digits is refused before any request", async () => {
  const { fetcher, urls } = counting(() => json({ status: 0 }));
  const r = await new Sources(fetcher, 1000).product("../etc/passwd");
  assert.match(r.error ?? "", /doesn't look valid/);
  assert.equal(urls.length, 0);
});
