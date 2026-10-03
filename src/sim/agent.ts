// The simulated Alexa+ turn: an LLM (any OpenAI-compatible endpoint) drives the
// MCP server through a real MCP client. Verdict lock: when a check tool ran, the
// spoken answer is the tool's own sentence, so the model can never soften it.

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { View } from "../server/tools.ts";

export type Llm = { baseUrl: string; model: string; apiKey?: string };
export type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string };
type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export type TurnResult = { speech: string; views: View[]; history: ChatMessage[] };

const system = (today: string) => `You are Alexa, running the Allergy Guard add-on in a family kitchen. Today is ${today}.
- Use the tools for anything about allergies, recipes, products or the shopping list. Never answer allergy questions from memory.
- To check a dish by name, call check_recipe with "dish". To check a product by name, call check_product with "name"; if it returns choices, ask which one and then call it again with that barcode.
- Answers are spoken: one or two short sentences.
- Never tell the user a food is safe. Repeat verdicts exactly as the tool gives them.`;

export async function runTurn(client: Client, llm: Llm, history: ChatMessage[], text: string): Promise<TurnResult> {
  const { tools } = await client.listTools();
  const fns = tools.map((t) => ({ type: "function" as const, function: { name: t.name, description: t.description ?? "", parameters: t.inputSchema } }));
  const messages: ChatMessage[] = [{ role: "system", content: system(new Date().toISOString().slice(0, 10)) }, ...history, { role: "user", content: text }];
  const views: View[] = [];

  for (let step = 0; step < 6; step++) {
    const msg = await chat(llm, messages, fns);
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
        if (view) views.push(view);
        const textOut = (result.content as { type: string; text?: string }[]).map((c) => c.text ?? "").join("\n");
        messages.push({ role: "tool", tool_call_id: call.id, content: textOut });
      }
      continue;
    }
    const checks = views.filter((v) => v.overall || v.kind === "needs_choice");
    const speech = checks.length ? checks[checks.length - 1].speech : stripThinking(msg.content ?? "") || views.at(-1)?.speech || "Sorry, I didn't catch that.";
    return { speech, views, history: [...history, { role: "user", content: text }, { role: "assistant", content: speech }] };
  }
  const fallback = views.at(-1)?.speech ?? "Sorry, I couldn't finish that.";
  return { speech: fallback, views, history: [...history, { role: "user", content: text }, { role: "assistant", content: fallback }] };
}

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
