// End to end over real Streamable HTTP, with the SDK client playing Alexa+.

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startApp } from "./helpers.ts";

let app: Awaited<ReturnType<typeof startApp>>;
let client: Client;
let transport: StreamableHTTPClientTransport;
type View = Record<string, any>;
const call = async (name: string, args: Record<string, unknown> = {}) => (await client.callTool({ name, arguments: args })) as { structuredContent: View; content: { text: string }[]; isError?: boolean };

before(async () => {
  app = await startApp();
  client = new Client({ name: "test-client", version: "1.0.0" });
  transport = new StreamableHTTPClientTransport(new URL(`${app.url}/mcp`));
  await client.connect(transport);
});
after(async () => {
  await client.close();
  await app.close();
});

test("negotiates MCP 2025-11-25 over Streamable HTTP", () => {
  assert.equal(transport.protocolVersion, "2025-11-25");
  assert.equal(client.getServerVersion()?.name, "allergy-crosscheck");
});

test("lists nine tools, each linked to the MCP Apps screen", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    "add_to_shopping_list", "check_product", "check_recipe", "find_recipe", "get_shopping_list", "list_people", "remove_from_shopping_list", "remove_person", "save_person",
  ]);
  for (const t of tools) {
    assert.equal((t._meta as any)?.ui?.resourceUri, "ui://allergy-crosscheck/verdict.html", t.name);
    assert.ok((t._meta as any)?.ui?.invoking && (t._meta as any)?.ui?.invoked, t.name);
  }
});

test("every tool result links the screen too (Alexa+ reads resourceUri from the response)", async () => {
  const res = (await client.callTool({ name: "list_people", arguments: {} })) as { _meta?: any };
  assert.equal(res._meta?.ui?.resourceUri, "ui://allergy-crosscheck/verdict.html");
});

test("serves the screen as an MCP Apps resource", async () => {
  const res = await client.readResource({ uri: "ui://allergy-crosscheck/verdict.html" });
  assert.equal(res.contents[0].mimeType, "text/html;profile=mcp-app");
  assert.match(String((res.contents[0] as { text: string }).text), /ui\/initialize/);
});

test("checking with nobody saved cannot be confirmed", async () => {
  const r = await call("check_recipe", { ingredients: ["peanuts"] });
  assert.equal(r.structuredContent.overall, "cannot_confirm");
});

