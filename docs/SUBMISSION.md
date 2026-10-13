# Devpost submission: paste sheet (Alexa+ track)

Field by field, in the order of the Devpost form. Facts match the repo as built. `<…>` marks what is still open. Nothing here is submitted, uploaded or published until the author does it.

## Project name
Allergy Crosscheck

## Elevator pitch (200 characters max)
An Alexa+ add-on that tells you who at the table can eat a dish or a scanned food, and why. Its results never say "safe": when the data is missing, they say "I can't confirm".

## Thumbnail
`docs/video/gallery/thumbnail.png` (3:2, for Devpost); `docs/video/gallery/thumbnail-16x9.png` for YouTube. The product name, the line "Who at the table can eat it, and why", the lasagne verdict card.

## About the project (paste as the story)

Who at the table can eat tonight's dinner, and why? Allergy Crosscheck answers that by voice and on the Echo Show screen, for the whole household and its guests, from a recipe or a scanned product. When the data can't back an answer, it says "I can't confirm" instead of guessing.

What is real and what is simulated: the MCP server, the allergen engine, the Echo Show screen and the phone scan are the shipped code; the Alexa+ host in the video is a simulator driven by a local model, because the MCP Toolkit is available in the United States and I am outside it (details under "Simulated Alexa+" below).

### Inspiration
Two real records from Open Food Facts, the open database behind many allergy apps. A chocolate hazelnut spread has an empty allergen list and no ingredient list, so a checker that trusts the list would call it allergen-free. A hot cocoa mix lists soy as its only allergen and milk only as a "may contain", while its ingredients include nonfat dry milk, whey and caseinate. A voice assistant that answers confidently from data like that is dangerous. One that knows when it doesn't know is useful.

This is common. I ran the engine over all 4,784,317 Open Food Facts records (snapshot of 7 October 2026). 72.3% of them list no allergens, no "may contain", and have no ingredient list. So do 53.2% of the products scanned in the Open Food Facts app. A checker that trusts the list would say "no allergens" for each one; this one says "can't confirm". Details: [`packages/allergen-guard/bench/README.md`](packages/allergen-guard/bench/README.md). Data: Open Food Facts (ODbL).

