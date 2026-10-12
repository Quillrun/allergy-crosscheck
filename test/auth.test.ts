// Optional bearer token on /mcp, loopback-only /sim/*, and the request-size cap.

import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { startApp } from "./helpers.ts";

const rpc = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_people", arguments: {} } });
const post = (url: string, body: string, headers: Record<string, string> = {}) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers }, body });

/** A POST with a chosen Host header (fetch can't set one). */
const postAs = (port: number, host: string, path: string) =>
  new Promise<number>((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "POST", headers: { host, "Content-Type": "application/json" } }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.end(JSON.stringify({ name: "list_people" }));
  });

test("with MCP_TOKEN set, /mcp needs the bearer token", async () => {
  const app = await startApp(undefined, { mcpToken: "s3cret" });
  try {
    assert.equal((await post(`${app.url}/mcp`, rpc)).status, 401);
    assert.equal((await post(`${app.url}/mcp`, rpc, { Authorization: "Bearer wrong" })).status, 401);
    assert.equal((await post(`${app.url}/mcp`, rpc, { Authorization: "Bearer s3cret" })).status, 200);
  } finally {
    await app.close();
  }
});

test("without MCP_TOKEN, /mcp stays open", async () => {
  const app = await startApp();
  try {
    assert.equal((await post(`${app.url}/mcp`, rpc)).status, 200);
  } finally {
    await app.close();
  }
});

test("the simulator drives /mcp with the token too", async () => {
  const app = await startApp(undefined, { mcpToken: "s3cret" });
  try {
    const res = await post(`${app.url}/sim/tool`, JSON.stringify({ name: "list_people" }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).isError, false);
  } finally {
    await app.close();
  }
});

test("/sim/* refuses a non-loopback host unless SIM_PUBLIC", async () => {
  const closed = await startApp(undefined, { allowedHosts: ["tunnel.example"] });
  try {
    assert.equal(await postAs(closed.port, "tunnel.example", "/sim/tool"), 403);
    assert.equal(await postAs(closed.port, "localhost", "/sim/tool"), 200);
  } finally {
    await closed.close();
  }
  const open = await startApp(undefined, { allowedHosts: ["tunnel.example"], simPublic: true });
  try {
    assert.equal(await postAs(open.port, "tunnel.example", "/sim/tool"), 200);
  } finally {
    await open.close();
  }
});
