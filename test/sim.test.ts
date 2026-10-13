// The simulator's verdict lock: even if the model tries to say "safe", the spoken
// answer after a check is the tool's own sentence. And without a tool call the
// model may ask, never assert.

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { startApp } from "./helpers.ts";
import { NO_TOOL } from "../src/sim/agent.ts";

let llmCalls = 0;
const fakeLlm = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = JSON.parse(Buffer.concat(chunks).toString());
  llmCalls++;
  // Only the current turn counts (the latest user message that is not the loop's nudge): a long history carries the tool results of earlier turns.
  const lastUser = body.messages.map((m: { role: string; content?: string }) => m.role === "user" && !/^You answered without calling a tool/.test(m.content ?? "")).lastIndexOf(true);
  const thisTurn: { role: string }[] = body.messages.slice(lastUser);
  const sawTool = thisTurn.some((m) => m.role === "tool");
  const toolMsgs = thisTurn.filter((m) => m.role === "tool").length;
  const asked = body.messages[lastUser].content as string;
  const call = (id: string, name: string, args: unknown) => ({ id, type: "function", function: { name, arguments: JSON.stringify(args) } });
  const message = /chain/.test(asked)
    ? toolMsgs === 0
      ? { role: "assistant", content: null, tool_calls: [call("c1", "check_recipe", { ingredients: ["satay sauce", "rice"] })] }
      : toolMsgs === 1
      ? { role: "assistant", content: null, tool_calls: [call("c2", "add_to_shopping_list", { items: ["sunflower seed butter"] })] }
      : { role: "assistant", content: "Done, and it's totally safe now!" }
    : /never stops/.test(asked)
    ? { role: "assistant", content: null, tool_calls: [call(`n${toolMsgs}`, "check_recipe", { ingredients: [toolMsgs === 0 ? "peanut butter" : "rice"], for: ["Maya"] })] }
    : /save Sam/.test(asked)
    ? toolMsgs === 0
      ? { role: "assistant", content: null, tool_calls: [call("c1", "save_person", { name: "Sam", allergies: ["egg"] })] }
      : { role: "assistant", content: "Saved Sam, he's all set!" }
    : /lasagne/.test(asked)
    ? toolMsgs === 0
      ? { role: "assistant", content: null, tool_calls: [call("c1", "find_recipe", { dish: "lasagne" })] }
      : { role: "assistant", content: "Lasagne is safe for Maya." }
    : /pesto/.test(asked)
    ? { role: "assistant", content: "Pesto is fine for Maya." }
    : /thanks/i.test(asked)
    ? { role: "assistant", content: "You're welcome!" }
    : /bye/i.test(asked)
    ? { role: "assistant", content: "Bye, stay safe!" }
    : /dinner/.test(asked)
    ? { role: "assistant", content: "Which dish is dinner?" }
    : !sawTool && /two checks/.test(asked)
    ? { role: "assistant", content: null, tool_calls: (/reversed/.test(asked) ? ["rice", "peanut butter"] : ["peanut butter", "rice"]).map((food, i) => (
        { id: `c${i}`, type: "function", function: { name: "check_recipe", arguments: JSON.stringify({ ingredients: [food], for: ["Maya"] }) } }
      )) }
    : sawTool
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

test("two checks in one turn: the unsafe one is spoken first whichever call came first, and the clean one is not alone", async () => {
  for (const [text, order] of [["Run two checks", ["unsafe", "no_listed_allergens"]], ["Run two checks reversed", ["no_listed_allergens", "unsafe"]]] as const) {
    const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const turn = await res.json();
    assert.deepEqual(turn.views.map((v: { overall: string }) => v.overall), order, text);
    assert.match(turn.speech, /^Maya should avoid this: it contains peanuts/, text);
    assert.match(turn.speech, /Nothing listed for Maya's allergies, but check the label/, text);
  }
});

test("a check and a list add in one turn: both tools' sentences are spoken, each with its screen", async () => {
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "chain: check satay and put the swap on my list" }) });
  const turn = await res.json();
  assert.equal(res.status, 200);
  assert.match(turn.speech, /^Maya should avoid this: it contains peanuts/);
  assert.doesNotMatch(turn.speech, /totally safe/);
  assert.equal(turn.parts.length, 2);
  assert.equal(turn.views[turn.parts[0].view].kind, "recipe_check");
  assert.equal(turn.views[turn.parts[1].view].kind, "shopping");
  assert.ok(turn.speech.endsWith(turn.views[turn.parts[1].view].speech));
});