test("save people, reject unknown allergies", async () => {
  const bad = await call("save_person", { name: "Zoe", allergies: ["kiwi"] });
  assert.equal(bad.isError, true);
  assert.match(bad.structuredContent.speech, /can't check for kiwi/);
  await call("save_person", { name: "Maya", allergies: ["peanuts", "tree nuts"] });
  const leo = await call("save_person", { name: "Leo", allergies: ["dairy", "celery"], guest: true, until: "2999-12-31" });
  assert.match(leo.structuredContent.speech, /guest Leo until [A-Z][a-z]+day,? 31 December 2999/); // spoken, not ISO; far off, so with the year
  const list = await call("list_people");
  assert.deepEqual(list.structuredContent.people.map((p: View) => p.name).sort(), ["Leo", "Maya"]);
});

test("'also allergic to' adds, and a name it can't read is refused, never saved empty", async () => {
  await call("save_person", { name: "Mary", allergies: ["milk"] });
  const more = await call("save_person", { name: "mary", allergies: ["egg"] });
  assert.match(more.structuredContent.speech, /Added egg for Mary\. I'm checking for milk and egg\./);
  const kiwi = await call("save_person", { name: "Mary", allergies: ["kiwi"] });
  assert.match(kiwi.structuredContent.speech, /so I haven't changed Mary's list/);
  const li = await call("save_person", { name: "Li", allergies: ["牛奶"] });
  assert.equal(li.isError, true);
  assert.match(li.structuredContent.speech, /can't check for 牛奶/);
  await call("remove_person", { name: "Mary" });
});

test("an end date makes a guest, and a date in the past is refused", async () => {
  const past = await call("save_person", { name: "Old", allergies: ["milk"], until: "2020-01-01" });
  assert.equal(past.isError, true);
  assert.match(past.structuredContent.speech, /already passed, so I haven't saved Old/);
  const visitor = await call("save_person", { name: "Visitor", allergies: ["milk"], until: "2999-01-01" });
  assert.equal(visitor.structuredContent.people.find((p: { name: string }) => p.name === "Visitor").guest, true);
  await call("remove_person", { name: "Visitor" });
});

test("check a dish by name: verdict per person, swaps, verdict line for the model", async () => {
  const r = await call("check_recipe", { dish: "lasagne" });
  const v = r.structuredContent;
  assert.equal(v.overall, "unsafe");
  assert.equal(v.title, "Lasagne");
  assert.equal(v.people.find((p: View) => p.name === "Leo").verdict, "unsafe");
  assert.equal(v.people.find((p: View) => p.name === "Maya").verdict, "no_listed_allergens");
  assert.ok(v.swaps.length >= 3);
  assert.match(r.content[0].text, /^VERDICT: UNSAFE/);
  assert.match(r.content[0].text, /Say to the user: Leo should avoid this/);
});

test("a dish not found by its full name falls back, and says which recipe it checked", async () => {
  const r = await call("check_recipe", { dish: "spaghetti carbonara", for: ["Maya"] });
  assert.equal(r.structuredContent.title, "Spaghetti alla Carbonara");
  assert.match(r.structuredContent.speech, /I didn't find spaghetti carbonara exactly, so I checked Spaghetti alla Carbonara\./);
});

test("no recipe found: the dish name is still checked, the rest is unknown", async () => {
  await call("save_person", { name: "Ana", allergies: ["shellfish"] });
  const r = await call("check_recipe", { dish: "shrimp pad thai", for: ["Ana", "Maya"] });
  assert.equal(r.structuredContent.overall, "unsafe");
  assert.match(r.structuredContent.speech, /Ana should avoid this: it contains shellfish, in the shrimp/);
  assert.match(r.structuredContent.speech, /I can't confirm this is OK for Maya/);
  assert.match(r.structuredContent.speech, /Read me the ingredients and I'll check them\./);
  const onlyAna = await call("check_recipe", { dish: "shrimp pad thai", for: ["Ana"] });
  assert.doesNotMatch(onlyAna.structuredContent.speech, /Read me the ingredients/); // already "avoid": nothing more to learn
  await call("remove_person", { name: "Ana" });
});

test("check only for named people, and say who is unknown", async () => {
  const r = await call("check_recipe", { ingredients: ["peanut butter"], for: ["Maya", "Grandma"] });
  assert.equal(r.structuredContent.overall, "unsafe");
  assert.match(r.structuredContent.speech, /don't have allergies saved for Grandma/);
});

test("a product name with several matches asks instead of guessing", async () => {
  const r = await call("check_product", { name: "Nutella" });
  assert.equal(r.structuredContent.kind, "needs_choice");
  assert.equal(r.structuredContent.candidates.length, 2);
  assert.equal(r.structuredContent.overall, undefined);
  assert.match(r.structuredContent.speech, /Which one: Nutella by Ferrero or Nutella\? Or read me the barcode\./);
});

test("a choice remembers who the check was for, and the screen passes it back when a choice is tapped", async () => {
  const limited = await call("check_product", { name: "Nutella", for: ["Maya"] });
  assert.deepEqual(limited.structuredContent.for, ["Maya"]);
  assert.equal((await call("check_product", { name: "Nutella" })).structuredContent.for, undefined);
  const widget = String(((await client.readResource({ uri: "ui://allergy-crosscheck/verdict.html" })).contents[0] as { text: string }).text);
  assert.match(widget, /choose\(b\.dataset\.barcode, v\.for\)/);
  assert.match(widget, /arguments: forNames\?\.length \? \{ barcode, for: forNames \} : \{ barcode \}/);
  // What the tap sends: the same people only.
  const tapped = await call("check_product", { barcode: "3017624010701", for: limited.structuredContent.for });
  assert.deepEqual(tapped.structuredContent.people.map((p: View) => p.name), ["Maya"]);
});

test("choices that sound the same aren't read out", async () => {
  const r = await call("check_product", { name: "spread" });
  assert.equal(r.structuredContent.kind, "needs_choice");
  assert.match(r.structuredContent.speech, /Pick one on the screen, or read me the barcode\.$/);
});

test("product by barcode: reads the ingredient text, not just the tags", async () => {
  const r = await call("check_product", { barcode: "3017624010701" });
  const leo = r.structuredContent.people.find((p: View) => p.name === "Leo");
  assert.equal(leo.verdict, "unsafe");
  assert.equal(r.structuredContent.source.label, "Open Food Facts");
  // The screen merges ingredients with the same flags into one row, definite allergens first.
  const items: View[] = r.structuredContent.items;
  const sig = (i: View) => i.flags.map((f: View) => `${f.kind}:${f.allergen}`).sort().join("|");
  assert.equal(new Set(items.map(sig)).size, items.length);
  assert.ok(items[0].flags.some((f: View) => f.kind === "contains"));
  assert.ok(items.some((i) => i.text === "Allergen warning on the label"));
});

test("a product with no ingredient data cannot be confirmed", async () => {
  const r = await call("check_product", { barcode: "0098008952506" });
  assert.equal(r.structuredContent.overall, "cannot_confirm");
  assert.ok(r.structuredContent.people.every((p: View) => p.verdict === "cannot_confirm"));
});

test("database offline: cannot confirm, no crash", async () => {
  const r = await call("check_product", { name: "offline" });
  assert.equal(r.structuredContent.overall, "cannot_confirm");
  assert.ok(r.structuredContent.dataIssues[0].includes("couldn't be reached"));
});

test("a long shopping list is summarised when read out", async () => {
  await call("add_to_shopping_list", { items: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"] });
  assert.match((await call("get_shopping_list")).structuredContent.speech, /a5 and \d+ more\.$/);
  for (const i of ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"]) await call("remove_from_shopping_list", { item: i });
});

test("shopping list round trip", async () => {
  await call("add_to_shopping_list", { items: ["leek", "coconut cream"], note: "swaps for Lasagne" });
  const list = await call("get_shopping_list");
  assert.deepEqual(list.structuredContent.shopping.map((i: View) => i.item), ["leek", "coconut cream"]);
  assert.equal((await call("remove_from_shopping_list", { item: "leek" })).isError, false);
  assert.equal((await call("get_shopping_list")).structuredContent.shopping.length, 1);
  assert.equal((await call("remove_from_shopping_list", { item: "leek" })).isError, true);
  assert.equal((await call("remove_person", { name: "Nobody" })).isError, true);
});

test("rejects requests for unexpected hosts (DNS rebinding guard)", async () => {
  // fetch() won't send a custom Host header, so use a raw request.
  const status = await new Promise<number>((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port: app.port, path: "/mcp", method: "POST", headers: { Host: "evil.example", "Content-Type": "application/json" } }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.end("{}");
  });
  assert.equal(status, 403);
});

test("an allergy list that resolves to nothing, or a blank name, is refused and nothing is saved", async () => {
  for (const allergies of [["and"], [""], [" "], [",", "&"]]) {
    const r = await call("save_person", { name: "Blank Allergy", allergies });
    assert.equal(r.isError, true, JSON.stringify(allergies));
    assert.match(r.structuredContent.speech, /didn't catch an allergy for Blank Allergy, so I haven't saved them/);
  }
  const noName = await call("save_person", { name: "   ", allergies: ["milk"] });
  assert.equal(noName.isError, true);
  const list = await call("list_people");
  assert.ok(!list.structuredContent.people.some((p: View) => /blank allergy|^\s*$/i.test(p.name)));
  // An existing person's list is left alone, and the reply says so.
  await call("save_person", { name: "Keep Me", allergies: ["milk"] });
  const keep = await call("save_person", { name: "keep me", allergies: ["and"] });
  assert.equal(keep.isError, true);
  assert.match(keep.structuredContent.speech, /changed Keep Me's list/);
  assert.deepEqual((await call("list_people")).structuredContent.people.find((p: View) => p.name === "Keep Me").allergies, ["Milk"]);
  await call("remove_person", { name: "Keep Me" });
});

test("save_person without guest or until leaves a guest a guest", async () => {
  await call("save_person", { name: "Visiting Vic", allergies: ["milk"], until: "2999-01-01" });
  const more = await call("save_person", { name: "visiting vic", allergies: ["egg"] });
  const vic = more.structuredContent.people.find((p: View) => p.name === "Visiting Vic");
  assert.equal(vic.guest, true);
  assert.equal(vic.until, "2999-01-01");
  assert.match(more.structuredContent.speech, /guest Visiting Vic until/);
  await call("remove_person", { name: "Visiting Vic" });
});

test("an empty ingredient list does not stop the dish being looked up", async () => {
  for (const ingredients of [[], ""]) {
    const r = await call("check_recipe", { ingredients, dish: "lasagne" });
    assert.equal(r.structuredContent.title, "Lasagne", JSON.stringify(ingredients));
    assert.equal(r.structuredContent.source?.label, "TheMealDB");
    assert.equal(r.structuredContent.overall, "unsafe");
  }
});
