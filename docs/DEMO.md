# Demo video

The submitted video (2:57, 3840×2160 at 60 fps, recorded 11 October 2026) is a real run, not a mock-up:
- The simulator was recorded in headless Chrome while a local model (Qwen3.5 9B, MLX) drove the MCP server, with live Open Food Facts and TheMealDB data.
- The waits for the model were cut.
- The server's clock was set to 8 October 2026 12:00, the day Alexa's lines were captured, so the guest's end date ("until Saturday 10 October") and every answer match those captures.
- Frames were captured losslessly at 2× device scale (Chrome DevTools screencast) and encoded once at the end, so the text stays sharp at 4K.
- The simulator shows the screen as an Echo Show 8 would (1280×800, scaled to fit). Captions and the short labels were added in editing, timed to the spoken words; zooms and the dimming around them were recorded in the browser.
- The opening and closing slides are HTML pages recorded the same way.
- Alexa's lines are Amazon's own Alexa voice, rendered in the Alexa developer console (a private test skill, Test tab, Voice & Tone) from the exact text the run returned.
- The narrator and the user are local text-to-speech with Boson AI's Higgs Audio (Higgs TTS 3), used under its Creator Use Grant, from reference voices made for this project, so no real person's voice is imitated.
- Credit, as the licence asks: "This audio was created with Boson AI's Higgs Audio — https://www.boson.ai/higgs-audio".
- Alexa's lines are exactly what the run returned. Every clip was checked against its script with Whisper.
- Products are shown by their generic names from the records.
- The phone scans were recorded with Chrome's fake camera showing an image of each product's real barcode; the scan page decoded them live.

## Script

| On screen | Audio |
|---|---|
| A product record: chocolate hazelnut spread, allergens none listed, ingredients missing; a stamp: "A checker that trusts this list: 'No allergens'"; then "4.8 million records in Open Food Facts" and "53% of the products people scan look like this" | "This is a real product record from Open Food Facts: a chocolate hazelnut spread, with an empty allergen list. A checker that only trusts that list would call it allergen-free." "It's not rare: of 4.8 million products in Open Food Facts, more than half of the ones people scan look like this." |
| Title card with the three verdicts | "Allergy Crosscheck is an Alexa+ add-on that tells you who at the table can eat it, and why." |
| Simulator, idle | "This is a simulated Alexa+ on an Echo Show: a local AI model drives my MCP server." |
| Voice turn | User: "Alexa, save Maya. She's allergic to peanuts and tree nuts." Alexa confirms. |
| Voice turn | User: "Leo from next door is coming on Saturday. He can't have dairy or celery." Alexa: "…guest Leo until Saturday 10 October: milk and celery." Narrator: "It remembers the household across sessions, and stops checking for guests after their visit." |
| Voice turn: the lasagne verdict, then zooms on the cards | User: "Check tonight's lasagne for Saturday." Alexa: "Leo should avoid this: it contains celery and milk…" Narrator: "For Leo, it's avoid, with the exact ingredients." "For Maya, none of her allergens are listed. That's the yes, as far as the data goes." "Every swap is checked against everyone: no dairy-free cheese, because it's often made from cashews." |
| Phone scan: the spread's barcode, on the scan page | Narrator: "Reading out a barcode is tedious. Scan it on your phone, then just ask." |
| Voice turn | User: "Can Maya and Leo have what I just scanned?" Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data…" |
| Phone scan: a hot cocoa mix | (the scan page finds it) |
| Voice turn, zoom on "What I found" | User: "And this one I just scanned?" Alexa: avoid for Leo (milk, in the whey, caseinate and lactose), can't confirm for Maya. Narrator: "This record lists soy as its only allergen, and milk only as 'may contain'. Crosscheck reads the ingredients and finds the milk." |
| Slide: keeping the model honest (a model draft with no tool call, struck through and replaced by the simulator's sentence; the tool's own verdict, spoken word for word) | "On a real model, I caught it claiming a save it never made, so my simulator now holds it to the verdict, word for word." The draft on the slide is an example of that kind of claim; the replacement is the simulator's exact sentence. |
| Slide: under the hood (Alexa+ → MCP server → MCP Apps screen; allergen engine → open data) | "Under the hood: a self-hosted MCP server with nine tools, an MCP Apps screen built to the Alexa+ design guide, and an open-source allergen engine measured on 4.8 million real products." |
| Slide: 1 in 15 US adults, with the source (CDC, National Health Interview Survey 2024, released 8 January 2026: 6.7% of adults, 5.3% of children) | "About one in fifteen adults in the US has a food allergy, and every shared meal means checking for everyone. Allergy Crosscheck does that check, says so when it can't, and its engine is open source, so any allergy feature can start fail-closed." |
| End card | "Allergy Crosscheck: who at the table can eat it, and why." |

## Recording it yourself

Start the server with a model (see the README), clear `data/household.json`, open http://127.0.0.1:8787/, and follow the same turns by voice or by typing. The demo buttons give the same tool calls without a model.
