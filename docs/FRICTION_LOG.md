# Friction log

Each entry is something that happened while building Allergy Crosscheck. Format: task, steps, expected vs actual, severity, workaround, suggestion.

## 1. Testing on a real Alexa+ from outside the US

- **Task:** test the add-on end to end in the Alexa+ web simulator.
- **Steps:** read the MCP Toolkit overview, the QuickStart and "Test Your MCP Add-ons".
- **Expected:** any developer account can deploy a development add-on and talk to it in the web simulator, without publishing.
- **Actual:** the overview says "The MCP Toolkit is available in the United States", the QuickStart sample uses `"distributionCountries": ["US"]`, and the testing page says the add-on must be deployed before it can be tested. I'm outside the US, so I didn't attempt a deployment.
- **Severity:** high. It blocks the only end-to-end test path.
- **Workaround:** I built a simulator. A local LLM drives the server through the MCP TypeScript SDK client over Streamable HTTP, and a host shim renders the MCP Apps view in an Echo Show-sized frame.
- **Suggestion:** let developer accounts in any country use the web simulator for development-stage add-ons, with distribution still limited to supported countries. Or ship the simulator as a local tool next to the Local Inspector.

## 2. Making a safety-critical answer reach the user unchanged

- **Task:** make sure "Leo should avoid this: it contains milk" is never spoken as "should be fine".
- **Steps:** read the MCP Design Guide. Ran the full demo conversation against a real model (Qwen3.5 9B), not only a scripted fake.
- **Expected:** a way for a tool to mark one sentence as "speak this verbatim".
- **Actual:** the guide says "You can't script what Alexa says". In my runs the real model also:
  - said "Got it, I'll add Leo" without calling the save tool;
  - answered "can Maya eat this pesto?" from its own knowledge without calling the check tool.

  In both cases no check ran, so no verdict could be enforced.
- **Severity:** high for health and safety add-ons (allergies, medication, recalls). Low for most others.
- **Workaround:**
  - Every tool result leads with `VERDICT:` and `Say to the user: …` lines, and the tool descriptions tell the model to repeat verdicts exactly.
  - In my simulator I added two guards that Alexa+ doesn't offer: a verdict lock (after a check, the spoken answer is the tool's sentence) and a no-tool guard (without a tool call the model may ask a question but not state anything).
- **Suggestion:**
  - Support a `_meta` hint on tool results, for example `speech: { text, verbatim: true }`, that Alexa+ honours or at least only shortens.
  - Have certification test that safety verdicts survive paraphrase.

## 3. No automated multi-turn conversation testing

- **Task:** catch regressions in how a conversation uses the tools across turns.
- **Steps:** read "Test Your MCP Add-ons" and the Local Inspector page.
- **Expected:** a scripted conversation test: utterances in, assertions on which tools were called and what was spoken, runnable in CI.
- **Actual:** the Local Inspector checks tools, payloads and rendering one call at a time. Conversations are tested by hand in the web simulator. The bugs that mattered most only showed up across turns. Example: "add the swaps to my list" added made-up items because the previous turn's tool result was missing from the model's context.
- **Severity:** medium.
- **Workaround:** the simulator's `/sim/turn` endpoint plus a script that runs the whole demo conversation against a real model and prints each tool call and spoken line.
- **Suggestion:** a conversation-test mode in the Local Inspector or the `alexa-ai` CLI: a YAML list of turns, expected tool calls and spoken-text assertions, run against a deployed or local add-on.

## 4. Getting the Local Inspector

- **Task:** run the Local Inspector's certification check against the server.
- **Steps:** ran `npm view @alexa-ai/addon-local-inspector`, then read the Local Inspector page.
- **Expected:** a public npm package, so it can run in CI like the MCP Inspector (`npx @modelcontextprotocol/inspector`).
- **Actual:** npm returns 404, and installation goes through a Developer Console login. Searching npm for "alexa-ai" instead returns an unscoped `alexa-ai` package from an unrelated third party (a WhatsApp bot), which someone could install by mistake.
- **Severity:** medium. It adds a manual step and a supply-chain trap.
- **Workaround:** tested with my own integration tests, which drive the server through the MCP TypeScript SDK client over real HTTP (60 tests in all).
- **Suggestion:** publish the inspector and the `alexa-ai` CLI publicly under the `@alexa-ai` scope. Put the exact `npm i -g @alexa-ai/...` command in the docs, so nobody guesses an unscoped name.

## 5. Where `_meta.ui` goes: tool definition or tool result?

- **Task:** link each tool to the MCP Apps screen so Alexa+ renders it.
- **Steps:** followed the MCP Apps spec (2026-01-26), which puts `_meta.ui.resourceUri` on the tool definition in `tools/list`. Then read "MCP Client and App Lifecycle" for Alexa+.
- **Expected:** one place, consistent with the MCP Apps spec.
- **Actual:**
  - The Alexa+ page shows `_meta.ui` with `resourceUri`, `invoking` and `invoked` under "MCP tool call response payload", and says custom visuals render "as long as you have `resourceUri` defined in the tool response".
  - A server built only to the MCP Apps spec could pass every local test and still show no screen on Alexa+.
  - `invoking` text in a response also arrives after the tool has finished, which seems too late for an "in progress" message.
- **Severity:** medium. Easy to miss, and silent when wrong.
- **Workaround:** `resourceUri` on every tool definition and every tool result, and `invoking`/`invoked` on the definitions. A test checks both.
- **Suggestion:** state explicitly which `_meta.ui` fields Alexa+ reads from `tools/list` and which from `tools/call` results, and have the Local Inspector warn when a tool result lacks `resourceUri`.
