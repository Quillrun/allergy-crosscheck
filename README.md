# Allergy Guard for Alexa+

A household tells Alexa who is allergic to what, guests included. Allergy Guard then checks recipes and packaged foods against everyone at the table, explains the risk on an Echo Show screen, suggests swaps that don't trip anyone else's allergy, and puts them on the shopping list.

It is built around one rule: **when the data is missing, ambiguous or the lookup fails, the answer is "I can't confirm it's OK — treat it as unsafe", never a confident yes.** It never tells anyone a food is "safe".

- **Self-hosted MCP server**, MCP spec **2025-11-25**, **Streamable HTTP** (stateless), 9 tools.
- **MCP Apps view** (`ui://allergy-guard/verdict.html`, `text/html;profile=mcp-app`) for Echo Show: verdict banner, per-person results, flagged ingredients, swaps, tap-to-choose products.
- **Alexa+ simulator**: an LLM drives the server through a real MCP client, with browser voice in and out, and renders the MCP Apps view the way an Echo Show would.
- **Open-source engine** in [`packages/allergen-guard`](packages/allergen-guard): zero dependencies, MIT.

## Why fail-closed matters here

Open Food Facts, the open food database this uses, says its data comes with "no assurances that the data is accurate, complete, or reliable". Real records prove it. The main Nutella record lists only *nuts* as an allergen, while its own ingredient list contains *skimmed milk powder* and *soya lecithin*. A second Nutella record has no allergen or ingredient data at all. A naive checker would call that one allergen-free.

Allergy Guard:

| Situation | Answer |
|---|---|
| A listed allergen, in the tags **or** in the ingredient text | **Avoid** |
| "May contain" | **Avoid** |
| An ingredient that often hides allergens (sauce, stock, chocolate, lecithin…) | **Can't confirm** |
| Ingredient list missing, or not in English | **Can't confirm** |
| Database offline or timing out | **Can't confirm** |
| Product name matches several products | **Asks which one**, never guesses |
| Nobody's allergies saved, or an unknown name in "for" | Says so |
| Nothing found | "I didn't find *X* listed… check the label" |

In the simulator, a **verdict lock** applies: after a check, the spoken answer is the tool's own sentence, so the model can't soften "avoid" into "should be fine". There's a test for exactly that (`test/sim.test.ts`).

## Run it

Node 22.6 or newer. No build step.

```bash
npm install
npm start                     # MCP: http://127.0.0.1:8787/mcp   Simulator: http://127.0.0.1:8787/
```

Open the simulator and use the **demo script** buttons. They need no LLM. Each button is one MCP tool call.

To talk to it, point it at any OpenAI-compatible endpoint with tool calling:

```bash
LLM_BASE_URL=https://api.openai.com/v1 LLM_MODEL=gpt-4.1-mini LLM_API_KEY=... npm start
# or a local model: LLM_BASE_URL=http://127.0.0.1:11434/v1 LLM_MODEL=qwen3:14b npm start
```

| Variable | Default | |
|---|---|---|
| `PORT` / `HOST` | `8787` / `127.0.0.1` | |
| `DATA_FILE` | `data/household.json` | The household's profiles and shopping list |
| `ALLOWED_HOSTS` | — | Extra Host headers to accept, e.g. a tunnel hostname (DNS-rebinding guard) |
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` | — | Simulator voice mode |

### Connect a real MCP client

Any client that speaks Streamable HTTP works, for example the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector   # transport: Streamable HTTP, URL: http://127.0.0.1:8787/mcp
```

### Alexa+

The Alexa+ MCP Toolkit currently serves US accounts. To connect this server to Alexa+:

1. Expose it over HTTPS, e.g. `cloudflared tunnel --url http://127.0.0.1:8787`, and add the tunnel host to `ALLOWED_HOSTS`.
2. Scaffold an add-on with `alexa-ai new mcp` pointing at `https://<host>/mcp`, then `alexa-ai deploy`.
3. Test in the Alexa+ web simulator.

The simulator in this repo stands in for steps 2 and 3.

## Tools

| Tool | What it does |
|---|---|
| `save_person` | Save a household member or guest (with an optional last day) and their allergies; unknown allergies are rejected, not dropped |
| `remove_person`, `list_people` | Manage who is checked |
| `check_recipe` | Ingredients, or a dish name looked up on TheMealDB; verdict per person, flagged lines, household-aware swaps |
| `check_product` | By barcode or name (Open Food Facts); several matches → choices |
| `find_recipe` | Look up a dish's ingredient list |
| `add_to_shopping_list`, `get_shopping_list`, `remove_from_shopping_list` | Shopping list for the swaps |

Every tool result has a short `speech` line for voice, a `VERDICT:` line for the model, and `structuredContent` for the screen.

## Tests

```bash
npm test          # 34 tests: engine, store, MCP over Streamable HTTP, simulator verdict lock
npm run typecheck
```

The engine suite has a list of dangerous ingredients that must never come back as "nothing listed": peanut butter, pesto, ghee, soy sauce, Worcestershire, lupin flour and 41 more. It also has look-alikes that must not be flagged: butter beans, coconut milk, nutmeg, oyster mushrooms, eggplant. The MCP suite runs over real HTTP with the SDK client and confirms the negotiated protocol version is `2025-11-25`.

## Layout

```
packages/allergen-guard/   open-source engine: catalogue, fail-closed checks, swaps (MIT)
src/server/                MCP server: tools, MCP Apps resource, HTTP, household store, data sources
src/sim/agent.ts           simulated Alexa+ turn (LLM + MCP client + verdict lock)
public/widget.html         MCP Apps view (the Echo Show screen)
public/simulator.html      Echo Show-style simulator and MCP Apps host
test/                      integration tests
```

## Limits, stated plainly

- English ingredient text only. Products without it get "can't confirm".
- The ingredient dictionary is broad, but it's a dictionary. An allergen under a name it doesn't know won't be flagged. That's why every positive answer ends with "check the label".
- It isn't medical advice and isn't an emergency service.
- Product data: [Open Food Facts](https://world.openfoodfacts.org), ODbL. Recipes: [TheMealDB](https://www.themealdb.com), using its free development key.
