// A guest whose visit has ended stays saved but is not checked; every surface says so.

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startApp } from "./helpers.ts";

let app: Awaited<ReturnType<typeof startApp>>;
let client: Client;
type View = Record<string, any>;
const call = async (name: string, args: Record<string, unknown> = {}) => (await client.callTool({ name, arguments: args })) as { structuredContent: View; content: { text: string }[]; isError?: boolean };

before(async () => {
  app = await startApp();
  app.store.savePerson({ name: "Maya", allergies: ["peanut"], guest: false });
  app.store.savePerson({ name: "Leo", allergies: ["milk"], guest: true, until: "2020-01-05" });
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${app.url}/mcp`)));
});
after(async () => {
  await client.close();
  await app.close();
});

test("a check says an expired guest was not checked, instead of skipping them silently", async () => {
  for (const r of [await call("check_recipe", { ingredients: ["butter"] }), await call("check_product", { barcode: "3017624010701" })]) {
    assert.match(r.structuredContent.speech, /^Leo's visit ended on [A-Z][a-z]+day,? 5 January 2020, so I didn't check for them\./);
    assert.deepEqual(r.structuredContent.people.map((p: View) => p.name), ["Maya"]);
  }
});

test("list_people and the rows mark an expired guest as ended", async () => {
  const r = await call("list_people");
  assert.match(r.structuredContent.speech, /Leo \(guest, visit ended [A-Z][a-z]+day,? 5 January 2020\): milk/);
  assert.match(r.structuredContent.speech, /Maya: peanuts/);
  const rows = r.structuredContent.people;
  assert.equal(rows.find((p: View) => p.name === "Leo").expired, true);
  assert.equal(rows.find((p: View) => p.name === "Maya").expired, undefined);
  const widget = readFileSync(new URL("../public/widget.html", import.meta.url), "utf8");
  assert.match(widget, /p\.expired \? "ended" : "until"/);
});

test("when only an expired guest is saved, the check still says why nothing was checked", async () => {
  app.store.removePerson("Maya");
  const r = await call("check_recipe", { ingredients: ["butter"] });
  assert.equal(r.structuredContent.overall, "cannot_confirm");
  assert.match(r.structuredContent.speech, /Leo's visit ended on .*so I didn't check for them\. Tell me who's eating/);
});
