// Small tool behaviours: duplicate names, impossible dates, blank shopping items, which product was checked, tool annotations.

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { fakeFetch, startApp } from "./helpers.ts";
import { Sources } from "../src/server/sources.ts";

let app: Awaited<ReturnType<typeof startApp>>;
let client: Client;
type View = Record<string, any>;
const call = async (name: string, args: Record<string, unknown> = {}) => (await client.callTool({ name, arguments: args })) as { structuredContent: View; content: { text: string }[]; isError?: boolean };

before(async () => {
  app = await startApp();
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${app.url}/mcp`)));
  await call("save_person", { name: "Maya", allergies: ["tree nuts"] });
});
after(async () => {
  await client.close();
  await app.close();
});

test("for: ['maya', 'MAYA'] checks Maya once", async () => {
  const r = await call("check_recipe", { ingredients: ["hazelnuts"], for: ["maya", "MAYA", " Maya "] });
  assert.deepEqual(r.structuredContent.people.map((p: View) => p.name), ["Maya"]);
  assert.equal((r.structuredContent.speech.match(/Maya/g) ?? []).length, 1);
  const unknown = await call("check_recipe", { ingredients: ["hazelnuts"], for: ["Gran", "gran", "Maya"] });
  assert.match(unknown.structuredContent.speech, /allergies saved for Gran, so/);
});

test("an end date that is not a calendar day is refused, not spoken as a date", async () => {
  for (const until of ["2099-13-45", "2099-02-30", "2099-00-10"]) {
    const r = await call("save_person", { name: "Vic", allergies: ["milk"], until });
    assert.equal(r.isError, true, until);
    assert.match(r.structuredContent.speech, /couldn't make a date out of/, until);
  }
  assert.equal(app.store.find("Vic"), undefined);
  assert.equal((await call("save_person", { name: "Vic", allergies: ["milk"], until: "2099-02-28" })).isError, false);
});

test("the shopping list trims, drops blanks, dedupes case-insensitively and counts what is on the list", async () => {
  const r = await call("add_to_shopping_list", { items: ["a", "  ", "A"] });
  assert.equal(r.structuredContent.speech, "Added a. You have 1 item on the list.");
  assert.deepEqual(r.structuredContent.shopping.map((i: View) => i.item), ["a"]);
  const more = await call("add_to_shopping_list", { items: [" A ", "oat milk", "Oat Milk"] });
  assert.equal(more.structuredContent.speech, "Added oat milk. A was already on the list. You have 2 items on the list.");
  const blank = await call("add_to_shopping_list", { items: ["", "   "] });
  assert.equal(blank.isError, true);
  assert.match(blank.structuredContent.speech, /didn't catch any items/);
  assert.equal(app.store.shopping().length, 2);
});

test("a single product found by name is named in the speech", async () => {
  const r = await call("check_product", { name: "Ferrero" });
  assert.equal(r.structuredContent.kind, "product_check");
  assert.match(r.structuredContent.speech, /^Checked Nutella: /);
  assert.match(r.content[0].text, /Say to the user: Checked Nutella: /);
});

test("a barcode given by voice is named in the speech, so a wrong item can be heard; a scan keeps its wording", async () => {
  const byCode = await call("check_product", { barcode: "3017624010701" });
  assert.match(byCode.structuredContent.speech, /^Checked Nutella: /);
  assert.match(byCode.content[0].text, /Say to the user: Checked Nutella: /);
  // The spoken code is a different real product: the name is what lets the person hear that.
  const other = await call("check_product", { barcode: "0098008952506" });
  assert.match(other.structuredContent.speech, /^Checked Nutella: /);
  // A barcode with no record has no name to say.
  const unknown = await call("check_product", { barcode: "012345678905" });
  assert.doesNotMatch(unknown.structuredContent.speech, /^Checked /);
});

test("a misheard barcode is refused with a spoken message and is never looked up", async () => {
  const looked: string[] = [];
  const spy = await startApp(undefined, { sources: new Sources(((u: string | URL | Request) => { looked.push(String(u)); return fakeFetch(u); }) as never, 2000) });
  const c = new Client({ name: "spy-client", version: "1.0.0" });
  await c.connect(new StreamableHTTPClientTransport(new URL(`${spy.url}/mcp`)));
  try {
    await c.callTool({ name: "save_person", arguments: { name: "Maya", allergies: ["tree nuts"] } });
    for (const bad of ["3017624010702", "301762401070", "12345", "3017 6240 10701x", "04252615"]) {
      const r = (await c.callTool({ name: "check_product", arguments: { barcode: bad } })) as { structuredContent: View; isError?: boolean };
      assert.equal(r.isError, true, bad);
      assert.equal(r.structuredContent.kind, "message", bad);
      assert.equal(r.structuredContent.overall, undefined, bad);
      assert.match(r.structuredContent.speech, /barcode doesn't check out/, bad);
    }
    assert.equal(looked.length, 0);
    // Spaces and dashes are what a person types or a recogniser adds; the digits are what is checked.
    const spaced = (await c.callTool({ name: "check_product", arguments: { barcode: "3017 6240 10701" } })) as { structuredContent: View };
    assert.match(spaced.structuredContent.speech, /^Checked Nutella: /);
    // A UPC-E is looked up as the UPC-A it stands for, the key Open Food Facts uses.
    await c.callTool({ name: "check_product", arguments: { barcode: "04252614" } });
    assert.ok(looked.some((u) => u.includes("/api/v2/product/042100005264.json")), looked.join("\n"));
  } finally {
    await c.close();
    await spy.close();
  }
});

test("check_recipe declares openWorldHint (it can call TheMealDB); the local-only tools do not", async () => {
  const { tools } = await client.listTools();
  const hint = (n: string) => tools.find((t) => t.name === n)?.annotations;
  assert.equal(hint("check_recipe")?.openWorldHint, true);
  assert.equal(hint("check_recipe")?.readOnlyHint, true);
  assert.equal(hint("list_people")?.openWorldHint, undefined);
});

test("a blank dish name never reaches TheMealDB", async () => {
  const { Sources } = await import("../src/server/sources.ts");
  let fetched = 0;
  const sources = new Sources((async () => { fetched++; return new Response(JSON.stringify({ meals: [{ strMeal: "Flan" }] })); }) as never, 2000);
  assert.deepEqual(await sources.recipe("   "), {});
  assert.equal(fetched, 0);
});
