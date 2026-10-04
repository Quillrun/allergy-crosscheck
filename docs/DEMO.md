# Demo video

The submitted video is a real run, not a mock-up:
- The simulator was recorded in headless Chrome while a local model (Qwen3.5 9B, MLX) drove the MCP server, with live Open Food Facts and TheMealDB data.
- The waits for the model were cut.
- The voices are local text-to-speech with Qwen3-TTS 1.7B (Apache-2.0): one voice per role (Alexa, the narrator and you), each designed with the VoiceDesign model and cloned from that reference with the Base model.
- Alexa's lines are exactly what the run returned. Every clip was checked against its script with Whisper.
- Products are shown by their generic names from the records.

## Script

| On screen | Audio |
|---|---|
| A product record: chocolate hazelnut spread, allergens none listed, ingredients missing | "This is a real product record from Open Food Facts: a chocolate hazelnut spread, with an empty allergen list. A checker that only trusts that list would call it allergen-free." |
| Title card | "Allergy Guard is an Alexa+ add-on with one rule: it never tells you a food is safe." |
| Simulator, idle | "This is a simulated Alexa+ on an Echo Show. A local AI model drives my MCP server, and the screen is the add-on's MCP Apps view." |
| Voice turn | You: "Alexa, save Maya. She's allergic to peanuts and tree nuts." Alexa confirms. |
| Voice turn | You: "Leo from next door is coming on Saturday. He can't have dairy or celery." Alexa: "…guest Leo until Saturday 10 October: milk and celery." |
| Voice turn: the lasagne verdict, zooming on the cards | You: "Check tonight's lasagne for Saturday." Alexa: "Leo should avoid this: it contains celery and milk…" Narrator: avoid for Leo with the exact ingredients, nothing listed for Maya and still no "safe"; no dairy-free cheese swap, because it's often cashew-based and Maya can't have tree nuts. |
| Voice turn: the spread by barcode (0868030000236) | Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data…" Narrator: missing data never becomes "no allergens". |
| Voice turn: a hot cocoa mix by barcode (0050700000220) | Alexa: avoid for Leo (milk, in the whey, caseinate and lactose), can't confirm for Maya. Narrator: the record lists soy as its only allergen and milk only as a "may contain"; the ingredient text adds the milk. |
| Slide: keeping the model honest | The verdict lock and the no-tool guard, found by testing on a real model. |
| Slide: how it's built | MCP server (spec 2025-11-25, Streamable HTTP), MCP Apps screen built to the Alexa+ design guide, open-source engine, and its tests. |

## Recording it yourself

Start the server with a model (see the README), clear `data/household.json`, open http://127.0.0.1:8787/, and follow the same turns by voice or by typing. The demo buttons give the same tool calls without a model.
