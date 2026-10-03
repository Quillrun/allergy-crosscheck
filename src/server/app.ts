// HTTP: the MCP endpoint (Streamable HTTP, stateless) plus the Alexa+ simulator.

import { readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { runTurn } from "../sim/agent.ts";
import type { ChatMessage, Llm } from "../sim/agent.ts";
import type { Sources } from "./sources.ts";
import type { Store } from "./store.ts";
import { createServer } from "./tools.ts";

export type AppOptions = { store: Store; sources: Sources; llm?: Llm; allowedHosts?: string[] };

const page = (file: string) => readFileSync(new URL(`../../public/${file}`, import.meta.url), "utf8");

export function createApp(opts: AppOptions): Server {
  const allowed = new Set(["localhost", "127.0.0.1", "[::1]", ...(opts.allowedHosts ?? [])]);
  let client: Client | undefined;

  const http = createHttpServer(async (req, res) => {
    try {
      // DNS-rebinding guard: only answer to hosts we expect (add tunnel hosts via ALLOWED_HOSTS).
      const host = (req.headers.host ?? "").replace(/:\d+$/, "");
      if (!allowed.has(host)) return send(res, 403, { error: `host ${host} not allowed` });
      const url = new URL(req.url ?? "/", "http://local");

      if (url.pathname === "/mcp") {
        if (req.method !== "POST") return send(res, 405, { jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed (stateless server: use POST)" }, id: null });
        const body = await readJson(req);
        const server = createServer(opts.store, opts.sources);
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
        res.on("close", () => {
          void transport.close();
          void server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, body);
        return;
      }
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/simulator")) return html(res, page("simulator.html"));
      if (req.method === "GET" && url.pathname === "/widget.html") return html(res, page("widget.html"));
      if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true, llm: Boolean(opts.llm) });

      if (req.method === "POST" && url.pathname === "/sim/tool") {
        const { name, args } = (await readJson(req)) as { name: string; args?: Record<string, unknown> };
        client ??= await connect(http);
        const result = await client.callTool({ name, arguments: args ?? {} });
        return send(res, 200, { view: result.structuredContent, isError: result.isError ?? false });
      }
      if (req.method === "POST" && url.pathname === "/sim/turn") {
        if (!opts.llm) return send(res, 503, { error: "No LLM configured. Set LLM_BASE_URL and LLM_MODEL, or use the demo buttons." });
        const { history, text } = (await readJson(req)) as { history?: ChatMessage[]; text: string };
        client ??= await connect(http);
        const turn = await runTurn(client, opts.llm, history ?? [], text);
        return send(res, 200, turn);
      }
      send(res, 404, { error: "not found" });
    } catch (err) {
      client = undefined;
      if (!res.headersSent) send(res, 500, { error: (err as Error).message });
    }
  });
  http.on("close", () => void client?.close());
  return http;
}

/** The simulator talks to the MCP endpoint over real Streamable HTTP, like Alexa+ would. */
async function connect(http: Server): Promise<Client> {
  const addr = http.address();
  const port = typeof addr === "object" && addr ? addr.port : 8787;
  const client = new Client({ name: "alexa-plus-simulator", version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
  return client;
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function html(res: ServerResponse, body: string) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}
