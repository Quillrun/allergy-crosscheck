// The simulated Alexa+ turn: an LLM (any OpenAI-compatible endpoint) drives the
// MCP server through a real MCP client. Verdict lock: when a check ran, or a change to
// the household or the shopping list, the spoken answer is the tools' own sentences,
// verdicts first (the worst first), then the changes in call order, so the model can
// never soften a verdict or claim a change it didn't make. Each sentence is returned
// with the index of the screen that produced it (`parts`), so the simulator can show
// each tool's screen as its sentence is spoken.
// No-tool guard: without a tool call the model may ask a question or make small talk, never assert a verdict or an action.
// It gets one nudge to call a tool; after that its claim is replaced.

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { View } from "../server/tools.ts";
import { localDate } from "../server/store.ts";

export type Llm = { baseUrl: string; model: string; apiKey?: string };
export type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string };
type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

/** `parts`: the spoken sentences and the view each came from, in speaking order; empty when the model's own sentence is spoken. */
export type TurnResult = { speech: string; views: View[]; parts: { text: string; view: number }[]; history: ChatMessage[] };

const WRITE_TOOLS = new Set(["save_person", "remove_person", "add_to_shopping_list", "remove_from_shopping_list"]);

const system = (now: Date) => `You are Alexa, running the Allergy Crosscheck add-on in a family kitchen. Today is ${day(now, 0)}. The next days: ${[1, 2, 3, 4, 5, 6, 7].map((n) => day(now, n)).join(", ")}.
- Use the tools for anything about allergies, recipes, products or the shopping list. Never answer allergy questions from memory.
- To check a dish by name, call check_recipe with "dish". To check a single food or ingredient ("can Sam have hummus?"), call check_recipe with ingredients: ["hummus"]. Use check_product only for a specific packaged product or brand, or a barcode; if it returns choices, ask which one and then call it again with that barcode.
- Every question about whether someone can eat a food gets a check, even when the food itself isn't an allergen you track ("is kiwi OK for Ana?" checks kiwi against Ana's allergies).
- If the user is only chatting ("thanks", "hello", "what can you do?"), answer in a sentence without calling a tool.
- Answers are spoken: one or two short sentences.
- Never tell the user a food is safe. Repeat verdicts exactly as the tool gives them.
- Saying you did something is not doing it: every save, check or list change needs its tool call.`;

const day = (now: Date, n: number) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);
  return `${d.toLocaleDateString("en-US", { weekday: "long" })} ${localDate(d)}`;
};

