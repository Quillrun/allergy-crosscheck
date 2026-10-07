# Friction log

Each entry is something that happened while building Allergy Crosscheck. Format: task, steps, expected vs actual, severity, workaround, suggestion. Where an entry has a time cost, it has a "Time lost" line that says how it was worked out. "Observed" means I saw it happen. "The docs say" means I read it and could not check it myself.

## 1. Testing on a real Alexa+ from outside the US

- **Task:** test the add-on end to end in the Alexa+ web simulator.
- **Steps:**
  1. Read the MCP Toolkit overview: https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-overview.html
  2. Read the QuickStart: https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html (the `addon.json` schema reference).
  3. Read "Test Your MCP Add-ons": https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-test-add-ons.html
  4. Stop there. I did not try a deployment (see Actual).
- **Expected:** any developer account can deploy a development add-on and talk to it in the web simulator, without publishing.
- **Actual:** not run, so this entry is unverified by design. The docs say:
  - overview: "The MCP Toolkit is available in the United States";
  - QuickStart sample: `"distributionCountries": ["US"]`;
  - testing page: "You must deploy your add-on before you can test it".

  I'm outside the US, so I didn't attempt a deployment and can't say what Amazon would have done.
- **Severity:** high, if the docs mean what they say. It blocks the only end-to-end test path.
- **Workaround:** I built a simulator. A local LLM drives the server through the MCP TypeScript SDK client over Streamable HTTP, and a host shim renders the MCP Apps view in an Echo Show-sized frame.
- **Suggestion:** let developer accounts in any country use the web simulator for development-stage add-ons, with distribution still limited to supported countries. Or ship the simulator as a local tool next to the Local Inspector.

## 2. Making a safety-critical answer reach the user unchanged

- **Task:** make sure "Leo should avoid this: it contains milk" is never spoken as "should be fine".
- **Steps:**
  1. Read the MCP Design Guide: https://developer.amazon.com/docs/alexaplus/add-ons/mcp-addon-design-guide.html
  2. Start the simulator against a real model, not a scripted fake: `LLM_BASE_URL=http://127.0.0.1:8080/v1 LLM_MODEL=mlx-community/Qwen3.5-9B-4bit npm start` (Qwen3.5 9B, 4-bit, MLX).
  3. Open http://127.0.0.1:8787/ and type the demo conversation from `docs/DEMO.md`, turn by turn. The turns used here:
     - "Alexa, save Maya. She's allergic to peanuts and tree nuts."
     - "Leo from next door is coming on Saturday. He can't have dairy or celery."
     - "Check tonight's lasagne for Saturday."
     - "Can Maya eat this pesto?"
  4. Watch which tool calls the model makes for each turn.
- **Expected:** a way for a tool to mark one sentence as "speak this verbatim".
- **Actual:** the guide says "You can't script what Alexa says". In my runs the real model also:
  - said "Got it, I'll add Leo" without calling the save tool;
  - answered "can Maya eat this pesto?" from its own knowledge without calling the check tool.

  In both cases no check ran, so no verdict could be enforced. These were observed in my simulator with a 9B local model. Alexa+'s own model may behave differently; I couldn't test it.
- **Severity:** high for health and safety add-ons (allergies, medication, recalls). Low for most others.
- **Workaround:**
  - Every tool result leads with `VERDICT:` and `Say to the user: …` lines, and the tool descriptions tell the model to repeat verdicts exactly.
  - In my simulator I added two guards that Alexa+ doesn't offer: a verdict lock (after a check, the spoken answer is the tool's sentence) and a no-tool guard (without a tool call the model may ask a question but not state anything).
- **Suggestion:**
  - Support a `_meta` hint on tool results, for example `speech: { text, verbatim: true }`, that Alexa+ honours or at least only shortens.
  - Have certification test that safety verdicts survive paraphrase.

## 3. No automated multi-turn conversation testing

