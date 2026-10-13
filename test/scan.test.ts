// The phone scan page: scan a barcode, then ask Alexa about "what I just scanned".

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { normalizeBarcode, validBarcode } from "../src/server/app.ts";
import { SCAN_TTL_MS } from "../src/server/store.ts";
import { loadPage } from "./dom.ts";
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
  assert.equal(body.ask, "Can Maya have what I just scanned?"); // the prompt on the phone names the household
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

test("a malformed JSON body is a 400 with a plain message, not a 500 with the parser's error", async () => {
  for (const path of ["/scan", "/sim/tool", "/mcp"]) {
    const res = await fetch(`${app.url}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
    assert.equal(res.status, 400, path);
    const text = await res.text();
    assert.doesNotMatch(text, /SyntaxError|Unexpected token|position/, path);
    assert.match(text, /isn't valid JSON/, path);
  }
});

test("a valid UPC-E is accepted and looked up as its UPC-A", async () => {
  assert.ok(validBarcode("04252614"));
  assert.equal(normalizeBarcode("04252614"), "042100005264"); // a real UPC-E and the UPC-A it expands to
  assert.ok(!validBarcode("04252615"), "wrong check digit");
  assert.equal(normalizeBarcode("96385074"), "96385074", "a valid EAN-8 is left alone");
  const res = await scan("04252614");
  assert.equal(res.status, 200);
  assert.equal((await res.json()).barcode, "042100005264");
});

test("the scan page sends the token from the URL fragment, and no header when there is none", async () => {
  for (const [hash, want] of [["#token=scan-secret", "Bearer scan-secret"], ["", undefined]] as const) {
    const sent: Record<string, string>[] = [];
    const fetch = async (_url: string, init: { headers: Record<string, string> }) => {
      sent.push(init.headers);
      return { ok: true, json: async () => ({ name: "Nutella", barcode: "3017624010701" }) };
    };
    const page = await loadPage("scan.html", { globals: { fetch, location: { hash } } });
    page.el("digits").value = "3017624010701";
    await page.el("manual").fire("submit");
    await page.settle();
    assert.equal(sent.length, 1, hash);
    assert.equal(sent[0].Authorization, want, hash);
  }
});

/** The scan page with a camera that works and a decoder that does what the test says. */
async function cameraPage(detect: () => Promise<{ rawValue: string }[]>, fetch: (...a: any[]) => Promise<unknown> = async () => ({ ok: true, json: async () => ({ name: "Nutella", barcode: "3017624010701" }) })) {
  class BarcodeDetector {
    static getSupportedFormats = async () => ["ean_13", "ean_8", "upc_a", "upc_e"];
    detect = detect;
  }
  return loadPage("scan.html", { globals: { fetch, BarcodeDetector, navigator: { vibrate() {}, mediaDevices: { getUserMedia: async () => ({}) } } } });
}

test("the scan page stops after 10 failed reads in a row and says to type the digits", async () => {
  let calls = 0;
  const page = await cameraPage(async () => { calls++; throw new Error("wasm failed to load"); });
  assert.equal(page.el("msg").textContent, "Looking for a barcode…");
  for (let i = 0; i < 20 && page.timers.length; i++) await page.tick();
  assert.equal(calls, 10);
  assert.equal(page.timers.length, 0, "no more reads are scheduled");
  assert.match(page.el("msg").textContent, /Type the digits below/);
});

test("a read that works resets the count of failed reads", async () => {
  let calls = 0;
  const page = await cameraPage(async () => { calls++; if (calls % 5 !== 0) throw new Error("blip"); return []; });
  for (let i = 0; i < 40; i++) await page.tick();
  assert.ok(calls >= 40, "four failures then a good read, over and over: it keeps looking");
  assert.equal(page.timers.length, 1);
  assert.equal(page.el("msg").textContent, "Looking for a barcode…");
});
