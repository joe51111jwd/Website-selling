# Client feedback log

James's reactions to what he has seen, word for word, with what each one means for the next pass.
Newest first. Nothing here changes a render that is already running; it is the brief for the next one.

## 2026-11-04: The Heap v1 is "not clean"

**Word for word:** "Is there a way to convey your message without actually having text hear me out right right now we have two folks with the wires and the cups and all these other random things floating around if you could be if you could make it like you know show the wires and then maybe the wires form into the letters and then the letters disappear in the fall of the ground and then the cups come in etc. and they kind of show how they represent people people are replacing the cups and the thing has more people join the thing and then you can have seats to pile up and then you're like wait. What's actually going on is and then you may like your big things just like wait and then or some you are basically skiing upside down right here your company is growing but everything is becoming more clear. It's becoming slower. It's becoming less efficient and the edge that pushed you up. There is now pulling you back down so I think that right that piece that's what we need to optimize for because right now this site is just not clean. It's cluttered there's so much stuff going on. It needs to be clean."

**What he had seen:** The Heap v1 (`heap-site/`, `/heap/`): Blender stills of a small office, mugs on a shelf, a pile of patch cables, crossfaded by scroll, with Michael's sentences, counts and leader-line labels over the picture.

**Our reading** (voice-typed; "skiing upside down" = "scaling upside down", "more clear" = "more complex", "seats" = "these", the cables):
- It is cluttered: labels, counts, leader lines, captions, the room props. It must be clean. The objects tell the story; words nearly gone.
- The story he wants, in order: (1) the wires form into letters; (2) the letters fall to the ground and disappear; (3) the cups come in, and it must be obvious each cup is a person; (4) more people join and the cables pile up; (5) the "wait" moment, big: what is actually going on is you are scaling upside down. The company is growing, but everything is becoming more complex, slower, less efficient, and the thing that pushed you up is now pulling you back down. That reveal is "the piece we need to optimize for".
- James's own words are not Michael's, so none of them go on the page; the "wait" is done with the picture (everything stops, the light drops, a held beat) and with Michael's line that already says it: "Most founders think they're scaling. They're not." (BL 794).

**Done:** The Heap v2, clean (`heap2-site/`, `/heap2/`; `docs/11-HEAP2-CLEAN.md`): a real-time 3D scene scrubbed by scroll, objects only, at most one sentence on screen.

## 2026-10-31, about 00:30 UTC: "it looks like a sewer"

**Word for word:** "Yo, like it looks like a sewer rn. Don't stop the render because I need to see it right now. I want to see something like relatively soon, so don't change the render but like note that."

**What he had seen:** the early look-dev images (the sentence on a concrete wall above green water; the glass tank; the Plimsoll specimen). The current hero build (a canal lock: concrete walls, murky green-brown water, a steel ladder with rust weeping down the wall, a red/green lock signal, a staff gauge, dusk light) has the same problem.

**Decision taken:** the running workflow (`susd-waterline-render`, run `wf_be00a5fa-0de`) was not stopped or changed, so he can see the full scroll story soon. The fix belongs to the next pass.

**Why it reads as a sewer (our diagnosis):**
- Murky, opaque olive-green water: it reads as stagnant runoff, not water you would want to be near.
- Grey-brown wet concrete everywhere, rust streaks, a steel ladder, low dusk light: the vocabulary of a storm drain or a flood channel.
- The camera sits low in a narrow channel looking at a wall: enclosed, underground, damp.
- The underwater beats (team 13+) fill the frame with flat dark green, which reads as sludge.

**Direction for the next pass (keep the idea, change the place):**
- Keep: the sentence as real letters, water rising one hire at a time, Michael's Drowning / Redline / Oxygen images, the gauge, scroll-only, the Bootloader as the goal.
- Change the water: clean and clear, so you can see down into it (pale stone or white tile under clear water, light and caustics on the floor), the way a pool, a harbour on a bright day or a ship's hull in clear sea reads. "Drowning" should look serious because of how high the water is, not because the water is dirty.
- Change the place: open air and daylight instead of a lock chamber at dusk. Candidates to test small before committing:
  1. A ship's hull with the real Plimsoll load line painted on it, in clear harbour water (ties to our typeface and to "load").
  2. A pale stone harbour wall / sea wall in bright, clean water.
  3. A white tiled pool wall with depth markings (clean, graphic, clearly "how deep is it").
- Drop the sewer cues: rust weeping, the dark steel ladder, grime, the green-brown tint, the low enclosed camera.
- Test each candidate as one small still first (720×450, low samples) and show James before any full render.
