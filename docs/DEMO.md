# Demo video

The submitted video (2:41, 3840×2160 at 60 fps, recorded 12 October 2026) is a real run, not a mock-up:
- The simulator was recorded in headless Chrome while a local model (Qwen3.5 9B, MLX) drove the MCP server, with live Open Food Facts and TheMealDB data.
- The waits for the model were cut.
- The server's clock was set to 8 October 2026 12:00 for the first session, so the guest's end date ("until Saturday 10 October") and every answer match Alexa's captured lines. The last turn is a second session on the same household file with the clock at 11 October 2026, the day after the guest's visit ended: the server was restarted, the conversation started fresh, and the household came back from disk.
- Frames were captured losslessly at 2× device scale (Chrome DevTools screencast) and encoded once at the end, so the text stays sharp at 4K.
- The simulator shows the screen as an Echo Show 8 would (1280×800, scaled to fit). Captions and the short labels were added in editing, timed to the spoken words; zooms and the dimming around them were recorded in the browser.
- The opening and closing slides are HTML pages recorded the same way.
- Alexa's seven lines are Amazon's own Alexa voice, rendered in the Alexa developer console (a private test skill, Test tab, Voice & Tone) from the exact text the run returned; the recorder stops if a run's sentence differs from the rendered text. In the one-ask turn two of them, the lasagne verdict and the list confirmation, are one answer; the recorder checks the whole answer against the two rendered clips.
- When one answer comes from two tools, the simulator shows each tool's screen as its sentence is spoken; the recorder plays the pre-rendered clips and advances the same screen queue.
- The narrator and the user are local text-to-speech with Qwen3-TTS 1.7B Base (Apache 2.0, the MLX 8-bit build), cloned from synthetic reference voices, so no real person's voice is imitated. Every clip was transcribed with Whisper and matched against its script before use.
- Alexa's lines are exactly what the run returned. Every clip was checked against its script with Whisper.
- Products are shown by their generic names from the records.
- The phone scans were recorded with Chrome's fake camera showing an image of each product's real barcode; the scan page decoded them live.

## Script

| At | On screen | Audio |
|---|---|---|
| 0:00 | Fifteen figures, one of them red, then "1 in 15 · US adults have a food allergy" and the source line (CDC, National Health Interview Survey 2024, released 8 January 2026: 6.7% of adults, 5.3% of children) | Narrator: "About one in fifteen adults in the US has a food allergy, and every shared meal means checking for everyone." |
| 0:06 | A product record, built line by line: chocolate hazelnut spread, allergens none listed, ingredients missing; then a stamp: "A checker that trusts this list: 'No allergens'" | Narrator: "A real product record: a chocolate hazelnut spread. Allergens: none listed. Ingredients: missing." "A checker that only trusts that list would call it allergen-free." |
| 0:18 | The record slides left; beside it Allergy Crosscheck's own verdict for it: "Can't confirm", "the ingredient list is missing from the product data", "No list, no guess." | Narrator: "No list, no guess: it tells you it can't confirm." |
| 0:21 | Title card: "Allergy Crosscheck", "Who at the table can eat it, and why.", the three verdicts | "Allergy Crosscheck is an Alexa+ add-on that tells you who at the table can eat it, and why." |
| 0:27 | Simulator, idle; label "Simulated Alexa+ · Amazon's Alexa voice" | "This is an Echo Show simulator: a local AI model stands in for Alexa+ and calls the MCP server." |
| 0:35 | Voice turn; label "Saved to the household · checked on every answer" | User: "Alexa, save Maya. She's allergic to peanuts and tree nuts." Alexa: "Got it. I'll check everything for Maya: peanuts and tree nuts." |
| 0:43 | Voice turn; label "Guest with an end date: Saturday 10 October" | User: "Leo from next door is coming on Saturday. He can't have dairy or celery." Alexa: "Got it. I'll check everything for guest Leo until Saturday 10 October: milk and celery." |
| 0:53 | One voice turn, two screens: the lasagne verdict, "Avoid for Leo", a row per person, the swaps, label "Recipe → every ingredient × every person → swaps"; then, as the answer continues, the shopping-list panel with the three swaps, each noted "Swaps for lasagne for Leo's allergies", label "One ask: check → swaps → list, no second prompt"; then a zoom on the list | User: "Check the lasagne for everyone, then add the swaps to my shopping list." Alexa, one answer: "Leo should avoid this: it contains celery and milk, in the celery, creme fraiche and mozzarella. Nothing listed for Maya's allergies, but check the label. Swaps are on the screen. Added extra onion or leek, coconut cream and nutritional yeast. You have 3 items on the list." Narrator: "One ask, three swaps on the list, each checked against everyone: no dairy-free cheese, because that's often made from cashews." |
| 1:23 | Phone scan: the spread's barcode, on the scan page | Narrator: "Reading out a barcode is tedious. Scan it on your phone, then just ask." |
| 1:28 | Voice turn; label "The record from the start · no list, no guess" | User: "Can Maya and Leo have what I just scanned?" Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data. Treat it as unsafe and check the label." |
| 1:38 | Phone scan: a hot cocoa mix | (the scan page finds it) |
| 1:42 | Voice turn, zoom on "What I found" (label "Reads the ingredients, not just the list"), then a zoom on Maya's row (label "Can't confirm names the lines to check") | User: "And this one I just scanned?" Alexa: avoid for Leo (milk, in the whey, caseinate and lactose), can't confirm for Maya. Narrator: "The allergen tags say soy, and milk only as a 'may contain'. The ingredient text shows the milk is in it." "For Maya it can't confirm, and names the two lines to check: the oil and the flavouring." |
| 2:12 | Card "Sunday 11 October · a new session", then the idle simulator and the lasagne check again: Maya "None listed", Leo "guest · visit ended Sat 10 Oct · not checked"; label "New session, next day · guest not checked" | User: "Check the lasagne again." Alexa: "Leo's visit ended on Saturday 10 October, so I didn't check for them. Nothing listed for Maya's allergies, but check the label." |
| 2:23 | Slide: under the hood (Alexa+ → MCP server → MCP Apps screen; allergen engine → open data), and the captured tool result as the server ships it ("VERDICT: UNSAFE / Say to the user: …", the `_meta.ui.resourceUri`), captioned "ships to Alexa+ as is; the verdict lock is my test harness" | "Under the hood: a self-hosted MCP server with nine tools, an MCP Apps screen built to the Alexa+ design guide, and an open-source allergen engine measured on 4.8 million real products." |
| 2:36 | End card | "Allergy Crosscheck: who at the table can eat it, and why." |

The point the v8 video made on a slide ("keeping the model honest": the simulator's verdict lock and no-tool guard) is in the docs and, since v10, on the under-the-hood slide's caption.

## Recording it yourself

Start the server with a model (see the README), clear `data/household.json`, open http://127.0.0.1:8787/, and follow the same turns by voice or by typing. The demo buttons give the same tool calls without a model.