- **Task:** catch regressions in how a conversation uses the tools across turns.
- **Steps:**
  1. Read "Test Your MCP Add-ons": https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-test-add-ons.html
  2. Read the Local Inspector page: https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-local-inspector.html
  3. Look for a way to script a conversation: utterances in, assertions on tool calls and spoken text out.
  4. Run the demo conversation by hand in my own simulator (`npm start`, then http://127.0.0.1:8787/), and compare each turn's tool calls with the turn before.
- **Expected:** a scripted conversation test: utterances in, assertions on which tools were called and what was spoken, runnable in CI.
- **Actual:**
  - The Local Inspector docs describe an agent-driven run: the coding agent initializes the MCP session, lists the tools, calls them (you confirm the parameters before each call) and writes `inspection-summary.json` (per-tool results) and `certification-verdict.json`. The page doesn't mention scripted multi-turn conversations. I haven't run the Inspector (entry 4), so this comes from the docs, not from a run.
  - The "Test Your MCP Add-ons" page describes the web simulator as a way to "interact with your add-on through text", which reads as manual testing. Same caveat: from the docs.
  - Observed in my own simulator: the bugs that mattered most only showed up across turns. Example: "add the swaps to my list" added made-up items because the previous turn's tool result was missing from the model's context.
- **Severity:** medium.
- **Workaround:** the simulator's `/sim/turn` endpoint plus a script that runs the whole demo conversation against a real model and prints each tool call and spoken line.
- **Suggestion:** a conversation-test mode in the Local Inspector or the `alexa-ai` CLI: a YAML list of turns, expected tool calls and spoken-text assertions, run against a deployed or local add-on.

## 4. Getting the Local Inspector

- **Task:** run the Local Inspector's certification check against the server.
- **Steps:**
  1. Run `npm view @alexa-ai/addon-local-inspector`.
  2. Read the Local Inspector page: https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-local-inspector.html. Its "Installation" section says to log in to the Developer Console and follow the Getting Started guide.
  3. Create a developer account (7 October 2026) and log in to the Developer Console.
  4. Read the setup page: https://developer.amazon.com/docs/alexaplus/add-ons/set-up-your-development-environment.html
  5. Search npm for "alexa-ai".
- **Expected:** a public npm package, so it can run in CI like the MCP Inspector (`npx @modelcontextprotocol/inspector`).
- **Actual:**
  - `npm view` returns 404, and installation goes through a Developer Console login.
  - The setup page asks for more: an AWS account, an IAM user with access keys, and a role (`AddOn3PDeveloperToolsRead`) for CodeArtifact access. It says to use "the AWS account that you provided to the Alexa Solutions Architect". So the inspector stayed out of reach.
  - Searching npm for "alexa-ai" returns an unscoped `alexa-ai` package from an unrelated third party (a WhatsApp bot), which someone could install by mistake.
- **Severity:** medium. It adds a manual step and a supply-chain trap.
- **Workaround:** tested with my own integration tests, which drive the server through the MCP TypeScript SDK client over real HTTP. Run them with `npm test`.
- **Suggestion:** publish the inspector and the `alexa-ai` CLI publicly under the `@alexa-ai` scope. Put the exact `npm i -g @alexa-ai/...` command in the docs, so nobody guesses an unscoped name.

## 5. Where `_meta.ui` goes: tool definition or tool result?

- **Task:** link each tool to the MCP Apps screen so Alexa+ renders it.
- **Steps:**
  1. Read the MCP Apps spec (2026-01-26). It puts `_meta.ui.resourceUri` on the tool definition in `tools/list`.
  2. Read "Alexa+ MCP Client and App Lifecycle": https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-client-lifecycle.html
  3. Compare where each document puts `_meta.ui`.
  4. Put `resourceUri` in both places and add a test that checks both.
- **Expected:** one place, consistent with the MCP Apps spec.
- **Actual:**
  - The Alexa+ page shows `_meta.ui` with `resourceUri`, `invoking` and `invoked` under "MCP tool call response payload", and says custom visuals render "as long as you have `resourceUri` defined in the tool response".
  - From the docs, a server built only to the MCP Apps spec could pass every local test and still show no screen on Alexa+. I couldn't confirm this on a real Alexa+.
  - The `invoking` text sits in the tool call response in the docs' example. A response comes after the tool has run, so it's unclear when Alexa+ would show "Searching hotels..." (the docs' example). The page doesn't say, and I couldn't observe it without a real Alexa+.
- **Severity:** medium. Easy to miss, and silent when wrong.
- **Workaround:** `resourceUri` on every tool definition and every tool result, and `invoking`/`invoked` on the definitions. A test checks both.
- **Suggestion:** state explicitly which `_meta.ui` fields Alexa+ reads from `tools/list` and which from `tools/call` results, and when `invoking` is shown. Have the Local Inspector warn when a tool result lacks `resourceUri`.

## 6. Getting Alexa's own voice for a demo video

- **Task:** render five Alexa lines in Alexa's real voice for the demo video.
- **Steps:**
  1. Sign in at https://developer.amazon.com/alexa/console/ask.
  2. Click "Create Skill" and create a private skill named "AG voice test". It exists only so the Test tab opens.
  3. Open the Test tab, then the "Voice & Tone" tab.
  4. Click the SSML editor, select all, type `<speak>Got it. I'll check everything for Maya: peanuts and tree nuts.</speak>`, and click "Play".
  5. Read the network log.
  6. Clear the editor, type `<speak>Got it. I'll check everything for Maya: peanuts and tree nuts.` (no closing tag), and click "Play" again.
  7. Repeat for the other four lines.
- **Expected:** a typed `</speak>` is accepted, and I can export the rendered audio for a video.
- **Actual:**
  - Step 4: the request `POST https://developer.amazon.com/alexa/console/ask/test/getTTS` returned status 400. The editor adds its own closing tag, so my typed line ended up with two (read back from the editor). I didn't read the 400 response body, so the link between the two is my reading.
  - Step 6: with no typed closing tag, the editor held a single `</speak>` and `getTTS` returned 200 with `audioFiles`, a base64 MP3.
  - I found no download or export control. The only labelled button I listed on the page was "Play". Icon-only controls and menus weren't checked. The audio was available only as the network response.
- **Severity:** low. It has a workaround and only affects people who need the audio outside the console.
- **Workaround:** I kept each line's audio from the page's own `getTTS` response and decoded the base64 MP3 into files, one line at a time.
- **Time lost:** about 12 minutes, from clicking "Create Skill" (19:02 UTC) to the fifth captured line (19:14 UTC), from the session transcript's timestamps. It includes a pause of about a minute for an unrelated question.
- **Suggestion:** add an export or download button for the rendered audio in Voice & Tone, or offer a TTS preview API for developers. Document that the editor adds the closing `</speak>` tag.

## 7. Developer account sign-up: a name with a non-US letter

- **Task:** create the Amazon developer account (7 October 2026).
- **Steps:**
  1. Open https://developer.amazon.com/settings/console/registration
  2. In the full legal name field, type a name containing a diacritic.
  3. Pick a country outside the US.
- **Expected:** the field accepts the legal name as written.
- **Actual:** the field rejected the diacritic. I saw this during the run. I didn't save the error text, so I can't quote it.
- **Severity:** low. It has a workaround.
- **Workaround:** I typed the name with a plain "t" in place of the diacritic.
- **Suggestion:** accept Unicode letters in name fields, or say which characters are allowed next to the field.
