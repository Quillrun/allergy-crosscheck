# Devpost submission: paste sheet (Alexa+ track)

Paths under `docs/video/` are local working files (video, stills, recording scripts) and are not in the repository.

Field by field, in the order of the Devpost form. Facts match the repo as built. `<…>` marks what is still open. Nothing here is submitted, uploaded or published until the author does it.

## Project name
Allergy Crosscheck

## Elevator pitch (200 characters max)
An Alexa+ add-on that tells you who at the table can eat a dish or a scanned food, and why. Its results never say "safe": when the data is missing, they say "I can't confirm".

## Thumbnail
`docs/video/gallery/thumbnail.png` (3:2, for Devpost); `docs/video/gallery/thumbnail-16x9.png` for YouTube. The product name, the line "Who at the table can eat it, and why", the lasagne verdict card.

## About the project (paste as the story)

Who at the table can eat tonight's dinner, and why? Allergy Crosscheck answers that by voice and on the Echo Show screen, for the whole household and its guests, from a recipe or a scanned product. When the data can't back an answer, it says "I can't confirm" instead of guessing.

What is real and what is simulated: the MCP server, the allergen engine, the Echo Show screen and the phone scan are the shipped code; the Alexa+ host in the video is a simulator driven by a local model, because Amazon's Alexa+ add-on tools are a partner-only preview that hackathon participants can't access (hackathon FAQ; details under "Simulated Alexa+" below).

**For the judges, in their four criteria**
- **Tech implementation:** self-hosted MCP server, spec 2025-11-25 over Streamable HTTP, 9 tools, MCP Apps screen with tap-to-choose; 205 automated tests, 99 in the engine.
- **Design:** one ask gives a verdict per person on the Echo Show screen and in speech, with the risky ingredients and swaps; guests expire; the screen is authored at the guide's 768×480 base canvas.
- **Potential impact:** 1 in 15 US adults has a food allergy. A real cocoa mix lists milk only as "may contain" while its ingredients hold nonfat dry milk, whey and caseinate; this catches it. 72.3% of the 4.8 million Open Food Facts records, and 53.2% of the products scanned in its app, carry no allergen data and no ingredient list, so the only honest answer is "can't confirm", and that is the answer, never "allergen-free". Where a record carries English ingredient text, it gives a decisive answer for 57 to 72% of records; across all products scanned in the US, 37.5 to 47.1%.
- **Quality of the idea:** three of Amazon's own "creative" examples built (agentic workflow in one turn, state across sessions, MCP Apps), and a cross-check that catches a real cocoa mix whose tags say milk is only "may contain".

### Inspiration
I have seen people close to me go through allergic reactions, and I have had one myself without ever finding out what caused it. That is where this started.

Then two real records from Open Food Facts, the open database behind many allergy apps. A chocolate hazelnut spread has an empty allergen list and no ingredient list, so a checker that trusts the list would call it allergen-free. A hot cocoa mix lists soy as its only allergen and milk only as a "may contain", while its ingredients include nonfat dry milk, whey and caseinate. A voice assistant that answers confidently from data like that is dangerous. One that knows when it doesn't know is useful.

This is common. I ran the engine over all 4,784,317 Open Food Facts records (snapshot of 7 October 2026). 72.3% of them list no allergens, no "may contain", and have no ingredient list. So do 53.2% of the products scanned in the Open Food Facts app. A checker that trusts the list would say "no allergens" for each one; this one says "can't confirm". Details: `packages/allergen-guard/bench/README.md` in the repository. Data: Open Food Facts (ODbL).

