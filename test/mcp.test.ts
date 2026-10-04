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
  assert.equal(client.getServerVersion()?.name, "allergy-guard");
});

test("lists nine tools, each linked to the MCP Apps screen", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    "add_to_shopping_list", "check_product", "check_recipe", "find_recipe", "get_shopping_list", "list_people", "remove_from_shopping_list", "remove_person", "save_person",
  ]);
  for (const t of tools) {
    assert.equal((t._meta as any)?.ui?.resourceUri, "ui://allergy-guard/verdict.html", t.name);
    assert.ok((t._meta as any)?.ui?.invoking && (t._meta as any)?.ui?.invoked, t.name);
  }
});

test("every tool result links the screen too (Alexa+ reads resourceUri from the response)", async () => {
  const res = (await client.callTool({ name: "list_people", arguments: {} })) as { _meta?: any };
  assert.equal(res._meta?.ui?.resourceUri, "ui://allergy-guard/verdict.html");
});

test("serves the screen as an MCP Apps resource", async () => {
  const res = await client.readResource({ uri: "ui://allergy-guard/verdict.html" });
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
  assert.match(leo.structuredContent.speech, /guest Leo until [A-Z][a-z]+day 31 December/); // spoken, not ISO
  const list = await call("list_people");
  assert.deepEqual(list.structuredContent.people.map((p: View) => p.name).sort(), ["Leo", "Maya"]);
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

test("shopping list round trip", async () => {
  await call("add_to_shopping_list", { items: ["fennel", "coconut cream"], note: "swaps for Lasagne" });
  const list = await call("get_shopping_list");
  assert.deepEqual(list.structuredContent.shopping.map((i: View) => i.item), ["fennel", "coconut cream"]);
  assert.equal((await call("remove_from_shopping_list", { item: "fennel" })).isError, false);
  assert.equal((await call("get_shopping_list")).structuredContent.shopping.length, 1);
  assert.equal((await call("remove_from_shopping_list", { item: "fennel" })).isError, true);
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
