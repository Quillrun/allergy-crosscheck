# Devpost submission: paste sheet (Alexa+ track)

Field by field, in the order of the Devpost form. Facts match the repo as built. `<…>` marks what is still open. Nothing here is submitted, uploaded or published until AUTHOR does it.

## Project name
Allergy Crosscheck

## Elevator pitch (200 characters max)
An Alexa+ add-on that checks recipes and scanned food for everyone at the table and says who can eat it, and why. It never says "safe": if the data can't back an answer, it says "I can't confirm".

## Thumbnail
`docs/video/gallery/thumbnail.png` (3:2).

## About the project (paste as the story)

### Inspiration
Two real records from Open Food Facts, the open database behind many allergy apps. A chocolate hazelnut spread has an empty allergen list and no ingredient list, so a checker that trusts the list would call it allergen-free. A hot cocoa mix lists soy as its only allergen, while its ingredients include nonfat dry milk, whey and caseinate. A voice assistant that answers confidently from data like that is dangerous. One that knows when it doesn't know is useful.

This is common. I ran the engine over all 4,784,317 Open Food Facts records (snapshot of 7 October 2026). 72.3% of them list no allergens, no "may contain", and have no ingredient list. So do 53.2% of the products scanned in the Open Food Facts app. A checker that trusts the list would say "no allergens" for each one; this one says "can't confirm". Details: [`packages/allergen-guard/bench/README.md`](packages/allergen-guard/bench/README.md). Data: Open Food Facts (ODbL).

