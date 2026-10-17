# SmartCrew page: the working list

Every piece of feedback on the product page, in one place. Each item has a status.
**Open** means it is being built now. **Done** means it is built and checked.
**Waiting** means it needs an answer from the agency owner or Andrew.

## The glass look (the agency owner, Oct 17)

"Relatively clean… too many edges… all in on a liquid glass and making it like super minimal in a
good way so that you can just have the main focus points." Built as a second look on the same page,
so the classic page Andrew reviews is untouched: `?look=glass` turns it on (`?look=classic` off) and
it sticks for the visit, popup and /book included.

1. **Done. Every section, the popup and /book** restyled: a warm aurora ground, light glass cards
   with a rim of light instead of borders, no dividers or outlines, the orange button as an opaque
   liquid pill (the one accent), a floating glass header pill and phone sticky capsule. Same copy,
   same sections, same funnel.
2. **Done. Rules from the click research** (/mnt/project-files/click-science/): text sits on
   near-solid fills (the two light inks are darkened to clear 4.5:1 on the aurora); real blur only on
   the header (12px) and the laptop popup/focus layers (16px); no blur on phones (Android scroll
   jank), with solid fallbacks for no-blur browsers and reduced transparency; Watch it work and Try it
   kept prominent (cutting them lost taps in the simulation).
3. **Checks:** all 34 e2e checks pass in both looks (`node tools/e2e.mjs <url> --look=glass`).
4. **Waiting on the agency owner:** whether glass becomes the default (build with `VITE_LOOK=glass`).
   The click simulation's one clear winner, Katie's quote under the top button, isn't added (⚑ her
   permission is still open).

## Round 4: Andrew's feedback (Oct 16 doc, Loom and call), with the agency owner's calls (Oct 17)

This round replaces the plan below it: the One Day ride and the 3D Stage are cut, so the ride,
Five apps walkthrough and Stage items further down are superseded. Summary of the sources:
/mnt/project-files/smartcrew/andrew-feedback-round-1.md.

1. **Done. The fold.** Andrew's headline and subhead verbatim, Title Case as he typed it; "Featured at ConExpo" above it; the green chip, the job tag, the Founding Member line and the "Watch a day" cue cut; "or book a demo with Andrew" stacked under the orange button; the logo strip kept. The headline is plain type, no sand pour (the agency owner, Oct 17: "it could be hard to read"); it comes up with the rest of the fold in about half a second.
2. **Done. Replace 5 apps (and dozens of spreadsheets) with SmartCrew.** Right after the fold: six dark cards (with Materials & Hauling), the apps' colour logos, lines into one SmartCrew box, Andrew's Premium small print, the orange button. busybusy, ExakTime and Fleetio have letter marks until Andrew sends logo files ⚑.
3. **Done. Everything. Built for dirt.** Feature cards with a name and one sentence; clicking one opens a subhead, short copy, a few features and clickable screens. The full app's sidebar shows every item (the sales pipeline included). A "biggest pain" picker: pick a preset pain or type your own, and it points to the feature for it.
4. **Done. Watch it work.** The ride is cut everywhere ("boring, takes time, gets people off the site"). The same day is told in a few seconds of normal scrolling: seven rows, each led by the feature headline, the crew's tap flowing into the office row.
5. **Done. Play with it.** The crew phone takes taps wherever it is on screen (laptop and phone). The 3-second scroll hold is gone.
6. **Done. Cost calculator.** Capped at 100 people; a number shows at once from a preset crew (20), minutes (15) and hourly cost ($35), and changes as the visitor sets theirs. Only a number the visitor changed goes with the lead. The American Payroll Association figure is left out (Andrew: only if it stays simple).
7. **Done. Testimonials.** Two quote cards, Katie's first, then Phil Drish's at the same size with the family disclosure ⚑. Initials until Andrew sends photos. No other quotes exist, and none are written.
8. **Done. Why us.** A static photo and Andrew's founder story from smartcrewhq.com (first three paragraphs, "Read more" for the rest, signed). "No sales team. No BDR. Just Andrew." and the receipt are cut. ⚑ His letter says "5-50"; the page uses {SIZE} (5–100) to match his new headline. The letter's "book a free call with me… Guaranteed." close is left off.
9. **Done. FAQ.** "Founding Member" and "Andrew does every call" wording removed ("we" instead). Waiting: Andrew's new FAQ copy.
10. **Done. "Founding Member" is gone from the whole funnel** (page, sticky bar, popup, /book, small print). {PROGRAM} is "Free trial".
11. **Done. Sign-up popup: two steps.** Step 1 employees (1–5 … 250+) and company name; step 2 name, work email, cell phone. It reads as setting up an account, not "Andrew will reach out". The trial still starts with a call.
12. **Done. /book.** Headline, then Andrew's video front and centre, then the calendar under it.
13. **Rules for this round:** no email to Andrew or leads from tests (leadWebhook stays empty); no ?angle= headlines; no GTM work yet.
14. **Done. Footer.** The dashed hexagon round the logo is gone (the standing "no random polygons" rule), and the trademark line spells ExakTime and Fleetio as the Replace cards do.
15. **Waiting on Andrew:** FAQ copy, new headshot, logo files, access to the real app, testimonial photos, Katie's company (JW or JCR Excavating) and permission.

