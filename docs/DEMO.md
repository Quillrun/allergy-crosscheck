# Demo video

The submitted video (2:52, 3840×2160 at 60 fps, recorded 12 October 2026) is a real run, not a mock-up:
- The simulator was recorded in headless Chrome while a local model (Qwen3.5 9B, MLX) drove the MCP server, with live Open Food Facts and TheMealDB data.
- The waits for the model were cut.
- The server's clock was set to 8 October 2026 12:00 for the first session, so the guest's end date ("until Saturday 10 October") and every answer match Alexa's captured lines. The last turn is a second session on the same household file with the clock at 11 October 2026, the day after the guest's visit ended: the server was restarted, the conversation started fresh, and the household came back from disk.
- Frames were captured losslessly at 2× device scale (Chrome DevTools screencast) and encoded once at the end, so the text stays sharp at 4K.
- The simulator shows the screen as an Echo Show 8 would (1280×800, scaled to fit). Captions and the short labels were added in editing, timed to the spoken words; zooms and the dimming around them were recorded in the browser.
- The opening and closing slides are HTML pages recorded the same way.
- Alexa's seven lines are Amazon's own Alexa voice, rendered in the Alexa developer console (a private test skill, Test tab, Voice & Tone) from the exact text the run returned; the recorder stops if a run's sentence differs from the rendered text. In the one-ask turn two of them, the lasagne verdict and the list confirmation, are one answer; the recorder checks the whole answer against the two rendered clips.
- When one answer comes from two tools, the simulator shows each tool's screen as its sentence is spoken; the recorder plays the pre-rendered clips and advances the same screen queue.
- The narrator and the user are local text-to-speech with Boson AI's Higgs Audio (Higgs TTS 3), used under its Creator Use Grant, from reference voices made for this project, so no real person's voice is imitated.
- Credit, as the licence asks: "This audio was created with Boson AI's Higgs Audio — https://www.boson.ai/higgs-audio".
- Alexa's lines are exactly what the run returned. One is shortened: at 0:12 the can't-confirm answer plays as its first sentence only; the whole line plays at 1:40. Every clip was checked against its script with Whisper.
- Products are shown by their generic names from the records.
- The phone scans were recorded with Chrome's fake camera showing an image of each product's real barcode; the scan page decoded them live.

## Script

| At | On screen | Audio |
|---|---|---|
| 0:00 | A product record, built line by line: chocolate hazelnut spread, allergens none listed, ingredients missing; then a stamp: "A checker that trusts this list: 'No allergens'" | Narrator: "A real product record: a chocolate hazelnut spread. Allergens: none listed. Ingredients: missing." "A checker that only trusts that list would call it allergen-free." |
| 0:12 | The product's answer screen for that record: "Can't confirm", a row each for Maya and Leo; label "Simulated Alexa+ · Amazon's Alexa voice" | Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data." (the first sentence of the 1:40 answer) |
| 0:18 | The record again; beside it "8 in 10 scans · no list · can't confirm", then "7 in 10 · milk", "nearly 6 in 10 · nuts", "a decisive answer (avoid, or none listed) where the scanned product has an English ingredient list", and the base (264,667 of 1,552,376 scanned Open Food Facts records · milk 71.3% · peanut + tree nuts 57.3% · milk + celery 72.0% · engine run 12 Oct 2026) | "No list, no guess, and that is eight scans in ten. With a list to read, it gives a decisive answer seven times in ten for milk, nearly six for nuts." |
| 0:28 | Title card: "Allergy Crosscheck", "Who at the table can eat it, and why.", the three verdicts | "Allergy Crosscheck is an Alexa+ add-on that tells you who at the table can eat it, and why." |
| 0:36 | Simulator, idle | "This is a simulated Alexa+ on an Echo Show: a local AI model drives my MCP server." |
| 0:43 | Voice turn; label "Saved to the household · checked on every answer" | User: "Alexa, save Maya. She's allergic to peanuts and tree nuts." Alexa: "Got it. I'll check everything for Maya: peanuts and tree nuts." |
| 0:51 | Voice turn; label "Guest with an end date: Saturday 10 October" | User: "Leo from next door is coming on Saturday. He can't have dairy or celery." Alexa: "Got it. I'll check everything for guest Leo until Saturday 10 October: milk and celery." |
| 1:02 | One voice turn, two screens: the lasagne verdict, "Avoid for Leo", a row per person, the swaps, label "Recipe → every ingredient × every person → swaps"; then, as the answer continues, the shopping-list panel with the three swaps, each noted "Swaps for lasagne for Leo's allergies", label "One ask: check → swaps → list, no second prompt"; then a zoom on the list | User: "Check the lasagne for everyone, then add the swaps to my shopping list." Alexa, one answer: "Leo should avoid this: it contains celery and milk, in the celery, creme fraiche and mozzarella. Nothing listed for Maya's allergies, but check the label. Swaps are on the screen. Added extra onion or leek, coconut cream and nutritional yeast. You have 3 items on the list." Narrator: "One ask, three swaps on the list, each checked against everyone: no dairy-free cheese, because that's often made from cashews." |
| 1:33 | Phone scan: the spread's barcode, on the scan page | Narrator: "Reading out a barcode is tedious. Scan it on your phone, then just ask." |
| 1:38 | Voice turn; label "The record from 0:00 · no list, no guess" | User: "Can Maya and Leo have what I just scanned?" Alexa: "I can't confirm this is OK for Maya and Leo: the ingredient list is missing from the product data. Treat it as unsafe and check the label." |
| 1:49 | Phone scan: a hot cocoa mix | (the scan page finds it) |
| 1:52 | Voice turn, zoom on "What I found" (label "Reads the ingredients, not just the list"), then a zoom on Maya's row (label "Can't confirm names the lines to check") | User: "And this one I just scanned?" Alexa: avoid for Leo (milk, in the whey, caseinate and lactose), can't confirm for Maya. Narrator: "The allergen tags say soy, and milk only as a 'may contain'. The ingredient text shows the milk is in it." "For Maya it can't confirm, and names the two lines to check: the oil and the flavouring." |
| 2:23 | Card "Sunday 11 October · a new session", then the idle simulator and the lasagne check again: Maya "None listed", Leo "guest · visit ended Sat 10 Oct · not checked"; label "New session, next day · guest not checked" | User: "Check the lasagne again." Alexa: "Leo's visit ended on Saturday 10 October, so I didn't check for them. Nothing listed for Maya's allergies, but check the label." |
| 2:34 | Slide: under the hood (Alexa+ → MCP server → MCP Apps screen; allergen engine → open data), and the captured tool result as the server ships it ("VERDICT: UNSAFE / Say to the user: …", the `_meta.ui.resourceUri`), captioned "ships to Alexa+ as is; the verdict lock is my test harness" | "Under the hood: a self-hosted MCP server with nine tools, an MCP Apps screen built to the Alexa+ design guide, and an open-source allergen engine measured on 4.8 million real products." |
| 2:47 | End card | "Allergy Crosscheck: who at the table can eat it, and why." |

Cut for time: the 1-in-15 slide; it is recorded and its figure is in the docs (SUBMISSION "Why", README). The point the v8 video made on a slide ("keeping the model honest": the simulator's verdict lock and no-tool guard) is in the docs and, since v10, on the under-the-hood slide's caption.

## Recording it yourself

Start the server with a model (see the README), clear `data/household.json`, open http://127.0.0.1:8787/, and follow the same turns by voice or by typing. The demo buttons give the same tool calls without a model.
