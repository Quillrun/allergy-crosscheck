// HTTP: the MCP endpoint (Streamable HTTP, stateless), the Alexa+ simulator, and the phone scan page.

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
// Barcode decoding for browsers without a native BarcodeDetector (Safari): served from here, never a CDN.
const VENDOR: Record<string, [string, string]> = {
  "/vendor/barcode-detector.js": ["../../node_modules/barcode-detector/dist/iife/ponyfill.js", "text/javascript; charset=utf-8"],
  "/vendor/zxing_reader.wasm": ["../../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm", "application/wasm"],
};

/** A GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) with a valid check digit. */
export function validBarcode(code: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const d = [...code].map(Number);
  const sum = d.slice(0, -1).reverse().reduce((n, x, i) => n + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === d[d.length - 1];
}

export function createApp(opts: AppOptions): Server {
  const allowed = new Set(["localhost", "127.0.0.1", "[::1]", ...(opts.allowedHosts ?? [])]);
  let client: Client | undefined;

  const http = createHttpServer(async (req, res) => {
    try {
      // DNS-rebinding guard: only answer to hosts we expect (add tunnel hosts via ALLOWED_HOSTS).
      const host = (req.headers.host ?? "").replace(/:\d+$/, "");
      if (!allowed.has(host)) return send(res, 403, { error: `host ${host} not allowed` });
      const url = new URL(req.url ?? "/", "http://local");

      // CSRF guard on every POST: a page on another origin can fire a "simple" request (text/plain, no preflight) at this server
      // from the browser of anyone on the household network. Only JSON from the same origin, or from a client that sends no Origin (curl, the MCP client), gets through.
      if (req.method === "POST") {
        const origin = req.headers.origin;
        if (origin !== undefined && !sameOrigin(origin, req.headers.host)) return send(res, 403, { error: "cross-origin request refused" });
        if (!/^application\/json\s*(;|$)/i.test(req.headers["content-type"] ?? "")) return send(res, 415, { error: "Content-Type must be application/json" });
      }

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
      if (req.method === "GET" && url.pathname === "/scan") return html(res, page("scan.html"));
      if (req.method === "GET" && VENDOR[url.pathname]) {
        const [file, type] = VENDOR[url.pathname];
        res.writeHead(200, { "Content-Type": type, "Cache-Control": "max-age=86400" });
        return res.end(readFileSync(new URL(file, import.meta.url)));
      }
      if (req.method === "POST" && url.pathname === "/scan") {
        const { barcode } = (await readJson(req)) as { barcode?: string };
        const code = String(barcode ?? "").replace(/\D/g, "");
        if (!validBarcode(code)) return send(res, 400, { error: "That isn't a valid barcode. Try again, or type the digits." });
        const { product } = await opts.sources.product(code);
        return send(res, 200, opts.store.saveScan(code, product?.product_name || undefined));
      }
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

function sameOrigin(origin: string, host: string | undefined): boolean {
  try {
    return Boolean(host) && new URL(origin).host.toLowerCase() === host!.toLowerCase();
  } catch {
    return false; // "null" and anything unparsable
  }
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