## Open now

1. **The intro: scrapped.** The dark map intro was "useless and confusing". Done: it is removed completely (markup, script, CSS, dark screen).
2. **A new hero entrance, built from the topographic style.**
   - The hero's current entrance animation is out ("genuinely shit"): the headline masking in, the dashed fence drawing, the crew initials walking in, the rolling tag and the ring round the button.
   - He likes the topographic contour style: "hone it in more, there's something interesting there". It needs to look crafted and cartographic: believable terrain, heavier index contours, a few elevation labels, quiet next to the text.
   - The new entrance is built from it. Two prototypes are being built and judged, and the best one ships.
   - The orange button is clickable within 1.5 s. Any input skips the animation.
3. **No random polygons.** "What's with the random polygons?"
   - Remove every dashed polygon, hexagon and stake dot: round the headline's words, round the orange button, and round buttons on the phone screens.
   - A geofence may appear only where it is clearly a geofence: drawn round a jobsite on a map, inside the app's own screens.
   - The headline's key phrase gets plain emphasis instead. Floating crew initials and tags go, unless they clearly mean something.
4. **One Day becomes "Enjoy the ride".**
   - Scrolling past the hero shows "Enjoy the ride", and then the day plays by itself at one smooth pace, like a film. It is built in React and HTML (and the existing 3D devices), never a video.
   - The visitor's scrolling never fights it, and no jumpy animation is left anywhere: no snapping, no springy pops, no lurching zooms.
   - There are controls (pause, a timeline with the 7 times, skip), and the orange button keeps working during the ride.
   - When it ends, the page is free again: you can scroll back up, and Replay is there.
   - It takes over the whole screen: scrolling stops, the header slides away, and it shows the whole app (the crew's phone and the office), ending on the full app view. The control bar keeps a small orange "Get my free trial". It should run about 45–60 s.
   - Brief: `RIDE_BRIEF.md` (design notes).
   - **Always moving, never repetitive** (after watching the first version): no frozen frames, and every moment is its own shot (a different framing, camera move and animation). It is one continuous walk through the day, with the phone as a lead character. Shot list: `RIDE_SHOTS.md`.
   - **Smooth, not laggy:** it must hold its frame rate on an ordinary 13" MacBook in Safari and Chrome. Quality adapts to the machine, and a dedicated performance pass measures before and after.
   - **5 PM gets big numbers.** The profit number is big on screen and counts up. Clicking the 5:00 tick must not shrink it or the logo.
   - **No clipping after a jump.** Clicking a time on the timeline and then scrolling up must leave a clean frame: no extreme zoom into the laptop, nothing overlapping.
5. **A pace you can read.**
   - Each step holds until a slow reader has read everything on screen: the time, the headline, what the crew tapped and what the office got.
   - One thing moves at a time, in reading order. Whatever is being explained is big enough to read on a 13" MacBook.
6. **Five apps → one: a walkthrough.**
   - Every time an app goes in, something pops up that says which part of SmartCrew replaces it ("This is the CRM part: …"), and the view zooms in on that part (mostly as it zooms now).
   - It ends on the whole dashboard with all five parts labelled (the "5-way dashboard"), then the orange button.
   - It uses the same player, controls and readable pace as the ride.
   - **Make it more important** (after seeing the page): it gets a full-screen takeover like the ride. The five tools are named big in plain words, with the apps each one replaces underneath. A 1-of-5 … 5-of-5 tracker fills as each goes in, and it ends on the clearest frame on the page: "5 apps → 1", then the orange button.
7. **No flicker.** The MacBook keys flash while the laptop stands still, and other spots may flicker too. Everything must look clean and stable, with no shimmer at rest or in motion.
8. **Scroll moments everywhere else** ("put in some of the scroll timing, like the Andrew ticket").
   - Every other section gets one well-timed moment as it comes into view, at the same quality as Andrew's receipt printing itself: the spec sheet, Try it, Your number, proof, the FAQ and /book.
   - They are calm and readable and never fight your scroll. Brief: `SCROLL_BRIEF.md`.
9. **The cursor doesn't zoom.** "When it hovers over something, it zooms in, which is kind of distracting."
   - Done: the magnifier over device screens is off, and the big "view" circle is now the small link ring.
   - Rule: hover states stay small and calm. No zoom and no big growth.
10. **"Here's everything it does": less text, click through the web app.** Less text, and the visitor can click through the real office web app: the six groups as its sidebar, real screens, and one-line labels on hotspots. Brief: `SPEC_BRIEF.md`.
11. **Two versions.**
    - Version 1 is the React ride (`?v=ride`). Version 2 (`?v=video`) plays Andrew's walkthrough video full screen in the same spot: scrolling past the hero locks the page, the video autoplays (muted, with "Tap for sound") until it ends, then the page lets go.
    - Done: version 2 is live, with the takeover, Skip/Esc, scroll up to leave, Resume and Replay. Not verified: actual video playback, because the test browser here can't play the video's format (H.264). Check it in Safari or Chrome.
    - Done: the hero's polygons and walking crew are gone, the topographic lines come forward, and "every job" is in orange.
12. **Copy.**
   - Every line is up for review on the copy review page (Use new / Keep current / Rewrite).
   - The site's wording changes only after the agency owner has marked it.
   - Questions only Andrew can answer are listed on that page.

## Andrew's asks (all must be true at handover)

- [x] A new product page for smartcrewhq.com, in the spirit of the template he liked (smart-crew-website.vercel.app/?v=2), in our style.
- [x] The features simplified, so the copy and highlights don't overload the brain:
  - One Day shows the 7 moments;
  - the spec sheet shows the 38 tools in 6 groups, expandable.
- [x] The flow: Facebook ad → product page + "Free trial" CTA → a popup that feels like creating an account (Company / Name / Email / Phone / Size) → a "Book a call" page with Andrew's video, his Cal link and some product details.
- [x] "Free trial" and "Book a demo" as two buttons that follow the same workflow.
- [x] The free trial is for Founding Members and starts with a call with Andrew.
- [ ] "Replace 5 different apps with one software" near the bottom: being rebuilt as the walkthrough in item 6.

## Standing rules (every change)

- No AI smell. Portfolio-grade. It should look like our own portfolio and our other client sites.
- Conversion comes first. The orange "Get my free trial" is the centrepiece. Make them feel stupid saying no, honestly.
- It must be instantly clear what it is, who it's for and what each thing does. Skimmable, with less clutter.
- Every section fits a 13" MacBook (1440×660 and 1280×600 usable). No dead space, and devices never just vanish.
- It must not be boring or static, but it has to be smooth and clean, never jumpy.
- Phones (mostly iPhones in the Facebook app) must be smooth and uncluttered: no 3D on phones.
- Vectors wherever possible. The logo is an SVG.
- One version only: the best one, not options.

## Hard constraints

- **Andrew's video:** it stays as is. A redo needs the agency owner's explicit approval, which has not been given.
- **No watermark.**
- **Andrew's calendar:** never book a real time on it. Tests stop at the time picker.
- **Demo data:** no real employee names or data. The demo uses the fictional "Cedar Ridge Earthworks".
- **Tracking IDs:** Meta Pixel and GA IDs stay empty on previews.
- **Claims:** never invent prices, trial terms, perks, stats or customer counts. Anything Andrew hasn't confirmed carries ⚑, which is hidden on the ad build and shown with `?review`.

## Before it goes to the client

- [ ] Items 1–12 above are done.
- [ ] A review panel passes it: an art director, a conversion lead and technical QA.
- [ ] `npm run e2e` is green on desktop and on the Facebook in-app iPhone browser.
- [ ] It is deployed, and the agency owner gets the link.

## Latest (hero type + topo)
- **Topo lines smooth, not jagged.** Done: contour lines are relaxed before they're drawn, the polygon terraces are gone, and the landform around the copy is softer.
- **The headline shouldn't be basic text.** "Maybe the text is like a box, and then there's dirt that fills up from the top of the screen."
  - Boss, next message: "you don't see the text, then it's like someone's pouring dirt from the top… the letters just look like dirt."
  - Done: the letters start empty, with nothing on screen. Dirt grains fall from the top of the screen into the line that's filling (a canvas, synced to each line's fill). The soil rises inside the letters with a lumpy surface, line by line, until the words are made of dirt. "Every job" fills with orange clay.
  - Higgsfield was out of credits, so this is built in code instead of a video. It's lighter and stays crisp on phones.
  - Reduced motion shows it filled.
  - Open: tune the timing and texture with the boss, and consider the same treatment for other big headlines.