The stakes are high. In the US, about 1 in 15 adults (6.7%) and 1 in 19 children (5.3%) have a food allergy ([CDC, National Health Interview Survey, 2024 data](https://www.cdc.gov/nchs/pressroom/releases/20260108.html)). In national surveys, 42% of US children with a food allergy had been to an emergency room for it at least once ([Gupta 2018](https://pubmed.ncbi.nlm.nih.gov/30455345/)), and 51% of adults with one had had a severe reaction ([Gupta 2019](https://pubmed.ncbi.nlm.nih.gov/30646188/)). Two situations stand out: in a Dutch study of unexpected reactions, 44% came from pre-packaged products and 23% from meals eaten away from home, at friends' or relatives' homes, at school or in restaurants (preliminary results, [Michelsen-Huisman 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4412422/)). "May contain" labels don't settle it either: 46% of the food-allergy shoppers surveyed were unsure or wrongly believed those labels are required by law ([Marchisotto 2017](https://pubmed.ncbi.nlm.nih.gov/27818137/)). At home, the real question is whether a dish is OK for everyone at the table tonight.

Alexa+ already remembers a family's allergies. Amazon says it understands "your family's dietary preferences, allergies, and weekly traditions" ([Amazon](https://aboutamazon.com/news/devices/amazon-2025-devices-alexa-event-live-updates)). But remembering an allergy isn't the same as checking food for it.

### What it does
Allergy Crosscheck tells you who at the table can eat a dish or a product, and why. It checks recipes and scanned products against everyone at your table, guests included, and cross-checks a product's allergen list against its ingredient text. It treats missing data as unsafe: it says "I can't confirm" instead of "allergen-free". On the 1,552,376 products people have scanned in the Open Food Facts app, that gives a decisive answer (avoid, or no listed allergens) for 29.9% of records with a milk allergy, 22.9% with peanut and tree nuts, and 30.5% with milk and celery; among the 264,667 records that carry English ingredient text, 71.3%, 57.3% and 72.0% (measured on 12 October 2026, details in the engine's bench README).

Say Maya can't have peanuts or tree nuts, and Leo from next door, who can't have dairy or celery, is coming on Saturday. "Check tonight's lasagne" gives each of them a verdict on the Echo Show, names the risky ingredients, and suggests swaps checked against both of them, so a fix for Leo never trips Maya.

- **Household and guests:** who is allergic to what, with an end date for visitors. Guests stop being checked after their last day.
- **Recipes:** a dish name, looked up on TheMealDB, or ingredients read out. You get a verdict per person, the risky lines, and household-aware swaps that go onto a shopping list from the same ask.
- **Packaged food:** scan the barcode on your phone and ask "Can Maya have what I just scanned?", or say the name or the barcode. If several products match, it asks which one. It reads the Open Food Facts allergen tags, traces and ingredient text together, which is how it finds the cocoa mix's milk.
- **Fail-closed:** there are three answers: "Avoid", "Can't confirm" and "None listed, check the label". Never "safe". Missing, ambiguous or non-English data gives "Can't confirm". So does a recipe word it doesn't recognise ("I don't know what's in garam masala") and a failed lookup.

### How I built it
- **More than an API wrapper.** Amazon names a "basic MCP wrapper around an existing API" as the obvious Alexa+ idea ([rules](https://amazonappdev2026.devpost.com/rules)). Of the creative examples in the judging criteria, this builds three (an agentic workflow in one turn, state across sessions, MCP Apps) and part of one more (cards):
  - **State across sessions:** the household and dated guests are saved between conversations, and after their last day a guest stays listed, marked as ended, and is no longer checked (`src/server/store.ts`, `until`; `save_person` in `src/server/tools.ts`). The "what I just scanned" scan is kept for 30 minutes.
  - **Agentic workflow, in one turn:** one ask, "Check the lasagne for everyone, then add the swaps to my shopping list." (video 0:53), makes the model run `check_recipe`, read the swaps from its result and call `add_to_shopping_list` with exactly those three items, with no second prompt. Inside `check_recipe` the server, not the model, looks the dish up on TheMealDB, checks every ingredient for every person and proposes swaps checked against everyone; that part is deterministic code (`src/server/tools.ts`, `src/server/sources.ts`). `check_product` fetches packaged food from Open Food Facts the same way.
  - **MCP Apps:** the Echo Show screen, with tap-to-choose that calls back into the server (`public/widget.html`).
  - **Cards, partly:** the screen is made of card panels: "Who's eating", "Watch out for", "Swaps", "Which one?" and "Shopping list". These are HTML sections I drew inside the MCP Apps view, not Alexa+'s own card or carousel components, and there are no images or media.
  - **Not built:** purchasing, and Agent Skills.
  - **A cross-check, not a lookup:** a product's allergen tags, traces and ingredient text are read together, which is how the cocoa mix's "may contain milk" becomes a firm "contains milk" with the ingredients named.
- **Self-hosted MCP server** in TypeScript with the MCP TypeScript SDK 1.32. It uses MCP spec **2025-11-25** over **Streamable HTTP**, is stateless, and has 9 tools. Every check result (`check_recipe`, `check_product`) leads with a `VERDICT:` line, and every result carries the exact sentence to say, plus `structuredContent` for the screen.
- **MCP Apps screen** for the Echo Show (`text/html;profile=mcp-app`), following the Alexa+ MCP design guide's base canvas, zoom, touch-target and contrast figures, and using the `hostContext` fields theme, safeAreaInsets, maxWidth and maxHeight:
  - authored at the guide's 768×480 base canvas with its type, spacing and corner-radius tokens; the widget applies one root scale from `hostContext` maxWidth/maxHeight, 1.667 for the Echo Show 8's 1280×800 (guide figures), and each demo verdict fits both with no scrolling (measured in headless Chrome, not on a real Echo Show);
  - text is 14px or larger at the base canvas (my floor; the guide's type table goes lower), touch targets 48px at the base canvas (guide minimum: 48×48px), text contrast at least 4.5:1 (guide: 4.5:1 for text 17px and under, 3:1 for bold or 18px and larger);
  - it uses the host's theme and safe-area insets.

  Tapping a choice calls back into the server with `tools/call`. `_meta.ui.resourceUri` is on every tool definition and every result.
- **Voice design:** every spoken verdict names who, what and where it came from, because on a screenless Echo the sentence is all there is; the screen carries the full list. A verdict for two people runs about 11 to 14 seconds in the video; a shorter line would drop the ingredient names, which is the part a listener acts on.
- **Open-source engine, `allergen-guard`**, MIT, with zero dependencies. It covers the EU 14 and US Big 9 allergens, with wheat separate from gluten, and has an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish). Swaps declare their own allergens and are never a plant relative of what they replace. Coconut swaps (coconut cream for crème fraîche) are not treated as tree nuts: coconut is not among the EU's 14 allergens, and the FDA dropped it from its tree-nut list in its January 2025 allergen labeling guidance.
- **Phone scan page:** the camera reads the barcode with the browser's BarcodeDetector, or a WebAssembly decoder for Safari that the server serves itself. The server keeps the scan for 30 minutes as "what I just scanned".
- **Simulated Alexa+**, because the Alexa+ docs say the MCP Toolkit is available in the United States ([MCP Toolkit overview](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-overview.html)) and I'm outside the US; I did not attempt a deployment. An LLM drives the server through a real MCP client, and the browser handles voice and hosts the MCP Apps screen. The simulator adds two guards, as a test harness rather than part of the add-on:
  - a **verdict lock**: after a check or a change, the spoken answer is the tools' own sentences, verdicts first;
  - a **no-tool guard**: a keyword filter that blocks common verdict and action phrases when no tool has returned a result.

  On a real Alexa+, add-ons can't script speech. What ships is the server's side: every check result starts with a `VERDICT:` line, and every result carries the exact sentence to say. A verbatim hint for safety answers is the top feature request below.
- **158 automated tests** (93 of them in the engine package), including:
  - 54 ingredient–allergen pairs that must never pass (peanut butter, pesto, ghee, amaretto…);
  - look-alikes that must not be flagged;
  - MCP end to end over HTTP;
  - a fake model that tries to say "totally safe" and is overridden.
- Built with Claude Code as the coding agent.

### What was and wasn't tested
- **Tested:**
  - the 158 automated tests;
  - the full demo conversation, end to end in the simulator, on a local Qwen3.5 9B model with live data;
  - the scan page in headless Chrome, with a camera feed of a real barcode;
  - every demo screen, measured in headless Chrome at 768×480 (the guide's base canvas, dark and light) and at 1280×800 with the 1.667 root scale (dark theme only; the simulator's Echo Show 8 frame).
- **Not tested:**
  - a real Alexa+: the docs say the Toolkit is available in the United States, and I did not attempt a deployment from outside the US;
  - Amazon's Local Inspector. Even with a developer account, it installs from a private registry that needs an AWS account with access to an Amazon role (friction log 4).

### Challenges I ran into
- **Open data that contradicts itself.** The answer was never to trust allergen tags alone, and to scan the ingredient text too.
- **Words the engine didn't know.** Running it over Open Food Facts found six: "gluten", "milkfat", "butterfat", "crustaceans", "cereals containing gluten" and "E322". They are fixed now, each with a test.
- **Category tags and unreadable ingredients.** Open Food Facts also tags each label ingredient with its parent categories (rice flour is also "flour", peanut also "nut"), and read as words those added allergens the label never named. The engine now reads the label's own tags and skips a short list of generic categories: 57,571 records lose a false "contains". And when part of an ingredient list is not in English, it now says "can't confirm" instead of "none listed": 55,933 records (both figures from the 8 October run, on an earlier engine). The "allergen in the text but not in the list" count is not claimed: after ten pre-registered rounds of hand checks, the latest (round 10) found 99 of 100 checked records real (95% interval 94.6-99.8%) on a count of 8,298 records (2,069 app-scanned); the count is not claimed as exact. The 99 of 100 is round 10's hand check, at commit `17287f8`, before the 2026-10-11 engine fixes. An 11 October compare run at `0a1ceec` re-measured the count: 8,295 records (2,071 app-scanned), with no new hand check.
- **Plant-based names that contain dairy words** ("coconut yoghurt"). Swaps declare their own allergens instead of being re-parsed.
- **Voice answers have to be short without losing the reason.** Every verdict says who, what, and where it came from.
- **A real model behaves differently from a scripted one.** It said "Got it, I'll add Leo" without saving him, and answered a pesto question from memory; that led to the no-tool guard. It also made up shopping-list swaps until the turn history kept the tool results.

### Accomplishments that I'm proud of
- The server's results never call a food "safe"; the engine's tests check that, and a simulator test checks that a fake model's "totally safe" is overridden. On a real Alexa+ the spoken words are the model's.
- One spoken question checks everyone at the table, including a guest who drops off after the visit.
- In a real cocoa mix whose tags carry milk only as "may contain", it shows the milk is in the ingredients.
- It follows MCP spec 2025-11-25 over Streamable HTTP, with an MCP Apps screen authored at the Alexa+ 768×480 base canvas and checked in an Echo Show 8 simulator frame (untested on a real Echo Show).
- The language model runs locally (Qwen3.5 9B, 4-bit, MLX), with no cloud LLM API; product and recipe data come live from Open Food Facts and TheMealDB.

### What I learned
- An allergen list is a claim, not a fact. The ingredient text has to be read too.
- A model with tools still skips them. The guard has to be in code, not only in the prompt.
- Swaps need the same care as dishes. An early swap table offered fennel for celery, which is a plant relative and a known cross-reaction. Swaps are now tested against that.
- On a voice device the screen has to read at a glance. Grouping the cocoa mix's 11 flagged ingredients and its "may contain" warning into 4 rows mattered more than any colour.

### What's next for Allergy Crosscheck
- Deploying through the Alexa+ MCP Toolkit once it's available to my account.
- Scanning with the Echo Show's own camera, if add-ons get camera input.
- Ingredient text in more languages: Open Food Facts carries it, and the engine needs dictionaries.
- An allergist review of the dictionary and the swaps.

## Built with (tags)
alexa+, model-context-protocol, mcp-apps, streamable-http, typescript, node.js, open-food-facts, themealdb, web-speech-api, barcode-detector, mlx, qwen, claude-code

## Try it out (links)
- Code repository: <GitHub URL, once the author decides private or public>

## Video demo link
<YouTube URL, after the upload>. The file is `docs/video/allergy-crosscheck-demo.mp4` (2:41, 4K at 60 fps, recorded 12 October 2026), with captions in `docs/video/allergy-crosscheck-demo.srt`.

## Image gallery (upload in this order)
Files are in `docs/video/gallery/`, padded to 3:2.
1. `1-cannot-confirm.png`: "Missing product data: 'Can't confirm', never 'allergen-free'."
2. `2-lasagne-check.png`: "One question gives a verdict for everyone at the table, with swaps checked against all of them."
3. `3-product-check.png`: "The allergen tags say soy, and milk only as a 'may contain'. The ingredient text shows the milk is in it."
4. `4-phone-scan.png`: "Scan on your phone, then ask about 'what I just scanned'."
5. `5-sunday.png`: "A new session the day after: the household is remembered, the guest's visit is over."
6. `6-shopping-list.png`: "'Check the lasagne for everyone, then add the swaps to my shopping list': one ask: the check, the swaps, the list."

## Additional info (the hackathon's questions)

### Track
Alexa+

### Mini challenges
Open Source

### Code repository URL
<GitHub URL>

### Testing instructions
Node 22.6 or newer. Run `npm install && npm start`, then open http://127.0.0.1:8787/.

The demo-script buttons call the MCP tools directly and need no model or API key. They reproduce the video's checks:
- the spread with no ingredient list gives "Can't confirm";
- the cocoa mix whose tags carry milk only as "may contain" gives "Avoid" for Leo, with the milk ingredients named.

To talk to it, set `LLM_BASE_URL` and `LLM_MODEL` to any OpenAI-compatible endpoint with tool calling (see the README). Any MCP client can connect to `http://127.0.0.1:8787/mcp`. `npm test` runs the 158 tests.

### New or existing project
New: the repository's first commit is 4 October 2026, after the submission period opened on 31 August 2026 ([rules](https://amazonappdev2026.devpost.com/rules)).

### Product feedback (required)
For each tool: what it was used for, what worked, what needs work, onboarding, and whether I'd build with it again. Each issue also has a full entry, with severity, in the friction log (`docs/FRICTION_LOG.md`, seven entries).

**Alexa+ MCP Toolkit** (docs, MCP design guide, Local Inspector)
- **Used for:** the screen and voice rules (design guide), where Alexa+ reads `_meta.ui`, and the certification path (Local Inspector).
- **Worked well:** the design guide is concrete; its 768×480 base canvas, its 1.667 zoom for the Echo Show 8/15, its 48×48 touch targets and its contrast ratios shaped the screen; the widget uses the `hostContext` fields theme, safeAreaInsets, maxWidth and maxHeight. (The guide's type table lists sizes but sets no minimum text size.) Add-ons are plain MCP, so the whole server could be built and tested with standard MCP tools before any Alexa-specific step.
- **Needs work:**
  - The docs say the Toolkit is available in the United States; I did not attempt a deployment from outside the US and built a simulator instead of testing on a real Alexa+ (friction log 1).
  - There's no way to ask Alexa+ to speak a safety verdict verbatim: "You can't script what Alexa says" (2).
  - There's no automated way to test multi-turn conversations (3).
  - The Local Inspector isn't on public npm. It installs from a private registry that needs an AWS account, an IAM user and access to an Amazon role, and searching npm for `alexa-ai` finds an unrelated package (4).
  - The Alexa+ docs put `_meta.ui` in the tool call response, while the MCP Apps spec puts `resourceUri` on the tool definition. I did both (5).
- **Onboarding (zero to hello world):** a local MCP server came quickly, because it's the open standard. Hello world on Alexa+ itself, a deployed add-on answering in the web simulator, I did not attempt it from outside the US, because the docs say the Toolkit is available in the United States.
- **Would I build with it again?** <AUTHOR: yes or no, and why>

**MCP TypeScript SDK** (`@modelcontextprotocol/sdk` 1.32, with `zod` for tool inputs)
- **Used for:** the server (stateless Streamable HTTP, spec 2025-11-25, 9 tools), plus the MCP client in the simulator and the tests.
- **Worked well:** the server took a few lines, and the SDK client made end-to-end tests over real HTTP easy.
- **Needs work:** nothing blocking came up.
- **Onboarding:** `npm install`, register tools with a `zod` schema, serve over HTTP. No account or key.

**MCP Apps** ([spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx))
- **Used for:** the Echo Show screen (`ui://allergy-crosscheck/verdict.html`), including tap-to-choose that calls back into the server.
- **Worked well:** one HTML file and a small postMessage JSON-RPC bridge were enough for a full screen.
- **Needs work:** where `_meta.ui` goes (above, friction log 5). I couldn't check the screen on a real Alexa+, only in my host shim.
- **Onboarding:** the spec plus the Alexa+ design guide was enough to get a first screen. The host shim I built to test it is part of the simulator.

**Alexa developer console: Voice & Tone** (Test tab)
- **Used for:** Alexa's seven lines in the demo video, in Amazon's own Alexa voice.
- **Worked well:** the voice is the real one, and the page's own `getTTS` call returns the audio as a base64 MP3.
- **Needs work:** no export or download control, and the editor adds its own closing `</speak>` tag, so a typed one causes a 400 (friction log 6).
- **Onboarding:** the Test tab only opens once a skill exists, so I created an empty private skill for it. Account sign-up also rejected a diacritic in my legal name (friction log 7).

**Open Food Facts API**
- **Used for:** packaged products by barcode (`/api/v2/product`) and by name (`search.openfoodfacts.org`).
- **Worked well:** free, no key, and it carries allergen tags, traces and ingredient text in one record.
- **Needs work:** the data is volunteer-entered and sometimes contradicts itself or is empty (72.3% of records, above). That's why Allergy Crosscheck reads the tags and the ingredient text together, and fails closed.
- **Onboarding:** one `curl`; no sign-up.

**TheMealDB API**
- **Used for:** recipes by dish name (`search.php?s=`).
- **Worked well:** free, with a free development key, and ingredients and measures in one response.
- **Needs work:** ingredients come as 20 numbered fields (`strIngredient1`…), and the search matches on the name, so the code retries with leading words dropped when a full name isn't found ("shrimp pad thai" becomes "pad thai").
- **Onboarding:** one request with the public development key.

**Local model via MLX (Qwen3.5 9B, 4-bit)**
- **Used for:** the model that drives the simulator, so the demo needed no cloud LLM API (product and recipe data were live from Open Food Facts and TheMealDB).
- **Worked well:** it handled the full demo conversation end to end with tool calling.
- **Needs work:** a 9B model skipped tools: it said "Got it, I'll add Leo" without saving him, and answered a pesto question from memory (friction log 2). The simulator's two guards cover that.
- **Onboarding:** the simulator speaks any OpenAI-compatible endpoint; two environment variables, `LLM_BASE_URL` and `LLM_MODEL`.

**Web Speech API** (speech recognition and synthesis, in Chrome)
- **Used for:** voice in and out of the simulator.
- **Worked well:** no install and no key.
- **Needs work:** Chrome sends the audio to its own speech service, which the simulator page says.
- **Onboarding:** a few lines of browser JavaScript.

**BarcodeDetector API** (with the `barcode-detector` package as a WebAssembly fallback)
- **Used for:** the phone scan page, which reads a product's barcode with the camera.
- **Worked well:** the native API where the browser has it; the ponyfill fills the gap for Safari, served by the server itself.
- **Needs work:** not every browser has it, so a fallback is needed.
- **Onboarding:** a few lines, plus the camera permission.

**Qwen3-TTS** (1.7B Base, `mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit`, Apache 2.0, run locally with mlx-audio)
- **Used for:** the narrator and the user voices in the demo video, cloned from synthetic reference voices (`docs/DEMO.md`). Alexa's lines are Amazon's own voice, not Qwen.
- **Worked well:** <AUTHOR: what worked, for example voice quality or running it locally>
- **Needs work:** every clip was transcribed with Whisper and compared with its script, accepting a match of 0.93 or better; all 18 lines passed on the first seed. Output peaks were normalised to -1 dBFS on write (`docs/video/work/qwen_cast.py`). <AUTHOR: anything else that went wrong or was awkward>
- **Onboarding:** a model download and one script; the licence asks for nothing in the video. <AUTHOR: how long it took to set up>

**Claude Code**
- **Used for:** the coding agent for this repository (every commit carries a Claude co-author line).
- **Worked well / needs work:** <AUTHOR: one or two sentences on what Claude Code did well and badly on this project>

### Feature requests (optional)
- **Critical:** let developer accounts in any country use the web simulator for development-stage add-ons. The docs describe it as the end-to-end test path, and the Toolkit is documented as available in the United States; I did not attempt it from outside the US.
- **Critical:** a verbatim hint on tool results, such as `speech: { text, verbatim: true }`, for health and safety add-ons. A verdict must never be paraphrased into "should be fine".
- **Important:** scripted multi-turn conversation tests in the Local Inspector or the `alexa-ai` CLI. The bugs that mattered most only showed up across turns.
- **Important:** publish the Local Inspector and the `alexa-ai` CLI on public npm under the `@alexa-ai` scope, so it can run in CI and nobody installs an unscoped look-alike.
- **Important:** say which `_meta.ui` fields Alexa+ reads from `tools/list` and which from tool results. A server built only to the MCP Apps spec can pass every local test and still show no screen.

### Friction log (optional, up to a 10% bonus)
Paste `docs/FRICTION_LOG.md`: seven entries, in the format the rules ask for.

### Open Source mini-challenge
**NOTE TO AUTHOR, not form text:** Held: publishing waits for the owner's go.
- **Contribution URL:** <github.com/Quillrun/allergen-guard, after publishing>
- **Project repository URL:** <repository URL>
- **GitHub username:** Quillrun
- **What:** a zero-dependency TypeScript library for fail-closed allergen checks on recipes and packaged foods, covering the EU 14 and US Big 9 allergens.
- **How:**
  - an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish);
  - three verdicts, none of which is "safe";
  - product checks that read Open Food Facts allergen tags, traces and ingredient text together;
  - swaps filtered against everyone's allergies, and never a plant relative of what they replace.
- **Why it matters:** allergy features keep being rebuilt in apps and assistants, and the easy version (trust the allergen tags, answer "safe") is dangerous. This gives anyone a tested, fail-closed core. It has 92 tests of its own, including 54 ingredient–allergen pairs that must never pass. The Open Food Facts measurement (above) shows the failure it prevents. The engine is open source (MIT), so any allergy feature can start fail-closed.

## YouTube upload (not part of the Devpost form)
- **File:** `docs/video/allergy-crosscheck-demo.mp4` (2:41, 4K at 60 fps), with captions in `docs/video/allergy-crosscheck-demo.srt` (English).
- **Title:** Allergy Crosscheck: who at the table can eat it, and why (Alexa+ hackathon demo)
- **Visibility:** Public. The rules say "publicly visible", and Unlisted may not count. This is the author's call.
- **Altered or synthetic content:** yes. The voices are synthetic: Alexa's lines are Amazon's Alexa voice from the developer console; the narrator and the user are AI-generated.
- **Made for kids:** no. **Category:** Science & Technology.
- **Description:**

```
Allergy Crosscheck is an Alexa+ add-on, shown in a simulator, that tells you who at the table can eat it, and why: it checks recipes and scanned food for everyone, guests included. Its results never call a food "safe": when the data can't back an answer, it says "I can't confirm".

Built for Amazon's Build, Ship, Shape hackathon (Alexa+ track): a self-hosted MCP server (spec 2025-11-25, Streamable HTTP), an MCP Apps screen for the Echo Show, and an open-source allergen engine. The voices are synthetic. Product data: Open Food Facts (ODbL). Recipes: TheMealDB.

Code: <repository URL>

0:00 One in fifteen US adults has a food allergy
0:06 A record with no ingredient list: no list, no guess
0:18 Allergy Crosscheck's answer for it: "can't confirm"
0:27 The simulator
0:35 Saving the household and a guest
0:53 One ask: the lasagne checked for everyone, the swaps on the list
1:23 Scan on a phone: missing data means "can't confirm"
1:38 A cocoa mix: the tags say "may contain" milk, the ingredients show it is in
2:12 Sunday: the guest's visit is over
2:23 How it's built, and what the server ships
```

## Repository access (not part of the Devpost form)
Pick one:
- **Public:** the root `LICENSE` (MIT) is in place, so GitHub shows the licence in the About section, which the rules ask for. No other step.
- **Private:** on submission day, add these collaborators: `chris-trag`, `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`, and `testing@devpost.com`. GitHub invitations expire after 7 days, so don't add them earlier.

**GitHub About text:** An Alexa+ MCP server and Echo Show screen that tell you who at the table can eat it, and why. They check recipes and scanned food for everyone, and their results never call a food "safe".
**Topics:** alexa, alexa-plus, mcp, mcp-server, mcp-apps, food-allergy, allergens, open-food-facts, echo-show, typescript
