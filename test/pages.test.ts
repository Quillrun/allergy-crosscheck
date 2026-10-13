// The screen (widget.html) and the simulator host: a tapped choice that fails must say so, never sit on "Checking…".
// Run against test/dom.ts's fake DOM, since there is no browser here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadPage } from "./dom.ts";

const CHOICES = { kind: "needs_choice", title: "Which Nutella?", speech: "Which one?", disclaimer: "Check the label.", candidates: [{ barcode: "3017624010701", name: "Nutella", brand: "Ferrero" }] };
type Sent = { id?: number; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };

/** The widget with a choice on screen; returns the page and a function that taps it and gives the request it sent. */
async function widgetWithChoice() {
  const page = await loadPage("widget.html");
  const app = page.el("app");
  // The fake DOM does not parse HTML: the one button the widget rendered is rebuilt from its markup.
  const made = new Map<string, ReturnType<typeof app.querySelectorAll>>(); // one set of buttons per rendering, so a listener added at render is on the button the test taps
  app.querySelectorAll = () => {
    if (!made.has(app.innerHTML)) {
      made.set(app.innerHTML, [...app.innerHTML.matchAll(/data-barcode="([^"]+)"/g)].map((m) => {
        const b = page.win.document.createElement("button");
        b.dataset.barcode = m[1];
        return b;
      }));
    }
    return made.get(app.innerHTML)!;
  };
  const sent: Sent[] = [];
  page.win.parent.postMessage = (m: Sent) => void sent.push(m);
  await page.win.dispatchMessage({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: { structuredContent: CHOICES } });
  assert.match(app.innerHTML, /Which Nutella\?/);
  const buttons = app.querySelectorAll();
  assert.equal(buttons.length, 1);
  const tap = async () => {
    const before = sent.length;
    buttons[0].fire("click");
    await page.settle();
    return sent.slice(before).find((m) => m.method === "tools/call");
  };
  return { page, app, tap };
}

test("widget: a tapped choice shows the answer when the host replies with a screen", async () => {
  const { page, app, tap } = await widgetWithChoice();
  const call = await tap();
  assert.equal(call?.params?.name, "check_product");
  assert.match(app.innerHTML, /Checking…/);
  await page.win.dispatchMessage({ jsonrpc: "2.0", id: call?.id, result: { content: [], structuredContent: { kind: "message", title: "Barcode not recognised", speech: "That barcode doesn't check out.", disclaimer: "Check the label." }, isError: true } });
  assert.doesNotMatch(app.innerHTML, /Checking…/);
  assert.match(app.innerHTML, /Barcode not recognised/); // an isError reply that carries a view is shown
});

test("widget: a reply with no screen leaves a failure message, not 'Checking…'", async () => {
  const { page, app, tap } = await widgetWithChoice();
  const call = await tap();
  await page.win.dispatchMessage({ jsonrpc: "2.0", id: call?.id, result: { content: [], isError: true } });
  assert.doesNotMatch(app.innerHTML, /Checking…/);
  assert.match(app.innerHTML, /That didn't work/);
});

test("widget: an error reply from the host leaves a failure message", async () => {
  const { page, app, tap } = await widgetWithChoice();
  const call = await tap();
  await page.win.dispatchMessage({ jsonrpc: "2.0", id: call?.id, error: { code: -32000, message: "boom" } });
  assert.match(app.innerHTML, /That didn't work/);
});

test("widget: a host that never answers times out instead of leaving 'Checking…' for ever", async () => {
  const { page, app, tap } = await widgetWithChoice();
  await tap();
  assert.match(app.innerHTML, /Checking…/);
  const waits = page.timers.map((t) => t.ms);
  assert.ok(waits.some((ms) => ms >= 5_000 && ms <= 60_000), `a request timer of 5-60 s, got ${waits}`);
  await page.tick();
  assert.doesNotMatch(app.innerHTML, /Checking…/);
  assert.match(app.innerHTML, /That didn't work/);
});

test("widget: a tool result with no screen replaces 'Checking…' too", async () => {
  const page = await loadPage("widget.html");
  await page.win.dispatchMessage({ jsonrpc: "2.0", method: "ui/notifications/tool-input", params: {} });
  assert.match(page.el("app").innerHTML, /Checking…/);
  await page.win.dispatchMessage({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: { content: [] } });
  assert.match(page.el("app").innerHTML, /That didn't work/);
});

// --- the simulator is the host: it must always answer the view's tools/call

async function simulator(fetch: (url: string, init?: unknown) => Promise<unknown>) {
  const page = await loadPage("simulator.html", { globals: { fetch } });
  const frame = page.el("view");
  const asked = async (id: number) => {
    await page.win.dispatchMessage({ jsonrpc: "2.0", id, method: "tools/call", params: { name: "check_product", arguments: { barcode: "3017624010701" } } }, { source: frame.contentWindow });
    return (frame.contentWindow.sent as { id?: number; result?: Record<string, unknown> }[]).find((m) => m.id === id)?.result;
  };
  return { asked };
}
const health = (url: string) => (url === "/health" ? Promise.resolve({ ok: true, json: async () => ({ llm: false }) }) : undefined);

test("simulator: a tools/call is answered with the view when the server has one", async () => {
  const { asked } = await simulator((url) => health(url) ?? Promise.resolve({ ok: true, json: async () => ({ view: CHOICES, isError: false }) }));
  const result = await asked(7);
  assert.equal((result?.structuredContent as { title: string }).title, "Which Nutella?");
  assert.equal(result?.isError, false);
});

test("simulator: a failed server call is answered with isError, not silence", async () => {
  for (const [name, fetch] of [
    ["the server answers 500", (url: string) => health(url) ?? Promise.resolve({ ok: false, json: async () => ({ error: "boom" }) })],
    ["the network fails", (url: string) => health(url) ?? Promise.reject(new TypeError("Failed to fetch"))],
    ["the body is not JSON", (url: string) => health(url) ?? Promise.resolve({ ok: true, json: async () => { throw new SyntaxError("Unexpected token <"); } })],
    ["the server returns no view", (url: string) => health(url) ?? Promise.resolve({ ok: true, json: async () => ({ isError: false }) })],
  ] as const) {
    const { asked } = await simulator(fetch);
    const result = await asked(9);
    assert.ok(result, name);
    assert.equal(result.isError, true, name);
    assert.equal(result.structuredContent, undefined, name);
  }
});