- **Real sand, with physics and heavy grain** (the boss: "as realistic as possible with physics… it should look like sand").
  - Done: a falling-sand simulation. Grains pour from the top of the screen, enter the letters, fall, slide down slopes and pile up. The bottom line fills first and each letter fills from the bottom.
  - Every grain has its own colour: soil browns with quartz and dark specks, and orange clay in "every job".
  - Measured: 60 fps on phone and desktop with the 3D off.
- **Grain on the edges, no clean mask** (the boss: "It shouldn't look like a grain with a mask over top that's clean. I want to feel the grain texture on the edges… looks like it didn't render properly").
  - Done: no clean type is ever laid over the sand. The letters are the grains, start to finish.
  - Each grain is drawn at screen resolution as a small lit pebble: its own colour, shape and size, light on the top left and shade on the bottom right. Gaps between packed grains are dark; gaps facing outside stay open.
  - The outline is rough. Some edge grains are missing (notches), and loose grains sit on top of and beside the strokes. They land there only once the sand beside them has come to rest.
  - Grains land on the pile already in each letter, so empty letters never show as ghost outlines. The letters fill from the bottom up.
  - A soft contact shadow sits under the settled letters on desktop.
  - Resizes re-lay the sand at once. Reduced motion shows it filled. If the script fails, ink type shows after 15 s.
  - Measured with screenshots off: 60 fps on desktop (1440×900, DPR 2, 3D off; about 3 ms of script a frame) and on an iPhone-size screen (DPR 3).
