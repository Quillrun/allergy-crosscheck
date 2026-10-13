// Server fallbacks that used to hide a mistake: a blank dish, a body that is not an object, an empty product name, a household file of the wrong shape.

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startApp } from "./helpers.ts";
import { Store } from "../src/server/store.ts";

let app: Awaited<ReturnType<typeof startApp>>;
let client: Client;
const call = async (name: string, args: Record<string, unknown> = {}) => (await client.callTool({ name, arguments: args })) as { structuredContent?: Record<string, any>; content: { text: string }[]; isError?: boolean };
const postJson = (path: string, body: string) => fetch(`${app.url}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body });

before(async () => {
  app = await startApp({ baseUrl: "http://127.0.0.1:1/v1", model: "unused" }); // the body is refused before any LLM call
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${app.url}/mcp`)));
  await call("save_person", { name: "Maya", allergies: ["peanuts"] });
});
after(async () => {
  await client.close();
  await app.close();
});

test("find_recipe refuses a blank dish instead of searching for 'dish'", async () => {
  const r = await call("find_recipe", { dish: "   " });
  assert.equal(r.isError, true);
  assert.equal(r.structuredContent, undefined); // refused by the schema, no lookup made
});

test("an empty product name from Open Food Facts falls back to the barcode in the title", async () => {
  const r = await call("check_product", { barcode: "4001112224441" });
  assert.equal(r.structuredContent?.title, "4001112224441");
});

test("a JSON body that is not an object is a 400 on /scan and /sim, never a 500 with a JS message", async () => {
  for (const path of ["/scan", "/sim/tool", "/sim/turn"]) {
    for (const body of ["null", "[]", "7"]) {
      const res = await postJson(path, body);
      assert.equal(res.status, 400, `${path} ${body}`);
      assert.deepEqual(await res.json(), { error: "The request body isn't valid JSON." }, `${path} ${body}`);
    }
  }
});

test("a JSON-RPC batch on /mcp is still read as an array", async () => {
  const res = await fetch(`${app.url}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify([{ jsonrpc: "2.0", id: 1, method: "ping" }]),
  });
  assert.notEqual(res.status, 500);
  assert.notEqual(res.status, 400);
});

test("a household file that parses but is not a household refuses to load", () => {
  const dir = mkdtempSync(join(tmpdir(), "ag-store-"));
  const write = (body: unknown) => {
    const path = join(dir, `h${Math.random()}.json`);
    writeFileSync(path, JSON.stringify(body));
    return path;
  };
  assert.throws(() => new Store(write({})), /refusing to start with an empty household.*no people list/);
  assert.throws(() => new Store(write(null)), /refusing to start/);
  assert.throws(() => new Store(write({ people: [{ name: "Ann", allergies: ["kiwi"], guest: false }] })), /unknown allergen id "kiwi" for Ann/);
  assert.deepEqual(new Store(write({ people: [{ name: "Ann", allergies: ["milk"], guest: false }] })).find("ann")?.allergies, ["milk"]);
});
