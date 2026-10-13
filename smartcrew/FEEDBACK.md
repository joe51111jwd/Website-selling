# SmartCrew page: the working list

Every piece of feedback on the product page, in one place. Each item has a status.
**Open** means it is being built now. **Done** means it is built and checked.
**Waiting** means it needs an answer from the agency owner or Andrew.

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
10. **Copy.**
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

- [ ] Items 1–10 above are done.
- [ ] A review panel passes it: an art director, a conversion lead and technical QA.
- [ ] `npm run e2e` is green on desktop and on the Facebook in-app iPhone browser.
- [ ] It is deployed, and the agency owner gets the link.