- **Smooth, no lag, no chunks** (the boss: "hella lag at the start… chunks out of the text. It just cuts and fills in instantly… grains should never be falling where stuff isn't filling up").
  - Done: every falling grain is a grain that fills a letter. Each falling drop aims at a column of the line being poured and becomes sand where it lands, on top of the pile. Nothing appears without falling, and nothing falls where the sand isn't rising.
  - Each line gets exactly the sand it holds, on a clock. The flow eases in and out, and the letters are full when the line's pour ends. Nothing is filled in at the end (measured: 0 grains).
  - If the browser stalls, the pour waits for it instead of catching up in one lump.
  - The lag: the 3D scene and the later sections used to start loading in the middle of the pour. They now wait until the sand has settled, unless the visitor scrolls or clicks first. Measured: no long tasks during the pour.
  - The start: the pour waited 3 s for a signal that never came, so the headline sat empty. Fixed, and the lines' invisible slide-in is gone. The pour now starts about 0.1 s after the page lays out.

## Music on the ride
- **"Add some music to the ride. Make it tuff."** The agency owner will get a licensed track. The brief and the marks it gets cut to are in `tools/music/README.md`.
- Done: the ride has a soundtrack on its own clock. It starts and stops with the ride, follows chapter jumps, stops for the popup, a scroll up, Skip or a hidden tab, and rings out at the end. Measured: within ±40 ms of the picture.
- Browsers only allow sound after a tap or click, so a visitor who only scrolled sees "Turn on sound" over the control bar. Anyone who clicked earlier just hears it. The bar has a sound on / off button, and the choice is remembered.
- Now: a placeholder hard trap beat built in code (nothing to license), cut to the ride's marks. The drop lands when the first shot settles (0:02.5). The big drop hits on the profit card (0:35.25) after a build with no 808. Nightfall goes dark, and the final hit lands on "That's SmartCrew." (0:55.5).
- Open: replace the placeholder with the licensed track when it arrives (no code change). No music on phones or with reduced motion.

