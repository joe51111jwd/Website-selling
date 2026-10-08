# Client-side feedback log (hrcg-v2)

The user's notes, in order, with the action for each and where it stands. Live at https://hrcg-v2.vercel.app.

| # | Feedback (user's words, shortened) | Action | Owner | Status |
|---|---|---|---|---|
| 1 | "Remove that line that bounces at the start." | Remove the SVG chalk line from the hero. The real chalk line in the film does the job. | director | done in code; ships with the next deploy |
| 2 | "When you move your cursor around, you can see more movement around the actual video." | Look-around parallax: the film slides ±42/26 px and tilts ±4°/3° in 3D. The headline sits at a shallower depth (±18 px) and LAY BRICK at a closer one (±46 px). Springs 50/18. | director | done in code |
| 3 | "It freezes in midair… have it actually fall down to the ground and have the full video play out… it backtracks a little." | Play the whole take with no freeze and no still swap, so there is no jump back. The headline lights up on the snap. | director | done in code |
| 4 | "Make the video start and finish frame the exact same so it looks like a continuous loop." | Seamless loop: the first second is dropped and the last second crossfades into it (`hero-loop-169/916`), played with `loop`. | director | encoding |
| 5 | "'Lay brick' looks too generic… brick texture… different fonts… same with the other typeface." | LAY BRICK is set in Big Shoulders Stencil and filled with running-bond brickwork (mortar joints, varied clay colours), laid course by course (stepped reveal from the bottom). The headline is wide, heavy, site-sign caps (Archivo 125% width, 900 weight). | director | done in code; check the look |
| 6 | "A version with parallax scrolling… scroll through each part to get to the next one… like itsnotyouits.ai." | A second page, `/story.html`: pinned full-screen parts, one idea per screen, scroll-linked entrances and exits, the same hero, tasks, permit and footer. | story bot | in progress |
| 7 | "The bricklaying one repeats after 0.1 seconds." | Re-cut `plan-b40` from the full 5 s take (it was 11 frames), as a seamless loop. | director | encoding |
| 8 | "Bolted assembly: he bolts, lifts up, and there's nothing there… have him bolt one in, then the next piece moves in, then he grabs another bolt… clean, easy to read." | Short term: a seamless crossfade loop of the current take. Proper fix: a new overhead clip generated with the same first and last frame, so it loops, showing one bolt driven, the next plate sliding in and the robot reaching for the next bolt. | media bot | in progress |
| 9 | "Make the little animations longer." | All five task films are re-cut as seamless loops at 0.72× speed (about 5.4 s each, frame-blended). | director | encoding |
| 10 | "The HRCG logo gets right over text when you start scrolling up… meshes in and looks bad." | Once the page has scrolled, the header gets its own ground (a charcoal bar with blur, no blend mode), so it never sits on text. | director | doing now |
| 11 | Contact email is a placeholder (`hello@example.com`). | Swap it in when the client's address arrives. | director | waiting on the user |

After deploy, a QA bot checks every row on the live site at 1440×900 and 390×844 and reports anything that still fails.

## Round 2 (16:30)

| # | Feedback | Action | Status |
|---|---|---|---|
| 12 | "The brick lettering looks really AI-generated… pick a more rustic, construction-hardware-store typeface." | LAY BRICK is now set in Alfa Slab One (a heavy slab, sign-painter / hardware-store style), solid bronze, slight tilt, with no texture. | live |
| 13 | "The front animation where it slaps down a piece of wire makes zero sense… better when it pushes its finger into the ground." | The hero now loops only the hand-into-the-slab moment and the dust roll-out (from frame 60 of the take), in slow motion at 0.6×, as a seamless crossfade loop (3.1 s desktop, 3.5 s phone). The line pickup is cut. | live |
| 14 | "The smaller animations don't have perfect loops… they need to pick it up, move it, place it, screw it." | Loops: every task film is a seamless crossfade loop (QA measured no hard cuts). Action: five clip bots tried new first=last-frame Kling generations. Pipe is still running. Bricklaying, drywall, bolted (reach to tray) and layout all failed QA (vanishing arms, tools sliding by themselves, static robots), so the old loops stay. Next step needs a different method: image-to-video 10 s plus a crossfade loop, or new start frames with the tools within reach. Needs a credit decision. | blocked on credits (about 90 left) |
| 15 | QA bot findings | Dark first paint, fully opaque header, balanced phone headline, arena strip as a seamless loop, floating button hides while scrolling down, html overflow-x clip. | live |

## Round 3 (client walk-through of the five task films, 14:0x)

The user's notes, verbatim in spirit. All five need new footage. The user approved spending more Higgsfield credits ("it's okay… as long as you get something good"). Balance: 90.3.

| Bay | What's wrong now | What it must show |
|---|---|---|
| 01 Bricklaying | He lays one brick, grabs more mortar, never places it, lays another. Doesn't read as a loop. | Scoop mortar from the tub → spread it on the course → pick up a brick from the pallet → set it in the mortar → tap it level. One clear cycle. |
| 02 Drywall | He puts the sheet up and "clips" it on; never screws it in. | Pick up the sheet → hold it square on the studs → pick up the screw gun → drive screws along the studs, visibly. |
| 03 Bolted assembly | Bolts spawn from nowhere; he never goes to grab them. | Reach into the tray → pick up a bolt → insert it in the plate → drive it with the impact wrench. Nothing appears from nowhere. |
| 04 Pipe assembly | He moves a pipe piece back and forth; no assembly. | Pick up a fitting/pipe → join it to the run → tighten. The run visibly grows. |
| 05 Layout and marking | Draws one line, then resets. | Make it longer: several lines in a row (snap line, then the next), a continuous layout job. |

Method this round: image-to-video from the bay's start frame, with no forced end frame, at 10 s where the model supports it. Loop with a crossfade from tail to head. Two variants per bay. Accept only clean, readable action.