The stakes are high. In the US, about 1 in 15 adults (6.7%) and 1 in 19 children (5.3%) have a food allergy ([CDC, National Health Interview Survey, 2024 data](https://www.cdc.gov/nchs/pressroom/releases/20260108.html)). In national surveys, 42% of US children with a food allergy had been to an emergency room for it at least once ([Gupta 2018](https://pubmed.ncbi.nlm.nih.gov/30455345/)), and 51% of adults with one had had a severe reaction ([Gupta 2019](https://pubmed.ncbi.nlm.nih.gov/30646188/)). Two situations stand out: in a Dutch study of unexpected reactions, 44% came from pre-packaged products and 23% from meals eaten away from home, at friends' or relatives' homes, at school or in restaurants (preliminary results, [Michelsen-Huisman 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4412422/)). "May contain" labels don't settle it either: 46% of the food-allergy shoppers surveyed were unsure or wrongly believed those labels are required by law ([Marchisotto 2017](https://pubmed.ncbi.nlm.nih.gov/27818137/)). At home, the real question is whether a dish is OK for everyone at the table tonight.

Alexa+ already remembers a family's allergies. Amazon says it understands "your family's dietary preferences, allergies, and weekly traditions" ([Amazon](https://aboutamazon.com/news/devices/amazon-2025-devices-alexa-event-live-updates)). But remembering an allergy isn't the same as checking food for it.

### What it does
Allergy Crosscheck tells you who at the table can eat a dish or a product, and why. It checks recipes and scanned products against everyone at your table, guests included, and cross-checks a product's allergen list against its ingredient text. It treats missing data as unsafe: it says "I can't confirm" instead of "allergen-free". Among the 264,667 app-scanned Open Food Facts products that carry English ingredient text, that gives a decisive answer (avoid, or no listed allergens) for 71.3% of records with a milk allergy, 57.3% with peanut and tree nuts, and 72.0% with milk and celery (measured on 12 October 2026, details in the engine's bench README).

Say Maya can't have peanuts or tree nuts, and Leo from next door, who can't have dairy or celery, is coming on Saturday. "Check tonight's lasagne" gives each of them a verdict on the Echo Show, names the risky ingredients, and suggests swaps checked against both of them, so a fix for Leo never trips Maya.

- **Household and guests:** who is allergic to what, with an end date for visitors. Guests stop being checked after their last day, unless asked for by name.
- **Recipes:** a dish name, looked up on TheMealDB, or ingredients read out. You get a verdict per person, the risky lines, and household-aware swaps that go onto a shopping list from the same ask.
- **Packaged food:** scan the barcode on your phone and ask "Can Maya have what I just scanned?", or say the name or the barcode. If several products match, it asks which one. It reads the Open Food Facts allergen tags, traces and ingredient text together, which is how it finds the cocoa mix's milk.
- **Fail-closed:** there are three answers: "Avoid", "Can't confirm" and "None listed, check the label". Never "safe". Missing, ambiguous or non-English data gives "Can't confirm". So does a recipe word it doesn't recognise ("I don't know what's in garam masala") and a failed lookup. An unnamed "vegetable oil" or "flavouring" stays "Can't confirm" too, because either can carry an allergen the label never names; it is shown as a line to check rather than waved through.

### How I built it
- **More than an API wrapper.** Amazon names a "basic MCP wrapper around an existing API" as the obvious Alexa+ idea ([rules](https://amazonappdev2026.devpost.com/rules)). Of the creative examples in the judging criteria, this builds three (an agentic workflow in one turn, state across sessions, MCP Apps) and part of one more (cards):
  - **State across sessions:** the household and dated guests are saved between conversations, and after their last day a guest stays listed, marked as ended, and is no longer checked unless asked for by name (`src/server/store.ts`, `until`; `save_person` in `src/server/tools.ts`). The "what I just scanned" scan is kept for 30 minutes.
  - **Agentic workflow, in one turn:** one ask, "Check the lasagne for everyone, then add the swaps to my shopping list." (video 0:53), makes the model run `check_recipe`, read the swaps from its result and call `add_to_shopping_list` with exactly those three items, with no second prompt. Inside `check_recipe` the server, not the model, looks the dish up on TheMealDB, checks every ingredient for every person and proposes swaps checked against everyone; that part is deterministic code (`src/server/tools.ts`, `src/server/sources.ts`). `check_product` fetches packaged food from Open Food Facts the same way.
  - **MCP Apps:** the Echo Show screen, with tap-to-choose that calls back into the server (`public/widget.html`).
  - **Cards, partly:** the screen is made of card panels: "Who's eating", "Watch out for" (or "What I found" for a product) and "Swaps", plus a choice screen and a shopping-list screen. These are HTML sections I drew inside the MCP Apps view, not Alexa+'s own card or carousel components, and there are no images or media.
  - **Not built:** purchasing, and Agent Skills.
  - **A cross-check, not a lookup:** a product's allergen tags, traces and ingredient text are read together, which is how the cocoa mix's "may contain milk" becomes a firm "contains milk" with the ingredients named.
- **Self-hosted MCP server** in TypeScript with the MCP TypeScript SDK 1.32. It uses MCP spec **2025-11-25** over **Streamable HTTP**, uses a stateless Streamable HTTP transport (the household is stored server-side), and has 9 tools. Every verdict result (`check_recipe`, `check_product`) leads with a `VERDICT:` line (UNSAFE, CANNOT CONFIRM or NO LISTED ALLERGENS: the keys behind "Avoid", "Can't confirm" and "None listed"), and every result carries the exact sentence to say, plus `structuredContent` for the screen.
- **MCP Apps screen** for the Echo Show (`text/html;profile=mcp-app`), following the Alexa+ MCP design guide's base canvas, zoom, touch-target and contrast figures, and using the `hostContext` fields theme, safeAreaInsets, maxWidth and maxHeight:
  - authored at the guide's 768×480 base canvas with its type, spacing and corner-radius tokens; the widget applies one root scale from `hostContext` maxWidth/maxHeight, 1.667 for the Echo Show 8's 1280×800 (guide figures), and each demo verdict fits both with no scrolling (measured in headless Chrome, not on a real Echo Show);
  - text is 14px or larger at the base canvas (my floor; the guide's type table goes lower), touch targets 48px at the base canvas (guide minimum: 48×48px), text contrast at least 4.5:1 (guide: 4.5:1 for text 17px and under, 3:1 for bold or 18px and larger);
  - it uses the host's theme and safe-area insets.

  Tapping a choice calls back into the server with `tools/call`. `_meta.ui.resourceUri` is on every tool definition and every result.
- **Voice design:** every spoken verdict names who, what and up to three of the lines it came from, because on a screenless Echo the sentence is all there is; the screen carries the full list. A verdict for two people runs about 8 to 14 seconds in the video; a shorter line would drop the ingredient names, which is the part a listener acts on.
- **Open-source engine, `allergen-guard`**, MIT, with zero dependencies. It covers the EU 14 and US Big 9 allergens, with wheat separate from gluten, and has an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish). Swaps declare their own allergens and are never a plant relative of what they replace. Coconut swaps (coconut cream for crème fraîche) are not treated as tree nuts: coconut is not among the EU's 14 allergens, and the FDA dropped it from its tree-nut list in its January 2025 allergen labeling guidance.
- **Phone scan page:** the camera reads the barcode with the browser's BarcodeDetector, or a WebAssembly decoder for Safari that the server serves itself. The server keeps the scan for 30 minutes as "what I just scanned".
- **Simulated Alexa+**, because Amazon's Alexa+ add-on tools (MCP Toolkit, CLI, web simulator) are a preview for select partners, with no way for hackathon participants to get access (hackathon FAQ); the [MCP Toolkit overview](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-overview.html) also limits it to the United States. An LLM drives the server through a real MCP client, and the browser handles voice and hosts the MCP Apps screen. In the video, Alexa's lines are Amazon's own Alexa voice, rendered in the developer console from the exact text the run returned; the narrator and the user are synthetic voices (Qwen3-TTS). The simulator adds two guards, as a test harness rather than part of the add-on:
  - a **verdict lock**: after a check or a change, the spoken answer is the tools' own sentences, verdicts first;
  - a **no-tool guard**: a keyword filter that blocks common verdict and action phrases when no tool has returned a result.

  On a real Alexa+, add-ons can't script speech. What ships is the server's side: every check result starts with a `VERDICT:` line, and every result carries the exact sentence to say. A verbatim hint for safety answers is the top item in the product feedback's feature requests.
- **205 automated tests** (99 of them in the engine package), including:
  - 54 ingredient–allergen pairs that must never pass (peanut butter, pesto, ghee, amaretto…);
  - look-alikes that must not be flagged;
  - MCP end to end over HTTP;
  - a fake model that tries to say "totally safe" and is overridden.
- Built with Claude Code as the coding agent.

### What was and wasn't tested
- **Tested:**
  - the 205 automated tests;
  - the full demo conversation, end to end in the simulator, on a local Qwen3.5 9B model with live data;
  - the scan page in headless Chrome, with a camera feed of a real barcode;
  - every demo screen, measured in headless Chrome at 768×480 (the guide's base canvas, dark and light) and at 1280×800 with the 1.667 root scale (dark theme only; the simulator's Echo Show 8 frame).
- **Not tested:**
  - a real Alexa+: the tools are a partner-only preview that participants can't access (hackathon FAQ), so there was no deployment to test;
  - Amazon's Local Inspector. Even with a developer account, it installs from a private registry that needs an AWS account with access to an Amazon role (friction log 4).

### Challenges I ran into
- **Open data that contradicts itself.** The answer was never to trust allergen tags alone, and to scan the ingredient text too.
- **Words the engine didn't know.** Running it over Open Food Facts found six: "gluten", "milkfat", "butterfat", "crustaceans", "cereals containing gluten" and "E322". They are fixed now, each with a test.
- **Category tags and unreadable ingredients.** Open Food Facts also tags each label ingredient with its parent categories (rice flour is also "flour", peanut also "nut"), and read as words those added allergens the label never named. The engine now reads the label's own tags and skips a short list of generic categories: 57,571 records lose a false "contains". And when part of an ingredient list is not in English, it now says "can't confirm" instead of "none listed": 55,933 records (both figures from the 8 October run, on an earlier engine). The records whose ingredient text names an allergen their tags omit number about 8,300 (about 2,070 of them app-scanned); the last check, 100 records judged one by one by two independent AI agents with a re-check, found 99 real, and the count is not claimed as exact (bench README). The other direction, a "no listed allergens" answer that is wrong, was checked on 13 October: 100 such answers drawn at random from scanned products with English ingredient text, for three household profiles, judged by two independent AI agents with a re-check; none named the allergen in the ingredient text, which at 95% confidence is consistent with a miss rate of up to 3.7% (bench README).
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
- Code repository: https://github.com/Quillrun/allergy-crosscheck

## Video demo link
https://youtu.be/h2UmjFyHJ-M. The file is `docs/video/allergy-crosscheck-demo.mp4` (2:41, 4K at 60 fps, recorded 12 October 2026), captions burned in.

## Image gallery (upload in this order)
Files are in `docs/video/gallery/`, padded to 3:2.
1. `1-cannot-confirm.png`: "Missing product data: 'Can't confirm', never 'allergen-free'."
2. `2-lasagne-check.png`: "One question gives a verdict for everyone at the table, with swaps checked against all of them."
3. `3-product-check.png`: "The allergen tags say soy, and milk only as a 'may contain'. The ingredient text shows the milk is in it."
4. `4-phone-scan.png`: "Scan on your phone, then ask about 'what I just scanned'."
5. `5-sunday.png`: "A new session the day after: the household is remembered, the guest's visit is over."
6. `6-shopping-list.png`: "One ask fills the list with the three swaps, each checked against everyone. Coconut cream: not a tree nut (FDA, 2025)."

## Additional info (the hackathon's questions)

### Track
Alexa+

### Mini challenges
Open Source

### Code repository URL
https://github.com/Quillrun/allergy-crosscheck

### Testing instructions
Node 22.6 or newer. Run `npm install && npm start`, then open http://127.0.0.1:8787/.

The demo-script buttons call the MCP tools directly and need no model or API key. They reproduce the video's checks:
- the spread with no ingredient list gives "Can't confirm";
- the cocoa mix whose tags carry milk only as "may contain" gives "Avoid" for Leo, with the milk ingredients named.

To talk to it, set `LLM_BASE_URL` and `LLM_MODEL` to any OpenAI-compatible endpoint with tool calling (see the README). Any MCP client can connect to `http://127.0.0.1:8787/mcp`. `npm test` runs the 205 tests.

### New or existing project
New: the repository's first commit is 4 October 2026, after the submission period opened on 31 August 2026 ([rules](https://amazonappdev2026.devpost.com/rules)).

### Product feedback (required)
For each tool: what it was used for, what worked, what needs work, onboarding, and whether I'd build with it again. Each issue also has a full entry, with severity, in the friction log (`docs/FRICTION_LOG.md`, seven entries).

**Alexa+ MCP Toolkit** (docs, MCP design guide, Local Inspector)
- **Used for:** the screen and voice rules (design guide), where Alexa+ reads `_meta.ui`, and the certification path (Local Inspector).
- **Worked well:** the design guide is concrete; its 768×480 base canvas, its 1.667 zoom for the Echo Show 8/15, its 48×48 touch targets and its contrast ratios shaped the screen; the widget uses the `hostContext` fields theme, safeAreaInsets, maxWidth and maxHeight. (The guide's type table lists sizes but sets no minimum text size.) Add-ons are plain MCP, so the whole server could be built and tested with standard MCP tools before any Alexa-specific step.
- **Needs work:**
  - The Toolkit, CLI and web simulator are a partner-only preview that participants can't access (hackathon FAQ), while the Toolkit overview says only that it is available in the United States; so the add-on was built against a simulator instead of a real Alexa+ (friction log 1).
  - There's no way to ask Alexa+ to speak a safety verdict verbatim: "You can't script what Alexa says" (2).
  - There's no automated way to test multi-turn conversations (3).
  - The Local Inspector isn't on public npm. It installs from a private registry that needs an AWS account, an IAM user and access to an Amazon role, and searching npm for `alexa-ai` finds an unrelated package (4).
  - The Alexa+ docs put `_meta.ui` in the tool call response, while the MCP Apps spec puts `resourceUri` on the tool definition. I did both (5).
- **Onboarding (zero to hello world):** a local MCP server came quickly, because it's the open standard. Hello world on Alexa+ itself, a deployed add-on answering in the web simulator, isn't open to participants: the tools are a partner-only preview (hackathon FAQ).
- **Would I build with it again?** Yes. Add-ons are plain MCP, so the server was built and tested with the standard SDK and clients I already use, and the design guide gave concrete figures to build the screen to.

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
- **Worked well:** it ran locally, and all 18 lines passed the Whisper check on the first seed.
- **Needs work:** nothing blocking. Every clip was transcribed with Whisper and compared with its script, accepting a match of 0.93 or better; output peaks above -1 dBFS were limited to -1 dBFS on write.
- **Onboarding:** a model download and one script; the licence asks for nothing in the video.

**Claude Code**
- **Used for:** the coding agent for this repository (every commit carries a Claude co-author line).

### Feature requests (optional)
- **Critical:** open the web simulator and the Local Inspector preview to hackathon and individual developer accounts, in any country. The docs describe the simulator as the end-to-end test path, and today it is available to select partners only (hackathon FAQ), with the overview adding a US limit.
- **Critical:** a verbatim hint on tool results, such as `speech: { text, verbatim: true }`, for health and safety add-ons. A verdict must never be paraphrased into "should be fine".
- **Important:** scripted multi-turn conversation tests in the Local Inspector or the `alexa-ai` CLI. The bugs that mattered most only showed up across turns.
- **Important:** publish the Local Inspector and the `alexa-ai` CLI on public npm under the `@alexa-ai` scope, so it can run in CI and nobody installs an unscoped look-alike.
- **Important:** say which `_meta.ui` fields Alexa+ reads from `tools/list` and which from tool results. A server built only to the MCP Apps spec can pass every local test and still show no screen.

### Friction log (optional, up to a 10% bonus)
Paste `docs/FRICTION_LOG.md`: seven entries, in the format the rules ask for.

### Open Source mini-challenge
- **Contribution URL:** https://github.com/Quillrun/allergen-guard
- **Project repository URL:** https://github.com/Quillrun/allergy-crosscheck
- **GitHub username:** Quillrun
- **What:** a zero-dependency TypeScript library for fail-closed allergen checks on recipes and packaged foods, covering the EU 14 and US Big 9 allergens.
- **How:**
  - an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish);
  - three verdicts, none of which is "safe";
  - product checks that read Open Food Facts allergen tags, traces and ingredient text together;
  - swaps filtered against everyone's allergies, and never a plant relative of what they replace.
- **Why it matters:** allergy features keep being rebuilt in apps and assistants, and the easy version (trust the allergen tags, answer "safe") is dangerous. This gives anyone a tested, fail-closed core. It has 99 tests of its own, including 54 ingredient–allergen pairs that must never pass. The Open Food Facts measurement (above) shows the failure it prevents. The engine is open source (MIT), so any allergy feature can start fail-closed.
