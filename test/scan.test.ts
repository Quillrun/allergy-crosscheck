// The phone scan page: scan a barcode, then ask Alexa about "what I just scanned".

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { validBarcode } from "../src/server/app.ts";
import { SCAN_TTL_MS } from "../src/server/store.ts";
import { startApp } from "./helpers.ts";

let app: Awaited<ReturnType<typeof startApp>>;
let client: Client;
type View = Record<string, any>;
const call = async (name: string, args: Record<string, unknown> = {}) => (await client.callTool({ name, arguments: args })) as { structuredContent: View; isError?: boolean };
const scan = (barcode: unknown) => fetch(`${app.url}/scan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barcode }) });

before(async () => {
  app = await startApp();
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${app.url}/mcp`)));
  await call("save_person", { name: "Maya", allergies: ["peanuts", "tree nuts"] });
});
after(async () => {
  await client.close();
  await app.close();
});

test("barcodes need the right length and check digit", () => {
  for (const ok of ["3017624010701", "0050700000220", "012345678905", "96385074"]) assert.ok(validBarcode(ok), ok);
  for (const bad of ["3017624010702", "12345", "301762401070a", ""]) assert.ok(!validBarcode(bad), bad);
});

test("asking about a scan before anything was scanned asks for one, never guesses", async () => {
  const r = await call("check_product", { scanned: true });
  assert.equal(r.isError, true);
  assert.equal(r.structuredContent.kind, "message");
  assert.match(r.structuredContent.speech, /don't have a recent scan/);
});

test("a misread barcode is refused and not saved", async () => {
  const res = await scan("3017624010702");
  assert.equal(res.status, 400);
  assert.equal(app.store.recentScan(), undefined);
});

test("a scan is looked up, saved, and checked when asked about", async () => {
  const res = await scan("3017 6240 10701");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.barcode, "3017624010701");
  assert.equal(body.name, "Nutella");
  const r = await call("check_product", { scanned: true });
  assert.equal(r.structuredContent.kind, "product_check");
  assert.equal(r.structuredContent.title, "Nutella");
  assert.equal(r.structuredContent.overall, "unsafe");
  assert.match(r.structuredContent.speech, /Maya should avoid this/);
});

test("an old scan doesn't stand in for 'what I just scanned'", () => {
  const later = new Date(Date.now() + SCAN_TTL_MS + 60_000);
  assert.equal(app.store.recentScan(later), undefined);
  assert.ok(app.store.recentScan());
});

test("serves the scan page and its barcode decoder locally", async () => {
  const page = await fetch(`${app.url}/scan`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Scan a product/);
  const wasm = await fetch(`${app.url}/vendor/zxing_reader.wasm`);
  assert.equal(wasm.headers.get("content-type"), "application/wasm");
  assert.ok((await wasm.arrayBuffer()).byteLength > 100_000);
  const js = await fetch(`${app.url}/vendor/barcode-detector.js`);
  assert.match(await js.text(), /BarcodeDetectionAPI/);
});

test("POST routes need JSON and refuse a foreign Origin (CSRF); same-origin and no-Origin clients still work", async () => {
  const body = JSON.stringify({ barcode: "3017624010701" });
  const post = (path: string, headers: Record<string, string>, payload = body) => fetch(`${app.url}${path}`, { method: "POST", headers, body: payload });
  const json = { "Content-Type": "application/json" };
  const scanBefore = app.store.recentScan()?.at;
  for (const path of ["/scan", "/sim/tool", "/sim/turn", "/mcp"]) {
    assert.equal((await post(path, { "Content-Type": "text/plain" })).status, 415, `${path} text/plain`);
    assert.equal((await post(path, {})).status, 415, `${path} no content type`);
    assert.equal((await post(path, { ...json, Origin: "https://evil.example" })).status, 403, `${path} foreign origin`);
    assert.equal((await post(path, { "Content-Type": "text/plain", Origin: "https://evil.example" })).status, 403, `${path} both`);
    assert.equal((await post(path, { ...json, Origin: "null" })).status, 403, `${path} opaque origin`);
  }
  // Nothing was saved by the refused scans.
  assert.equal(app.store.recentScan()?.at, scanBefore);
  const host = new URL(app.url).host;
  assert.equal((await post("/scan", { ...json, Origin: `http://${host}` })).status, 200); // the scan page itself
  assert.equal((await post("/scan", { "Content-Type": "application/json; charset=utf-8" })).status, 200); // curl
  assert.equal((await post("/sim/tool", { ...json, Origin: `http://${host}` }, JSON.stringify({ name: "list_people" }))).status, 200);
});
