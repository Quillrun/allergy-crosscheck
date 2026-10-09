# Demo video

The submitted video (2:56, 3840×2160 at 60 fps, recorded 8 October 2026) is a real run, not a mock-up:
- The simulator was recorded in headless Chrome while a local model (Qwen3.5 9B, MLX) drove the MCP server, with live Open Food Facts and TheMealDB data.
- The waits for the model were cut.
- Frames were captured losslessly at 2× device scale (Chrome DevTools screencast) and encoded once at the end, so the text stays sharp at 4K.
- Alexa's lines are Amazon's own Alexa voice, rendered in the Alexa developer console (a private test skill, Test tab, Voice & Tone) from the exact text the run returned.
- The narrator and the user are local text-to-speech with Boson AI's Higgs Audio (Higgs TTS 3), used under its Creator Use Grant, from reference voices made for this project, so no real person's voice is imitated.
- Credit, as the licence asks: "This audio was created with Boson AI's Higgs Audio — https://www.boson.ai/higgs-audio".
- Alexa's lines are exactly what the run returned. Every clip was checked against its script with Whisper.
- The simulator renders the widget in a 944×590 frame (the simulator's own size, not an Echo Show spec) and scales it to fill the video frame.
- Products are shown by their generic names from the records.
- The phone scans were recorded with Chrome's fake camera showing an image of each product's real barcode; the scan page decoded them live.

## Script

| On screen | Audio |
|---|---|
| A product record: chocolate hazelnut spread, allergens none listed, ingredients missing | "This is a real product record from Open Food Facts: a chocolate hazelnut spread, with an empty allergen list. A checker that only trusts that list would call it allergen-free." Then: "It's not rare: more than half the products scanned in the Open Food Facts app look like this." On screen: "53% of products scanned in the Open Food Facts app look like this". |
| Title card | "Allergy Crosscheck is an Alexa+ add-on that checks food for everyone at the table, and tells you who can eat it, and why." |
| Simulator, idle | "This is a simulated Alexa+ on an Echo Show, driven by a local AI model through my MCP server." |
| Voice turn | User: "Alexa, save Maya. She's allergic to peanuts and tree nuts." Alexa confirms. |
| Voice turn | User: "Leo from next door is coming on Saturday. He can't have dairy or celery." Alexa: "…guest Leo until Saturday 10 October: milk and celery." Narrator: "Guests stop being checked after their last day." |
| Voice turn: the lasagne verdict, zooming on the cards | User: "Check tonight's lasagne for Saturday." Alexa: "Leo should avoid this: it contains celery and milk…" Narrator: "For Leo, it's avoid, with the exact ingredients." "For Maya, none of her allergens are listed. That's the yes, as far as the data goes." (zoom on "Who's eating"). No dairy-free cheese swap, because it's often cashew-based and Maya can't have tree nuts. |
| Phone scan: the spread's barcode, on the scan page | Narrator: "You can read out a barcode, but it's tedious. Scan it on your phone instead, then just ask." |
| Voice turn | User: "Can Maya and Leo have what I just scanned?" Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data…" Narrator: missing data never becomes "no allergens". |
| Phone scan: a hot cocoa mix | (the scan page finds it) |
| Voice turn | User: "And this one I just scanned?" Alexa: avoid for Leo (milk, in the whey, caseinate and lactose), can't confirm for Maya. Narrator: the record lists soy as its only allergen and milk only as a "may contain"; the ingredient text adds the milk. |
| Slide: test harness in my simulator | "Testing on a real model, I caught it claiming to save a guest it never saved. So every check result starts with the verdict and every result carries the exact sentence to say, and my simulator holds the model to it, word for word." |
| Slide: how it's built | Narration: "A self-hosted MCP server, an MCP Apps screen built to the Alexa+ design guide, and an open-source allergen engine, with tests that try to trick it into saying safe." (Accuracy note: the screen's measured layout is checked against a 944x590 test frame, not yet the guide's canvas.) Last line: "Allergy Crosscheck: who at the table can eat it, and why." |

## Recording it yourself

Start the server with a model (see the README), clear `data/household.json`, open http://127.0.0.1:8787/, and follow the same turns by voice or by typing. The demo buttons give the same tool calls without a model.
