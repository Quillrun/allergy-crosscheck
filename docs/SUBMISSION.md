# Devpost submission draft: Alexa+ track

Edit freely before submitting. Facts below match the repo as built.

## Name
Allergy Guard: a fail-closed allergy checker for Alexa+

## Tagline
Tell Alexa who's allergic to what. It checks recipes and products for everyone at the table, and never says "safe".

## What it does
A household tells Alexa who is allergic to what, guests included, with an end date for visitors. Allergy Guard then checks:

- **Recipes**: a dish name, or ingredients read out. It shows a verdict per person on the Echo Show screen, highlights the risky ingredients, and suggests swaps. Each swap is checked against everyone's allergies, so a fix for one person never trips another.
- **Packaged foods**, from Open Food Facts. Scan the barcode on the phone scan page and ask "Can Maya have what I just scanned?", or say the name or the barcode. If a name matches several products, it asks which one instead of guessing. With no recent scan, it asks for one.

The swaps go onto a shopping list.

The core rule is fail-closed. When data is missing, ambiguous, not in English, or the lookup fails, the answer is "I can't confirm it's OK, treat it as unsafe". So is any recipe word the engine doesn't recognise ("I don't know what's in garam masala"). Even a clean result ends with "check the label".

## Why
Food allergies are a high-stakes decision made several times a day, often with flour on your hands. About 33 million people in the US have at least one food allergy, including 1 in 13 children, and about 40% of children with food allergies have more than one. Every 10 seconds, a reaction sends someone in the US to an emergency room ([FARE](https://www.foodallergy.org/resources/facts-and-statistics)). At home, the real question is whether a dish is OK for everyone at the table. The open data behind most allergy apps is volunteer-entered. In Open Food Facts, one chocolate hazelnut spread has an empty allergen list and no ingredients, and a hot cocoa mix lists soy as its only allergen while its ingredients include nonfat dry milk, whey and caseinate. A voice assistant that answers confidently from data like that is dangerous. One that knows when it doesn't know is useful.

Alexa+ already remembers a family's allergies. Amazon says it understands "your family's dietary preferences, allergies, and weekly traditions" ([Amazon](https://aboutamazon.com/news/devices/amazon-2025-devices-alexa-event-live-updates)). But remembering an allergy isn't the same as checking food for it. Allergy Guard checks each person against the actual recipe or product record, and says so when the record can't support an answer.

## How it's built
- Self-hosted MCP server in TypeScript using the MCP TypeScript SDK 1.32. It negotiates MCP spec **2025-11-25** over **Streamable HTTP** (stateless) and exposes 9 tools.
- An **MCP Apps** view (`text/html;profile=mcp-app`, MCP Apps 2026-01-26) as the Echo Show screen, with tap-to-choose that calls back into the server via `tools/call`. It follows the Alexa+ MCP design guide:
  - for a typical household, the verdict, the risky ingredients and the swaps fit one screen;
  - text is 16px or larger, touch targets 48px, contrast at least 4.5:1 in both themes;
  - it uses the host's theme, device class and safe-area insets;
  - it has no links out of the view.

  Every tool result carries `_meta.ui.resourceUri`, because Alexa+ reads it from the response, and each tool has `invoking`/`invoked` status lines.
- An open-source engine, `allergen-guard`, with zero dependencies and an MIT licence. It covers the EU 14 and US Big 9 allergens, with wheat separate from gluten, plus an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish). Product checks read allergen tags, traces, the English ingredient text and the ingredient taxonomy together.
- A simulated Alexa+ experience: any OpenAI-compatible LLM drives the server through a real MCP client. The browser does voice in and out and acts as the MCP Apps host. A **verdict lock** makes the spoken answer after a check the tool's own sentence, so the model can't soften it. A **no-tool guard** stops the model answering allergy questions from memory: without a tool call it may ask, never assert. Tested end to end on a local Qwen3.5 9B model.
- A phone scan page: the camera reads the barcode (the browser's BarcodeDetector, or a WebAssembly decoder for Safari, served by the server itself, never a CDN), and the server keeps the scan for 30 minutes as "what I just scanned".
- 58 automated tests:
  - 54 ingredient–allergen pairs that must never pass (peanut butter, pesto, ghee, amaretto…);
  - look-alikes that must not be flagged;
  - end-to-end MCP over HTTP;
  - a test where a fake model tries to say "totally safe" and is overridden;
  - a test where a fake model answers from memory without a tool and is replaced.
- Built with Claude Code as the coding agent.

## What was and wasn't tested
- **Tested:**
  - 58 automated tests;
  - the scan page in headless Chrome with a camera feed of a barcode, then "what I just scanned" through the real model;
  - the full demo conversation, end to end in the simulator on a local Qwen3.5 9B model with live data;
  - the screen in headless Chrome, in both themes.
- **Not tested:** a real Alexa+ (the Toolkit is US-only) and Amazon's Local Inspector (it installs through the Developer Console).
- The verdict lock and no-tool guard are simulator-side. On real Alexa+ the defence is the server's `VERDICT:` line and exact speech sentence, plus the tool descriptions, because add-ons can't script what Alexa says. I've asked Amazon for a verbatim hook in the friction log.

## Video
<YouTube or Vimeo URL>. The file is `docs/video/allergy-guard-demo.mp4` (2:51). Captions are in `allergy-guard-demo.srt`; upload them with the video.

Put this line near the top of the YouTube description (the Higgs licence requires a visible credit):
> This audio was created with Boson AI's Higgs Audio — https://www.boson.ai/higgs-audio

## Try it (judges)
`npm install && npm start`, then open http://127.0.0.1:8787/. The demo buttons call the MCP tools directly and need no model or API key. To talk to it, set `LLM_BASE_URL` and `LLM_MODEL` to any OpenAI-compatible endpoint with tool calling (see the README). Any MCP client can connect to `http://127.0.0.1:8787/mcp`.

## Built during the hackathon
All of it: the repository's first commit is 4 October 2026, after the submission period opened on 31 August 2026.

## Challenges
- Open data that contradicts itself. The answer was never to trust allergen tags alone and to scan ingredient text too.
- Plant-based names that contain dairy words ("coconut yoghurt"). Swaps declare their own allergens explicitly instead of being re-parsed.
- Voice has to be short, but it can't lose the reason. Every verdict says who, what, and where it came from.
- A real model, unlike a scripted one, said "Got it, I'll add Leo" without saving him, and answered a pesto question from memory. That led to the no-tool guard. It also made up shopping-list swaps until the turn history kept the tool results.

## What's next
- Scanning from the Echo Show's own camera, if add-ons get camera input.
- Ingredient text in more languages: Open Food Facts carries them, and the engine needs dictionaries.
- Deploying through the Alexa+ MCP Toolkit once available on a supported account.
- Allergist-reviewed dictionary entries.

## Product feedback (required)
Per tool: what it was used for, what worked, what needs work, onboarding, and whether I'd build with it again. Each issue has a full entry, with severity, in the friction log (`docs/FRICTION_LOG.md`, five entries).

**Alexa+ MCP Toolkit** (docs, MCP design guide, Local Inspector)
- **Used for:** the screen and voice rules (design guide), where Alexa+ reads `_meta.ui`, and the certification path (Local Inspector).
- **Worked well:** the design guide is concrete. Its sizes, contrast and density rules reshaped the screen. Add-ons are plain MCP, so the whole server could be built and tested with standard MCP tools before any Alexa-specific step.
- **Needs work:**
  - The Toolkit is US-only, so from outside the US I built a simulator instead of testing on a real Alexa+ (friction log 1).
  - There's no way to ask Alexa+ to speak a safety verdict verbatim: "You can't script what Alexa says" (2).
  - There's no automated way to test multi-turn conversations (3).
  - The Local Inspector installs only through a Developer Console login, not public npm, and searching npm for `alexa-ai` finds an unrelated package (4).
  - The Alexa+ docs put `_meta.ui` in the tool call response, while the MCP Apps spec puts `resourceUri` on the tool definition. I did both (5).
- **Onboarding (zero to hello world):** a local MCP server came quickly, because it's the open standard. Hello world on Alexa+ itself, a deployed add-on answering in the web simulator, wasn't reachable from outside the US.
- **Would I build with it again?** <AUTHOR: yes or no, and why>

**MCP TypeScript SDK**
- **Used for:** the server (stateless Streamable HTTP, spec 2025-11-25), plus the MCP client in the simulator and the tests.
- **Worked well:** the server took a few lines, and the SDK client made end-to-end tests over real HTTP easy.
- **Needs work:** nothing blocking came up.

**MCP Apps**
- **Used for:** the Echo Show screen, including tap-to-choose that calls back into the server.
- **Worked well:** one HTML file and a small postMessage JSON-RPC bridge were enough for a full screen.
- **Needs work:** where `_meta.ui` goes (above).

**Open Food Facts API and TheMealDB API**
- **Used for:** product data by barcode or name, and recipes by dish name.
- **Worked well:** both are free to develop against: Open Food Facts needs no key, and TheMealDB has a free development key.
- **Needs work:** Open Food Facts data is volunteer-entered and sometimes contradicts itself. That's why Allergy Guard reads the allergen tags and the ingredient text together, and fails closed.

## Feature requests (optional)
- **Critical:** let developer accounts in any country use the web simulator for development-stage add-ons. It's the only end-to-end test path, and it was closed to me.
- **Critical:** a verbatim hint on tool results, such as `speech: { text, verbatim: true }`, for health and safety add-ons. A verdict must never be paraphrased into "should be fine".
- **Important:** scripted multi-turn conversation tests in the Local Inspector or the `alexa-ai` CLI. The bugs that mattered most only showed up across turns.
- **Important:** publish the Local Inspector and the `alexa-ai` CLI on public npm under the `@alexa-ai` scope, for CI and so nobody installs an unscoped look-alike.
- **Important:** say which `_meta.ui` fields Alexa+ reads from `tools/list` and which from tool results. A server built only to the MCP Apps spec can pass every local test and still show no screen.

## Open Source mini-challenge
- **Project:** `allergen-guard`, published as its own repository. <add the URL once it exists>
- **What:** a zero-dependency TypeScript library for fail-closed allergen checks on recipes and packaged foods. It covers the EU 14 and US Big 9 allergens.
- **How:**
  - an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish);
  - three verdicts, none of which is "safe";
  - product checks that read Open Food Facts allergen tags, traces and ingredient text together;
  - swaps filtered against everyone's allergies.
- **Why:** allergy features keep being rebuilt in apps and assistants, and the easy version (trust the allergen tags, answer "safe") is dangerous. This gives anyone a tested, fail-closed core. It has 21 tests of its own, including 54 ingredient–allergen pairs that must never pass.

## Built with
Alexa+ (simulated), Model Context Protocol (MCP), MCP TypeScript SDK, MCP Apps, TypeScript, Node.js, Open Food Facts API, TheMealDB API, Web Speech API, barcode-detector (WebAssembly fallback), Qwen3.5 9B via MLX (local model for the simulator), Claude Code

## Repository access (a note for submitting, not part of the text)
Pick one:
- **Public:** add an open-source LICENSE file at the repository root. GitHub then shows the licence in the About section, which the rules ask for. No other step.
- **Private:** on submission day, add these collaborators: `chris-trag`, `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`, and `testing@devpost.com`. GitHub invitations expire after 7 days, so don't add them earlier.
