# Demo video script (under 3 minutes)

Record the simulator at http://127.0.0.1:8787/ full screen, with system audio on so the spoken answers are heard. Clear the household first: stop the server, delete `data/household.json`, start again.

| Time | On screen | Action / voice-over |
|---|---|---|
| 0:00–0:15 | Title card | "Tens of millions of people live with food allergies, and the product data they rely on is often wrong. So I built an Alexa+ add-on that never says 'safe'." |
| 0:15–0:35 | Simulator | **Save Maya** (peanuts, tree nuts), then **Save guest Leo** (dairy, celery, until Saturday). Point at the household card: guests expire on their own. |
| 0:35–1:05 | Lasagne verdict | **Check lasagne**. Alexa: "Leo should avoid this: it contains celery and milk…" Point at: red banner, Maya "None listed", Leo "Avoid", flagged lines, swaps. Then show the mozzarella row: the dairy-free cheese swap is missing because it's often cashew-based and Maya can't have tree nuts. |
| 1:05–1:15 | Shopping list | **Add the swaps to the list**. |
| 1:15–1:45 | Which Nutella? | **Check Nutella**. Five products share the name, so it asks instead of guessing. Tap the second one: "I can't confirm… the ingredient list is missing." A naive app would have called it allergen-free. |
| 1:45–2:10 | Real Nutella | **Check Nutella by barcode**. Voice-over: "The database's own allergen tags list only nuts. Allergy Guard reads the ingredient text too, so it catches the milk and the soy." |
| 2:10–2:35 | Code or terminal | Show `npm test`: 39 passing. Then `test/sim.test.ts`: a model that tries to say "totally safe" is overridden by the tool's verdict. |
| 2:35–2:55 | Architecture slide | Self-hosted MCP server (spec 2025-11-25, Streamable HTTP), MCP Apps screen, open-source engine. "Fail-closed by design." |

If an LLM is configured, replace two button presses with voice: "Alexa, Leo from next door is coming Saturday, he can't have dairy or celery", and "Check tonight's lasagne for Saturday."
