# Demo video

The submitted video is a real run, not a mock-up:
- The simulator was recorded in headless Chrome while a local model (Qwen3.5 9B, MLX) drove the MCP server, with live Open Food Facts and TheMealDB data.
- The waits for the model were cut.
- The voices are local text-to-speech: Higgs Audio v3, "am_vigil" for the narrator and the user, "af_quill" for Alexa.
- Alexa's lines are exactly what the run returned. Every clip was checked against its script with Whisper.

## Script

| On screen | Audio |
|---|---|
| Title card | "Allergy Guard is an Alexa+ add-on for homes with food allergies, built on one rule. It never tells you a food is safe." |
| Simulator, idle | "This is a simulated Alexa+ on an Echo Show. A local model drives my MCP server, and the screen is the add-on's own MCP Apps view." |
| Voice turn | You: "Alexa, save Maya. She's allergic to peanuts and tree nuts." Alexa confirms. |
| Voice turn | You: "Leo from next door is coming on Saturday. He can't have dairy or celery." Alexa: "…guest Leo until Saturday 10 October: milk and celery." Narrator: guests drop off the list after their visit. |
| Voice turn: the lasagne verdict | You: "Check tonight's lasagne for Saturday." Alexa: "Leo should avoid this: it contains celery and milk…" Narrator: avoid for Leo, none listed for Maya, never "safe"; no dairy-free cheese swap, because it's often cashew-based and Maya can't have tree nuts. |
| Voice turn | You: "Add the swaps to my shopping list." Alexa: "Added fennel, coconut cream and nutritional yeast." |
| Voice turn: which product? | You: "Is Nutella OK for Maya?" Alexa: five products share the name; pick one on the screen or read the barcode. |
| Tap a product | Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing…" Narrator: a naive checker would call it allergen-free. |
| Demo button: by barcode | Alexa: avoid for both: tree nuts (hazelnut) for Maya, milk (milk powder) for Leo. Narrator: the record lists only nuts as an allergen, but the milk powder is in the ingredients. |
| Slide: keeping the model honest | The verdict lock and the no-tool guard, found by testing on a real model. |
| Slide: how it's built | MCP server (spec 2025-11-25, Streamable HTTP), MCP Apps screen built to the Alexa+ design guide, open-source engine, 42 tests. |

## Recording it yourself

Start the server with a model (see the README), clear `data/household.json`, open http://127.0.0.1:8787/, and follow the same turns by voice or by typing. The demo buttons give the same tool calls without a model.
