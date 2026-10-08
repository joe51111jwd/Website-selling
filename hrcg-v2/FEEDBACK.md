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