test("a save without a check speaks the tool's sentence, not the model's", async () => {
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "save Sam, allergic to egg" }) });
  const turn = await res.json();
  assert.equal(turn.speech, turn.views[0].speech);
  assert.doesNotMatch(turn.speech, /all set/);
  assert.equal(turn.parts.length, 1);
});

test("a verdict without a tool call is never spoken", async () => {
  const before = llmCalls;
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Can Maya eat pesto?" }) });
  const turn = await res.json();
  assert.equal(llmCalls - before, 2); // one nudge, then replaced
  assert.equal(turn.speech, NO_TOOL);
});

test("after a lookup tool (no verdict) a claim of 'safe' is still blocked", async () => {
  const before = llmCalls;
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Find the lasagne recipe, is it ok for Maya?" }) });
  const turn = await res.json();
  assert.equal(turn.views[0].kind, "recipe");
  assert.equal(llmCalls - before, 3); // the lookup, the claim, then the claim again after the nudge
  assert.equal(turn.speech, NO_TOOL);
});

test("without a tool call the model may still ask a question", async () => {
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Check dinner" }) });
  assert.equal((await res.json()).speech, "Which dish is dinner?");
});

test("long history is trimmed at a user turn, never between a tool call and its result", async () => {
  // Each turn is four messages (user, tool call, tool result, spoken answer); 15 turns is 60, over the limit of 40.
  type Msg = { role: string; content?: string | null; tool_calls?: { id: string }[]; tool_call_id?: string };
  let history: Msg[] = [];
  for (let i = 1; i <= 15; i++) {
    const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ history, text: `Is satay chicken with rice ok for Maya? (round ${i})` }) });
    history = (await res.json()).history;
  }
  assert.equal(history.length, 40); // 60 messages were produced: the oldest five turns are gone, whole
  assert.equal(history[0].role, "user");
  assert.match(String(history[0].content), /round 6\)$/);
  assert.equal(history.filter((m) => m.role === "user").length, 10);
  assert.ok(!history.some((m) => /round [1-5]\)/.test(String(m.content))));
  // Every tool result follows the assistant message that made the call, and every call has all its results.
  history.forEach((m, i) => {
    if (m.role === "tool") {
      const call = history.slice(0, i).reverse().find((x) => x.role === "assistant" && x.tool_calls);
      assert.ok(call?.tool_calls?.some((c) => c.id === m.tool_call_id), `tool result ${i} has no call`);
    }
    for (const c of m.tool_calls ?? []) {
      assert.ok(history.slice(i + 1).some((x) => x.role === "tool" && x.tool_call_id === c.id), `call ${c.id} at ${i} has no result`);
    }
  });
});

test("the verdict lock holds when the tool loop runs out: an earlier unsafe check is still spoken", async () => {
  const before = llmCalls;
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "A model that never stops calling tools" }) });
  const turn = await res.json();
  assert.equal(llmCalls - before, 6); // the loop ran out
  assert.equal(turn.views.at(-1).overall, "no_listed_allergens"); // the last screen is a clean one...
  assert.equal(turn.views[0].overall, "unsafe");
  assert.match(turn.speech, /^Maya should avoid this/); // ...but the unsafe verdict comes first and is not lost
  assert.equal(turn.parts[0].view, 0);
  assert.equal(turn.parts.map((p: { text: string }) => p.text).join(" "), turn.speech);
});

test("small talk without a tool is spoken as is", async () => {
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Thanks!" }) });
  assert.equal((await res.json()).speech, "You're welcome!");
});

test("a sign-off like 'stay safe' isn't treated as a verdict", async () => {
  const res = await fetch(`${app.url}/sim/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Bye!" }) });
  assert.equal((await res.json()).speech, "Bye, stay safe!");
});

test("simulator pages are served", async () => {
  assert.match(await (await fetch(`${app.url}/`)).text(), /Alexa\+ simulator/);
  assert.match(await (await fetch(`${app.url}/widget.html`)).text(), /ui\/initialize/);
  assert.deepEqual(await (await fetch(`${app.url}/health`)).json(), { ok: true, llm: true });
});
