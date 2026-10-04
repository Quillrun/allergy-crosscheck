# Devpost submission draft: Alexa+ track

Edit freely before submitting. Facts below match the repo as built.

## Name
Allergy Guard: a fail-closed allergy checker for Alexa+

## Tagline
Tell Alexa who's allergic to what. It checks recipes and products for everyone at the table, and never says "safe".

## What it does
A household tells Alexa who is allergic to what, guests included, with an end date for visitors. Allergy Guard then checks:

- **Recipes**: a dish name, or ingredients read out. It shows a verdict per person on the Echo Show screen, highlights the risky ingredients, and suggests swaps. Each swap is checked against everyone's allergies, so a fix for one person never trips another.
- **Packaged foods** by name or barcode, from Open Food Facts. If a name matches several products, it asks which one instead of guessing.

The swaps go onto a shopping list.

The core rule is fail-closed. When data is missing, ambiguous, not in English, or the lookup fails, the answer is "I can't confirm it's OK, treat it as unsafe". Even a clean result ends with "check the label".

## Why
Food allergies are a high-stakes decision made several times a day, often with flour on your hands. The open data behind most allergy apps is volunteer-entered. The main Nutella record lists only nuts as an allergen, with milk at most a "may contain" trace, while its own ingredient list contains skimmed milk powder and soy lecithin. Another Nutella record has no ingredient data at all. A voice assistant that answers confidently from data like that is dangerous. One that knows when it doesn't know is useful.

## How it's built
- Self-hosted MCP server in TypeScript using the MCP TypeScript SDK 1.32. It negotiates MCP spec **2025-11-25** over **Streamable HTTP** (stateless) and exposes 9 tools.
- An **MCP Apps** view (`text/html;profile=mcp-app`, MCP Apps 2026-01-26) as the Echo Show screen, with tap-to-choose that calls back into the server via `tools/call`. It follows the Alexa+ MCP design guide:
  - the verdict, the risky ingredients and the swaps fit one screen;
  - text is 16px or larger, touch targets 48px, contrast at least 4.5:1 in both themes;
  - it uses the host's theme, device class and safe-area insets;
  - it has no links out of the view.

  Every tool result carries `_meta.ui.resourceUri`, because Alexa+ reads it from the response, and each tool has `invoking`/`invoked` status lines.
- An open-source engine, `allergen-guard`, with zero dependencies and an MIT licence. It covers the EU 14 and US Big 9 allergens, with wheat separate from gluten, plus an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish). Product checks read allergen tags, traces, the English ingredient text and the ingredient taxonomy together.
- A simulated Alexa+ experience: any OpenAI-compatible LLM drives the server through a real MCP client. The browser does voice in and out and acts as the MCP Apps host. A **verdict lock** makes the spoken answer after a check the tool's own sentence, so the model can't soften it. A **no-tool guard** stops the model answering allergy questions from memory: without a tool call it may ask, never assert. Tested end to end on a local Qwen3.5 9B model.
- 39 automated tests:
  - 47 dangerous ingredients that must never pass;
  - look-alikes that must not be flagged;
  - end-to-end MCP over HTTP;
  - a test where a fake model tries to say "totally safe" and is overridden;
  - a test where a fake model answers from memory without a tool and is replaced.
- Built with Claude Code as the coding agent.

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
- Barcode scanning from the Alexa app's camera.
- Ingredient text in more languages: Open Food Facts carries them, and the engine needs dictionaries.
- Deploying through the Alexa+ MCP Toolkit once available on a supported account.
- Allergist-reviewed dictionary entries.

## Product feedback (required)
- **Alexa+ MCP Toolkit:**
  - The Toolkit is US-only, so from outside the US I built a simulator instead of testing on a real Alexa+.
  - The design guide is concrete and useful. Its sizes, contrast and density rules reshaped the screen.
  - Two gaps: no automated way to test multi-turn conversations, and no way to ask Alexa+ to speak a safety verdict verbatim ("You can't script what Alexa says").
  - The docs put `_meta.ui` in the tool call response, while the MCP Apps spec puts `resourceUri` on the tool definition. I did both.
  - The Local Inspector is only available through a Developer Console login, not public npm.
- **MCP Apps:** one HTML file and a small postMessage JSON-RPC bridge were enough for a full screen with a tap that calls back into the server.
- **MCP TypeScript SDK:** the stateless Streamable HTTP server took a few lines, and the SDK client made end-to-end tests over real HTTP easy.
- **Friction log:** five entries, in the format the rules ask for, in `docs/FRICTION_LOG.md`.

## Open Source mini-challenge
- **Project:** `allergen-guard`, published as its own repository. <add the URL once it exists>
- **What:** a zero-dependency TypeScript library for fail-closed allergen checks on recipes and packaged foods. It covers the EU 14 and US Big 9 allergens.
- **How:**
  - an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish);
  - three verdicts, none of which is "safe";
  - product checks that read Open Food Facts allergen tags, traces and ingredient text together;
  - swaps filtered against everyone's allergies.
- **Why:** allergy features keep being rebuilt in apps and assistants, and the easy version (trust the allergen tags, answer "safe") is dangerous. This gives anyone a tested, fail-closed core. It has 15 tests of its own, including a list of dangerous ingredients that must never pass.

## Built with
TypeScript, Node.js, MCP TypeScript SDK, MCP Apps, Open Food Facts API, TheMealDB API, Web Speech API, Qwen3.5 9B via MLX (local model for the simulator), Claude Code
