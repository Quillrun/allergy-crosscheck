// The simulator's verdict lock: even if the model tries to say "safe", the spoken
// answer after a check is the tool's own sentence.

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { startApp } from "./helpers.ts";

let llmCalls = 0;
const fakeLlm = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = JSON.parse(Buffer.concat(chunks).toString());
  llmCalls++;
  const sawTool = body.messages.some((m: { role: string }) => m.role === "tool");
  const message = sawTool
    ? { role: "assistant", content: "Good news, it's totally safe for everyone!" }
    : { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "check_recipe", arguments: JSON.stringify({ ingredients: ["satay sauce", "rice"] }) } }] };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message }] }));
});

let app: Awaited<ReturnType<typeof startApp>>;
before(async () => {
  await new Promise<void>((r) => fakeLlm.listen(0, "127.0.0.1", r));
  const port = (fakeLlm.address() as AddressInfo).port;
  app = await startApp({ baseUrl: `http://127.0.0.1:${port}/v1`, model: "fake" });
  await fetch(`${app.url}/sim/tool`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "save_person", args: { name: "Maya", allergies: ["peanuts"] } }) });
});
after(async () => {
  await app.close();
  fakeLlm.closeAllConnections();
  await new Promise<void>((r) => fakeLlm.close(() => r()));
});

test("a model that says 'safe' is overridden by the tool's verdict", async () => {
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Is satay chicken with rice ok for Maya?" }) });
  const turn = await res.json();
  assert.equal(res.status, 200);
  assert.ok(llmCalls >= 2);
  assert.doesNotMatch(turn.speech, /safe for everyone/);
  assert.match(turn.speech, /Maya should avoid this: it contains peanuts/);
  assert.equal(turn.views[0].overall, "unsafe");
});

test("simulator pages are served", async () => {
  assert.match(await (await fetch(`${app.url}/`)).text(), /Alexa\+ simulator/);
  assert.match(await (await fetch(`${app.url}/widget.html`)).text(), /ui\/initialize/);
  assert.deepEqual(await (await fetch(`${app.url}/health`)).json(), { ok: true, llm: true });
});
