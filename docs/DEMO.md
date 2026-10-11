# Demo video

The submitted video (2:50, 3840×2160 at 60 fps, recorded 12 October 2026) is a real run, not a mock-up:
- The simulator was recorded in headless Chrome while a local model (Qwen3.5 9B, MLX) drove the MCP server, with live Open Food Facts and TheMealDB data.
- The waits for the model were cut.
- The server's clock was set to 8 October 2026 12:00 for the first session, so the guest's end date ("until Saturday 10 October") and every answer match Alexa's captured lines. The last turn is a second session on the same household file with the clock at 11 October 2026, the day after the guest's visit ended: the server was restarted, the conversation started fresh, and the household came back from disk.
- Frames were captured losslessly at 2× device scale (Chrome DevTools screencast) and encoded once at the end, so the text stays sharp at 4K.
- The simulator shows the screen as an Echo Show 8 would (1280×800, scaled to fit). Captions and the short labels were added in editing, timed to the spoken words; zooms and the dimming around them were recorded in the browser.
- The opening and closing slides are HTML pages recorded the same way.
- Alexa's six lines are Amazon's own Alexa voice, rendered in the Alexa developer console (a private test skill, Test tab, Voice & Tone) from the exact text the run returned; the recorder stops if a run's sentence differs from the rendered text.
- The narrator and the user are local text-to-speech with Boson AI's Higgs Audio (Higgs TTS 3), used under its Creator Use Grant, from reference voices made for this project, so no real person's voice is imitated.
- Credit, as the licence asks: "This audio was created with Boson AI's Higgs Audio — https://www.boson.ai/higgs-audio".
- Alexa's lines are exactly what the run returned. Every clip was checked against its script with Whisper.
- Products are shown by their generic names from the records.
- The phone scans were recorded with Chrome's fake camera showing an image of each product's real barcode; the scan page decoded them live.

## Script

| At | On screen | Audio |
|---|---|---|
| 0:00 | Cold open: the lasagne verdict screen, "Avoid for Leo"; label "Simulated Alexa+ · Amazon's Alexa voice" | Alexa: "Leo should avoid this: it contains celery and milk, in the celery, creme fraiche and mozzarella." |
| 0:06 | A product record: chocolate hazelnut spread, allergens none listed, ingredients missing; a stamp: "A checker that trusts this list: 'No allergens'"; then "4.8 million records in Open Food Facts" and "53% of the products people scan look like this" | "This is a real product record from Open Food Facts: a chocolate hazelnut spread, with an empty allergen list. A checker that only trusts that list would call it allergen-free." "Of 4.8 million products in Open Food Facts, more than half of the ones people scan look like this." |
| 0:22 | Title card: "Alexa+ remembers your allergies." above the title, then the two-line lead and the three verdicts | "Alexa+ already remembers your allergies. Allergy Crosscheck checks the food: who at the table can eat it, and why." |
| 0:32 | Simulator, idle | "This is a simulated Alexa+ on an Echo Show: a local AI model drives my MCP server." |
| 0:38 | Voice turn | User: "Alexa, save Maya. She's allergic to peanuts and tree nuts." Alexa confirms. |
| 0:46 | Voice turn; label "Remembers the household across sessions" | User: "Leo from next door is coming on Saturday. He can't have dairy or celery." Alexa: "…guest Leo until Saturday 10 October: milk and celery." |
| 0:58 | Voice turn: the lasagne verdict, then zooms on Maya's row and the swaps; labels "The yes: none of her allergens listed" and "Coconut isn't a tree nut (EU 14; FDA, January 2025)" | User: "Check the lasagne." Alexa: "Leo should avoid this: it contains celery and milk, in the celery, creme fraiche and mozzarella. Nothing listed for Maya's allergies, but check the label. Swaps are on the screen." Narrator: "For Maya, none of her allergens are listed. That's the yes, as far as the data goes." "Every swap is checked against everyone: no dairy-free cheese, because it's often made from cashews." |
| 1:25 | Phone scan: the spread's barcode, on the scan page | Narrator: "Reading out a barcode is tedious. Scan it on your phone, then just ask." |
| 1:30 | Voice turn; label "Missing data never becomes 'no allergens'" | User: "Can Maya and Leo have what I just scanned?" Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data. Treat it as unsafe and check the label." |
| 1:40 | Phone scan: a hot cocoa mix | (the scan page finds it) |
| 1:44 | Voice turn, zoom on "What I found"; label "Reads the ingredients, not just the list" | User: "And this one I just scanned?" Alexa: avoid for Leo (milk, in the whey, caseinate and lactose), can't confirm for Maya. Narrator: "The allergen tags say soy, and milk only as a 'may contain'. The ingredient text shows the milk is in it." |
| 2:07 | Card "Sunday 11 October · a new session", then the idle simulator and the lasagne check again: Maya "None listed", Leo "guest · visit ended Sat 10 Oct · not checked"; label "Next day, new session: household kept, guest not checked" | User: "Check the lasagne again." Alexa: "Leo's visit ended on Saturday 10 October, so I didn't check for them. Nothing listed for Maya's allergies, but check the label." |
| 2:19 | Slide: under the hood (Alexa+ → MCP server → MCP Apps screen; allergen engine → open data) | "Under the hood: a self-hosted MCP server with nine tools, an MCP Apps screen built to the Alexa+ design guide, and an open-source allergen engine measured on 4.8 million real products." |
| 2:31 | Slide: 1 in 15 US adults, with the source (CDC, National Health Interview Survey 2024, released 8 January 2026: 6.7% of adults, 5.3% of children) | "About one in fifteen adults in the US has a food allergy, and every shared meal means checking for everyone. Allergy Crosscheck does that check, says so when it can't, and its engine is open source." |
| 2:44 | End card | "Allergy Crosscheck: who at the table can eat it, and why." |

The point the v8 video made on a slide ("keeping the model honest": the simulator's verdict lock and no-tool guard) is now only in the docs: SUBMISSION "Simulated Alexa+" and README "Limits".

## Recording it yourself

Start the server with a model (see the README), clear `data/household.json`, open http://127.0.0.1:8787/, and follow the same turns by voice or by typing. The demo buttons give the same tool calls without a model.