// Without a tool, anything that sounds like a verdict or a completed action is blocked; "You're welcome!" is not.
const CLAIM = /\b(safe|fine|ok|okay|contains?|can(not|'t)? (eat|have)|avoid|free of|saved|added|removed|checked|got it|noted)\b|\bI('ll| will) (add|save|remove|check|note)\b/i;

const SIGN_OFF = /\b(stay|be|keep) safe\b/gi;
const SMALL_TALK = "Happy to help. Ask me about a dish, a food or a product, or tell me who's allergic to what.";

const NUDGE = "You answered without calling a tool. Call the right tool now. If you really need more information, ask one short question instead.";
export const NO_TOOL = "I couldn't check that, so I can't confirm anything. Treat it as unsafe and try asking again.";

export async function runTurn(client: Client, llm: Llm, history: ChatMessage[], text: string): Promise<TurnResult> {
  const { tools } = await client.listTools();
  const fns = tools.map((t) => ({ type: "function" as const, function: { name: t.name, description: t.description ?? "", parameters: t.inputSchema } }));
  const messages: ChatMessage[] = [{ role: "system", content: system(new Date()) }, ...history, { role: "user", content: text }];
  const views: View[] = [];
  const by: string[] = [];
  let nudged = false;
  let nudge: ChatMessage[] = [];

  for (let step = 0; step < 6; step++) {
    const msg = await chat(llm, [...messages, ...nudge], fns);
    nudge = [];
    if (msg.tool_calls?.length) {
      messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: msg.tool_calls });
      for (const call of msg.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }
        const result = await client.callTool({ name: call.function.name, arguments: args });
        const view = result.structuredContent as View | undefined;
        if (view) {
          views.push(view);
          by.push(call.function.name);
        }
        const textOut = (result.content as { type: string; text?: string }[]).map((c) => c.text ?? "").join("\n");
        messages.push({ role: "tool", tool_call_id: call.id, content: textOut });
      }
      continue;
    }
    const said = stripThinking(msg.content ?? "");
    const parts = lockedParts(views, by);
    // No check verdict and no write to speak for: whatever the model asserts is from memory, even after a lookup tool.
    if (!parts.length && !said.endsWith("?") && CLAIM.test(said.replace(SIGN_OFF, ""))) {
      if (!nudged) {
        nudged = true;
        nudge = [{ role: "assistant", content: said }, { role: "user", content: NUDGE }];
        continue;
      }
      return done(messages, NO_TOOL, views);
    }
    // A reply to the nudge that talks about tools is meta-talk, not an answer for the kitchen.
    if (!parts.length && nudged && /\btools?\b/i.test(said)) return done(messages, SMALL_TALK, views);
    return done(messages, parts.length ? parts.map((p) => p.text).join(" ") : said || views.at(-1)?.speech || "Sorry, I didn't catch that.", views, parts);
  }
  // The loop ran out: the lock still applies, so an unsafe check made in an earlier round is not lost behind the last view.
  const parts = lockedParts(views, by);
  return done(messages, parts.length ? parts.map((p) => p.text).join(" ") : (views.at(-1)?.speech ?? "Sorry, I couldn't finish that."), views, parts);
}

// The lock: checks first, the worst first (an unsafe one is never lost behind a later clean one),
// then the household and shopping-list changes in call order; the same sentence is never said twice.
const RANK: Record<string, number> = { unsafe: 2, cannot_confirm: 1, no_listed_allergens: 0 };
const lockedParts = (views: View[], by: string[]): { text: string; view: number }[] => {
  const indexed = views.map((v, i) => ({ v, i }));
  const checks = indexed.filter(({ v }) => v.overall || v.kind === "needs_choice").sort((a, b) => (RANK[b.v.overall ?? "cannot_confirm"] - RANK[a.v.overall ?? "cannot_confirm"]) || a.i - b.i);
  const writes = indexed.filter(({ v, i }) => !(v.overall || v.kind === "needs_choice") && WRITE_TOOLS.has(by[i]));
  const seen = new Set<string>();
  return [...checks, ...writes].flatMap(({ v, i }) => (seen.has(v.speech) ? [] : (seen.add(v.speech), [{ text: v.speech, view: i }])));
};

// History keeps the tool results (so "add the swaps" knows what the swaps were) and
// ends with what was actually spoken, not what the model drafted. It is trimmed at a
// user turn, so a tool result is never separated from the call that produced it.
const HISTORY_LIMIT = 40;
const done = (messages: ChatMessage[], speech: string, views: View[], parts: { text: string; view: number }[] = []): TurnResult => {
  const all: ChatMessage[] = [...messages.slice(1), { role: "assistant", content: speech }];
  const turns = all.flatMap((m, i) => (m.role === "user" ? [i] : []));
  const start = turns.find((i) => i >= all.length - HISTORY_LIMIT) ?? turns.at(-1) ?? 0;
  return { speech, views, parts, history: all.slice(start) };
};


async function chat(llm: Llm, messages: ChatMessage[], tools: unknown[]): Promise<ChatMessage> {
  const res = await fetch(`${llm.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(llm.apiKey ? { Authorization: `Bearer ${llm.apiKey}` } : {}) },
    body: JSON.stringify({ model: llm.model, messages, tools, tool_choice: "auto", temperature: 0.2 }),
  });
  if (!res.ok) throw new Error(`LLM endpoint answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { choices?: { message: ChatMessage }[] };
  const msg = body.choices?.[0]?.message;
  if (!msg) throw new Error("LLM endpoint returned no message");
  return msg;
}

const stripThinking = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
