import { resolve } from "node:path";
import { createApp } from "./app.ts";
import { Sources } from "./sources.ts";
import { Store } from "./store.ts";

const env = process.env;
const port = Number(env.PORT ?? 8787);
const host = env.HOST ?? "127.0.0.1";
const store = new Store(resolve(env.DATA_FILE ?? "data/household.json"));
const llm = env.LLM_BASE_URL && env.LLM_MODEL ? { baseUrl: env.LLM_BASE_URL, model: env.LLM_MODEL, apiKey: env.LLM_API_KEY } : undefined;
const allowedHosts = (env.ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);

createApp({ store, sources: new Sources(), llm, allowedHosts }).listen(port, host, () => {
  console.log(`Allergy Crosscheck MCP server: http://${host}:${port}/mcp  (Streamable HTTP, MCP 2025-11-25)`);
  console.log(`Alexa+ simulator:         http://${host}:${port}/  ${llm ? `(LLM: ${llm.model})` : "(no LLM: demo buttons only)"}`);
});