## The ride: more variety
- **"The walkthrough is too repetitive… the idea is good, it just looks too repetitive and not interesting."** (the One Day ride)
- What was wrong, from a frame-by-frame capture: almost every frame was the same picture. A big clock top-left, the phone and the laptop side by side on the right, and a small change in dense UI (a row slides in, a little tag). Only 5 PM (the big profit card) and Friday broke the pattern.
- Done: every moment now ends on its own big, readable payoff. It comes off the laptop on the right while the crew's phone stays in view on the left, and each is a different kind of thing:
  - 6:42: the clock-in row grows into Marcus's on-site badge.
  - 6:55: the inspection sheet slides up, ticks itself off, and the APPROVED stamp slams into its box.
  - 9:20: the load ticket prints up out of a slot, top line first, and tears off.
  - 4:12: the leak report types itself out in huge type, then flies off to the shop as the work order.
  - 5:00: the profit card (kept).
  - 5:30: three crew phones rise in a fan and buzz, one after another, with Monday's plan.
  - Friday: the week's timecards flip from Review to Approved, row by row, then "14 timecards approved".
- Same timeline and copy, so the music's marks still land. All records are the demo's own (fictional).

## "Here's everything it does": all 38, a walkthrough, easy to find, hard to miss
- **"For all the features, when you click on it, it just starts a walkthrough… a flat walkthrough, just clicking through all the different things."** Done: "See all 38 tools" lists every tool, and any of the 38 is a button. Clicking one starts a flat walkthrough there (no 3D) that plays on by itself through all 38, in the sheet's order:
  - each tool on its real screen, zoomed in on the part that shows it, with an orange ring (and the screen's own label where there is one);
  - on the same screen the view glides from box to box; a new screen crossfades in;
  - beside it: the group ("Equipment & safety · 2 of 7"), the tool's name, its one line, crew app / office;
  - Prev / Pause / Next, ← → and Space, a 38-step bar to jump anywhere; it ends on "That's all 38." and the orange button;
  - "Walk through all 38" starts it at the first tool. Phones: the same, screen on top, words under it.
- **"All 38 features need to be there."** Done: all 38 are in the list and in the walkthrough. Before, the tools without a spot in the app tour couldn't be shown; now each has its screen (the closest one for the ⚑ tools, marked "Closest screen").
- **"Make the part where it says you can see everything more accentuated. It took me looking to find it."** Done: "See all 38 tools" is a big dark button beside the count (orange stays the trial button's). It calls attention to itself once when the section boots. Same on phones.
- **"It's too easy to accidentally scroll past it."** Done (desktop): scrolling down onto the section, the page glides it into place and holds it for 3 s. The wheel is absorbed, every button still works, and a clear scroll up lets go. Then it hands the page back. Once per visit; reduced motion skips it.
- The e2e check for this section now tests the new behaviour: 38 tools, a pick starts the walkthrough, it moves on by itself, it closes.

## The ride: scroll through it
- **"Leave the animation, but make it so you can scroll through it. If you do scroll on the animation, you can just scroll through it."** Done (desktop; on phones the ride is already plain page flow):
  - Scrolling down during the ride moves the film forward, scrolling up moves it back. The page stays on the ride, and the picture eases to where the scroll points (about 3.5 screens of scrolling covers the whole day). The trackpad, the wheel, a touch drag, ↑ ↓, Page Up / Page Down and Home / End all do it.
  - When the scrolling stops, it plays on from there by itself (after under a second). While it is being scrolled the bar still shows it as playing. The music stops while scrolling and picks up in sync.
  - Past the end, the page carries on to "Here's everything it does" (the ride counts as finished). Past the start, the page goes back up to the hero.
  - Pause, Skip, the chapter ticks, the bar's CTA and reduced motion work as before.
- The e2e ride checks now test this: a scroll burst moves the film on by seconds with the page still, it plays on after, and scrolling up past the start hands the page back.