The stakes are high. About 33 million people in the US have at least one food allergy, including 1 in 13 children ([FARE](https://www.foodallergy.org/resources/facts-and-statistics)). In national surveys, 42% of US children with a food allergy had been to an emergency room for it at least once ([Gupta 2018](https://pubmed.ncbi.nlm.nih.gov/30455345/)), and 51% of adults with one had had a severe reaction ([Gupta 2019](https://pubmed.ncbi.nlm.nih.gov/30646188/)). Two situations stand out: in a Dutch study of unexpected reactions, 44% came from pre-packaged products and 23% from meals eaten away from home, at friends' or relatives' homes, at school or in restaurants (preliminary results, [Michelsen-Huisman 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4412422/)). "May contain" labels don't settle it either: 46% of the food-allergy shoppers surveyed were unsure or wrongly believed those labels are required by law ([Marchisotto 2017](https://pubmed.ncbi.nlm.nih.gov/27818137/)). At home, the real question is whether a dish is OK for everyone at the table tonight.

Alexa+ already remembers a family's allergies. Amazon says it understands "your family's dietary preferences, allergies, and weekly traditions" ([Amazon](https://aboutamazon.com/news/devices/amazon-2025-devices-alexa-event-live-updates)). But remembering an allergy isn't the same as checking food for it.

### What it does
Allergy Crosscheck tells you who at the table can eat a dish or a product, and why. It checks recipes and scanned products against everyone at your table, guests included, and cross-checks a product's allergen list against its ingredient text. It treats missing data as unsafe: it says "I can't confirm" instead of "allergen-free".

Say Maya can't have peanuts or tree nuts, and Leo from next door, who can't have dairy or celery, is coming on Saturday. "Check tonight's lasagne" gives each of them a verdict on the Echo Show, names the risky ingredients, and suggests swaps checked against both of them, so a fix for Leo never trips Maya.

- **Household and guests:** who is allergic to what, with an end date for visitors. Guests drop off the list after their visit.
- **Recipes:** a dish name, looked up on TheMealDB, or ingredients read out. You get a verdict per person, the risky lines, and household-aware swaps that go onto a shopping list.
- **Packaged food:** scan the barcode on your phone and ask "Can Maya have what I just scanned?", or say the name or the barcode. If several products match, it asks which one. It reads the Open Food Facts allergen tags, traces and ingredient text together, which is how it finds the cocoa mix's milk.
- **Fail-closed:** there are three answers: "Avoid", "Can't confirm" and "None listed, check the label". Never "safe". Missing, ambiguous or non-English data gives "Can't confirm". So does a recipe word it doesn't recognise ("I don't know what's in garam masala") and a failed lookup.

### How I built it
- **More than an API wrapper.** Amazon names a "basic MCP wrapper around an existing API" as the obvious Alexa+ idea. This is built on the creative ones on its list:
  - **state across sessions:** the household and dated guests are kept between conversations, and guests drop off after their visit;
  - **orchestration across services:** one spoken question looks the dish up on TheMealDB, checks every person, and suggests swaps checked against everyone; the next puts them on the shopping list;
  - **MCP Apps:** an Echo Show screen with a verdict per person and tap-to-choose that calls back into the server;
  - **a cross-check, not a lookup:** a product's allergen tags, traces and ingredient text are read together, which is how it finds the milk that the cocoa mix's tags leave out.
- **Self-hosted MCP server** in TypeScript with the MCP TypeScript SDK 1.32. It uses MCP spec **2025-11-25** over **Streamable HTTP**, is stateless, and has 9 tools. Every result leads with a `VERDICT:` line and the exact sentence to say, plus `structuredContent` for the screen.
- **MCP Apps screen** for the Echo Show (`text/html;profile=mcp-app`), built to the Alexa+ MCP design guide:
  - each verdict fits one screen at Echo Show 8 size;
  - text is 16px or larger, touch targets 48px, contrast at least 4.5:1;
  - it uses the host's theme and safe-area insets.

  Tapping a choice calls back into the server with `tools/call`. `_meta.ui.resourceUri` is on every tool definition and every result.
- **Open-source engine, `allergen-guard`**, MIT, with zero dependencies. It covers the EU 14 and US Big 9 allergens, with wheat separate from gluten, and has an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish). Swaps declare their own allergens and are never a plant relative of what they replace.
- **Phone scan page:** the camera reads the barcode with the browser's BarcodeDetector, or a WebAssembly decoder for Safari that the server serves itself. The server keeps the scan for 30 minutes as "what I just scanned".
- **Simulated Alexa+**, because the Alexa+ MCP Toolkit is US-only and I'm outside the US. An LLM drives the server through a real MCP client, and the browser handles voice and hosts the MCP Apps screen. The simulator adds two guards, as a test harness rather than part of the add-on:
  - a **verdict lock**: after a check, the spoken answer is the tool's own sentence;
  - a **no-tool guard**: without a tool call, the model may ask but never assert.

  On a real Alexa+, add-ons can't script speech. What ships is the server's side: every result starts with a `VERDICT:` line and the exact sentence to say. A verbatim hint for safety answers is the top feature request below.
- **69 automated tests** (32 in the engine package), including:
  - 54 ingredient–allergen pairs that must never pass (peanut butter, pesto, ghee, amaretto…);
  - look-alikes that must not be flagged;
  - MCP end to end over HTTP;
  - a fake model that tries to say "totally safe" and is overridden.
- Built with Claude Code as the coding agent.

### What was and wasn't tested
- **Tested:**
  - the 69 automated tests;
  - the full demo conversation, end to end in the simulator, on a local Qwen3.5 9B model with live data;
  - the scan page in headless Chrome, with a camera feed of a real barcode;
  - every demo screen, measured at Echo Show 8 size in headless Chrome.
- **Not tested:**
  - a real Alexa+, because the Toolkit is US-only;
  - Amazon's Local Inspector. Even with a developer account, it installs from a private registry that needs an AWS account with access to an Amazon role (friction log 4).

### Challenges I ran into
- **Open data that contradicts itself.** The answer was never to trust allergen tags alone, and to scan the ingredient text too.
- **Words the engine didn't know.** Running it over Open Food Facts found six: "gluten", "milkfat", "butterfat", "crustaceans", "cereals containing gluten" and "E322". They are fixed now, each with a test.
- **Category tags and unreadable ingredients.** Open Food Facts also tags each label ingredient with its parent categories (rice flour is also "flour", peanut also "nut"), and read as words those added allergens the label never named. The engine now reads the label's own tags and skips a short list of generic categories: 57,571 records lose a false "contains". And when part of an ingredient list is not in English, it now says "can't confirm" instead of "none listed": 55,933 records. A hand check of the "allergen in the text but not in the list" count found 16 of 40 hits real, 16 false and 8 unclear, so I don't claim that number.
- **Plant-based names that contain dairy words** ("coconut yoghurt"). Swaps declare their own allergens instead of being re-parsed.
- **Voice answers have to be short without losing the reason.** Every verdict says who, what, and where it came from.
- **A real model behaves differently from a scripted one.** It said "Got it, I'll add Leo" without saving him, and answered a pesto question from memory; that led to the no-tool guard. It also made up shopping-list swaps until the turn history kept the tool results.

### Accomplishments that I'm proud of
- It never says "safe", and tests enforce that, including one where a fake model tries.
- One spoken question checks everyone at the table, including a guest who drops off after the visit.
- It finds the milk in a real cocoa mix whose allergen tags miss it.
- It follows MCP spec 2025-11-25 exactly over Streamable HTTP, with an MCP Apps screen that fits an Echo Show.
- The whole demo runs on a local 9B model, with no cloud API.

### What I learned
- An allergen list is a claim, not a fact. The ingredient text has to be read too.
- A model with tools still skips them. The guard has to be in code, not only in the prompt.
- Swaps need the same care as dishes. An early swap table offered fennel for celery, which is a plant relative and a known cross-reaction. Swaps are now tested against that.
- On a voice device the screen has to read at a glance. Grouping a product's 13 flagged ingredients into 4 rows mattered more than any colour.

### What's next for Allergy Crosscheck
- Deploying through the Alexa+ MCP Toolkit once it's available to my account.
- Scanning with the Echo Show's own camera, if add-ons get camera input.
- Ingredient text in more languages: Open Food Facts carries it, and the engine needs dictionaries.
- An allergist review of the dictionary and the swaps.

## Built with (tags)
alexa+, model-context-protocol, mcp-apps, typescript, node.js, open-food-facts, themealdb, web-speech-api, barcode-detector, mlx, qwen, claude-code

## Try it out (links)
- Code repository: <GitHub URL, once AUTHOR decides private or public>

## Video demo link
<YouTube URL, after the upload>. The file is `docs/video/allergy-crosscheck-demo.mp4` (2:56, 4K at 60 fps, recorded 8 October 2026), with captions in `docs/video/allergy-crosscheck-demo.srt`.

## Image gallery (upload in this order)
Files are in `docs/video/gallery/`, padded to 3:2.
1. `1-cannot-confirm.png`: "Missing product data: 'Can't confirm', never 'allergen-free'."
2. `2-lasagne-check.png`: "One question gives a verdict for everyone at the table, with swaps checked against all of them."
3. `3-product-check.png`: "The allergen tags say soy; the ingredient text adds the milk."
4. `4-phone-scan.png`: "Scan on your phone, then ask about 'what I just scanned'."

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
- the cocoa mix whose tags miss the milk gives "Avoid" for Leo.

To talk to it, set `LLM_BASE_URL` and `LLM_MODEL` to any OpenAI-compatible endpoint with tool calling (see the README). Any MCP client can connect to `http://127.0.0.1:8787/mcp`. `npm test` runs the 69 tests.

### New or existing project
New: the repository's first commit is 4 October 2026, after the submission period opened on 31 August 2026.

### Product feedback (required)
For each tool: what it was used for, what worked, what needs work, onboarding, and whether I'd build with it again. Each issue also has a full entry, with severity, in the friction log (`docs/FRICTION_LOG.md`, seven entries).

**Alexa+ MCP Toolkit** (docs, MCP design guide, Local Inspector)
- **Used for:** the screen and voice rules (design guide), where Alexa+ reads `_meta.ui`, and the certification path (Local Inspector).
- **Worked well:** the design guide is concrete; its sizes, contrast and density rules reshaped the screen. Add-ons are plain MCP, so the whole server could be built and tested with standard MCP tools before any Alexa-specific step.
- **Needs work:**
  - The Toolkit is US-only, so from outside the US I built a simulator instead of testing on a real Alexa+ (friction log 1).
  - There's no way to ask Alexa+ to speak a safety verdict verbatim: "You can't script what Alexa says" (2).
  - There's no automated way to test multi-turn conversations (3).
  - The Local Inspector isn't on public npm. It installs from a private registry that needs an AWS account, an IAM user and access to an Amazon role, and searching npm for `alexa-ai` finds an unrelated package (4).
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
- **Worked well:** both are free to develop against. Open Food Facts needs no key, and TheMealDB has a free development key.
- **Needs work:** Open Food Facts data is volunteer-entered and sometimes contradicts itself. That's why Allergy Crosscheck reads the allergen tags and the ingredient text together, and fails closed.

### Feature requests (optional)
- **Critical:** let developer accounts in any country use the web simulator for development-stage add-ons. It's the only end-to-end test path, and it was closed to me.
- **Critical:** a verbatim hint on tool results, such as `speech: { text, verbatim: true }`, for health and safety add-ons. A verdict must never be paraphrased into "should be fine".
- **Important:** scripted multi-turn conversation tests in the Local Inspector or the `alexa-ai` CLI. The bugs that mattered most only showed up across turns.
- **Important:** publish the Local Inspector and the `alexa-ai` CLI on public npm under the `@alexa-ai` scope, so it can run in CI and nobody installs an unscoped look-alike.
- **Important:** say which `_meta.ui` fields Alexa+ reads from `tools/list` and which from tool results. A server built only to the MCP Apps spec can pass every local test and still show no screen.

### Friction log (optional, up to a 10% bonus)
Paste `docs/FRICTION_LOG.md`: seven entries, in the format the rules ask for.

### Open Source mini-challenge
**Held: publishing waits for the owner's go.**
- **Contribution URL:** <github.com/Quillrun/allergen-guard, after publishing>
- **Project repository URL:** <repository URL>
- **GitHub username:** Quillrun
- **What:** a zero-dependency TypeScript library for fail-closed allergen checks on recipes and packaged foods, covering the EU 14 and US Big 9 allergens.
- **How:**
  - an ingredient dictionary with exclusions (peanut butter isn't dairy; oyster mushrooms aren't shellfish);
  - three verdicts, none of which is "safe";
  - product checks that read Open Food Facts allergen tags, traces and ingredient text together;
  - swaps filtered against everyone's allergies, and never a plant relative of what they replace.
- **Why it matters:** allergy features keep being rebuilt in apps and assistants, and the easy version (trust the allergen tags, answer "safe") is dangerous. This gives anyone a tested, fail-closed core. It has 32 tests of its own, including 54 ingredient–allergen pairs that must never pass. The Open Food Facts measurement (above) shows the failure it prevents.

## YouTube upload (not part of the Devpost form)
- **File:** `docs/video/allergy-crosscheck-demo.mp4` (2:56, 4K at 60 fps), with captions in `docs/video/allergy-crosscheck-demo.srt` (English).
- **Title:** Allergy Crosscheck: who at the table can eat it, and why (Alexa+ hackathon demo)
- **Visibility:** Public. The rules say "publicly visible", and Unlisted may not count. This is AUTHOR's call.
- **Altered or synthetic content:** yes. The voices are synthetic: Alexa's lines are Amazon's Alexa voice from the developer console; the narrator and the user are AI-generated.
- **Made for kids:** no. **Category:** Science & Technology.
- **Description** (the first line is the credit the Higgs licence requires):

```
This audio was created with Boson AI's Higgs Audio — https://www.boson.ai/higgs-audio

Allergy Crosscheck is an Alexa+ add-on, shown in a simulator, that checks recipes and scanned food for everyone at the table, guests included, and tells you who can eat it, and why. It never says "safe": when the data can't back an answer, it says "I can't confirm".

Built for Amazon's Build, Ship, Shape hackathon (Alexa+ track): a self-hosted MCP server (spec 2025-11-25, Streamable HTTP), an MCP Apps screen for the Echo Show, and an open-source allergen engine. The voices are synthetic. Product data: Open Food Facts (ODbL). Recipes: TheMealDB.

Code: <repository URL>

0:00 The problem: a record with an empty allergen list
0:17 What it does: who at the table can eat it, and why
0:32 Saving the household and a guest
0:54 Checking tonight's lasagne for everyone
1:31 Scan on a phone: missing data means "can't confirm"
1:57 A cocoa mix whose tags miss the milk
2:26 Keeping the model honest
2:39 How it's built
```

## Repository access (not part of the Devpost form)
Pick one:
- **Public:** the root `LICENSE` (MIT) is in place, so GitHub shows the licence in the About section, which the rules ask for. No other step.
- **Private:** on submission day, add these collaborators: `chris-trag`, `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`, and `testing@devpost.com`. GitHub invitations expire after 7 days, so don't add them earlier.

**GitHub About text:** A fail-closed allergy checker for Alexa+: an MCP server and Echo Show screen that tell you who at the table can eat it, and why. They check recipes and scanned food for everyone, and never say "safe".
**Topics:** alexa, alexa-plus, mcp, mcp-server, mcp-apps, food-allergy, allergens, open-food-facts, echo-show, typescript
