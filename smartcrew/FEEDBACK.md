# SmartCrew page: the working list

Every piece of feedback on the product page, in one place. Each item has a status.
**Open** means it is being built now. **Done** means it is built and checked.
**Waiting** means it needs an answer from the agency owner or Andrew.

## Andrew's doc, Oct 20 14:25Z

1. **Done. FAQ: his first two questions merged.** "What size and type of construction companies is
   SmartCrew built for?" and its "designed for small to midsize contractors…" paragraph are gone; its
   "We only work with companies in dirtwork and heavy civil…" paragraph is now the second paragraph of
   "What is SmartCrew?". 12 questions. (His doc keeps its old numbers, so it reads 1, 3, 4…)

## "Try SmartCrew" and Andrew's booking page (Oct 19, Andrew by text via the agency owner)

"Let's roll with CTAs as 'Try SmartCrew' instead of the Free Trial option" (a free trial pushes cash
collection back a week, and the experience is poor until their project data is in), and for /book: "we'll
roll with a layout like this for the booking page. All emphasis is going to be on booking the demo."
Main page and /book; the other looks pick up the shared copy, with no design work.

1. **Done. Every button says "Try SmartCrew"** (hero, header, sticky bar, sections, FAQ, popup entry).
   The popup's last button says "Pick my time"; its lines no longer promise a free trial. Trial before
   the call stays off for good (config.trialFirst).
2. **Done. /book in his layout:** "Need help?" + email in the bar; his kicker, headline and sub centred;
   the video on the left with "Here's what we'll cover:" (his three) under it; the calendar on the right in
   a card ("Book a 15-minute walkthrough with Andrew", his line, and the confirmation-email note). Phones:
   video, calendar, then the three. Out: the dark band, the progress steps, "On the call", the assurances
   and "What you're setting up". The video stays until the agency owner's new one arrives.
3. **Waiting on Andrew:** his /book words still promise a free trial (kicker, headline, "Get your free
   trial"), as does FAQ 10 "How does the free trial work?"; all ⚑, kept as written since he'll tweak the copy.
   The call is 15 minutes in his layout (now everywhere), but his Cal.com event is 45 minutes today (⚑).
4. **Done. /book is video-first** (the agency owner, Oct 19: "We want them to watch the video. That should
   be the main focus… have them make a conscious choice not to watch the video to book… the video
   basically mini-plays in the top left and continues to play while they book"). It opens on Andrew's
   video, big and alone, with "Your calendar opens when the video ends." and a secondary "Skip the video
   and book now". The calendar card opens when the Vidalytics player reports `ended`, on the skip, or at
   once if the video can't load. Skipped mid-video, the video moves to a corner player top-left (320px on
   laptops, 46% of the width on phones) and keeps playing; ✕ pauses and closes it, "Watch Andrew's video"
   by the calendar brings it back. "Here's what we'll cover" sits under the calendar. A reload in the same
   visit keeps the calendar open (sessionStorage `sc_book_phase`). Cal.com still loads in the background
   a few seconds in, so it's ready when it opens. Events: `video_skip`, `video_ended`, `video_failed`.
   Screenshots: /mnt/project-files/smartcrew/try-smartcrew/booking-{video,skip}-{laptop,phone}.png.
5. **Done. The pain picker understands reworded pains** (the agency owner, Oct 19: typed text that was
   "obviously one of the things… just wasn't the exact wording" got "we don't have a thing for that").
   The browser matches first, looser (owners' own wording, plurals, typos; src/site/features/match.ts).
   When it isn't sure, it asks /api/match-pain (api/match-pain.ts, a Vercel function), where a cheap
   DeepSeek model on OpenRouter picks one of the ten cards or none. The key is `OPENROUTER_API_KEY`
   (sensitive, production + preview) on the Vercel project; `PAIN_MODEL` swaps the model. The page only
   calls the function when the build saw the key (`VITE_PAIN_AI`, vite.config.ts), so a key change needs
   a redeploy. Any failure falls back to the browser's guess. `tools/match-test.mjs` checks 145 reworded
   pains (all matched) and 15 off-topic lines (no match). `GET /api/match-pain?text=…` checks it live.

## Andrew's round 2, in classic (Oct 19)

Andrew's "Website Feedback" doc as of Oct 19 18:43Z (everything from "Other Tweaks - 10/17" on is new).
The agency owner: "declutter, focus on the main one, and update that main one with all the updates that he
wants." Built into classic, the default link (html.look-classic scopes the fold and popup additions);
glass, focus, bold and optimized get no design work, and the sections they share carry the new copy.
Change list: /mnt/project-files/smartcrew/andrew-feedback-round-2.md.

1. **Done. Fold:** "Featured by" over "ConExpo" on two lines above the headline (the word stands in for
   the logo: `config.conexpoLogo` once Andrew sends the file). Carried over from "optimize the main one"
   where it doesn't clash with Andrew: Katie's quote under the button, the sign-up form's three answers,
   and the price slots (off; `?review` shows them). The laptop fold grows past one screen when a short
   screen can't hold it, so nothing overlaps the logos.
2. **Done. Replace 5 apps:** MaintainX beside Fleetio on Fleet Management (a letter mark until Andrew
   sends the logo file).
3. **Done. Try it:** "So Simple… Your Crew Will Actually Use It", "Simple for the field. Robust for
   leadership.", the trial button always there, and beside the phone "…But don't take our word for it…
   Try it yourself." with an arrow to it. The two facts are cut.
4. **Done. Calculator:** his headline and the APA line (⚑: no traceable source found), minutes
   10/15/30/45/60 (30), 15 people, $20/30/40/50 ($30).
5. **Done. FAQ:** "Got questions? We've got answers." + his sub, his 13 questions and answers word for
   word, and the close "Ready to simplify your business?" + his line. The close stays in view on laptops.
6. **Done. Everything. Built for dirt.:** his ten features in his order, his words (name, headline, sub,
   bullets); the grey line under each closed card and the trial button inside each card are cut; type
   about 15-20% larger; his close "Ready to run your entire operation in one place?" + CTA under the
   section. Job Costing opens the project's Cost Codes tab (budget vs spent by code); Equipment leads
   with the Service Queue, and the CAT D6's machine page has Service Records. New screens: Daily
   Reports, Safety, Files. The pain picker and "See all 38 tools" stay, regrouped under the ten.
7. **Done. Watch it work:** "Watch How It Works For The Crew, The Admins And The Owners", tabs The Day
   (crews) / The Week (admins) / The Results (owners), his copy for every line, list on the left and
   laptop + phone on the right; on a dark ground in classic (Andrew via the agency owner, Oct 19 20:34Z:
   "We could invert design on this one so it has darker background").
8. **Done. Calculator on phones:** the longer headline and the APA line no longer push the button under
   the next section; the section grows past one screen when it has to.
9. **Waiting on Andrew:** the new logo (his Drive link isn't shared with us), the ConExpo and MaintainX
   logo files, a source for the APA figure, and whether the FAQ keeps "Founding Member" (his answers 11
   and 13 still use it; ⚑ on both).

## Try it week strip (the agency owner, Oct 19: "fix alignemnt.")

1. **Done. Day numbers and names centred in their tiles**, in every look. The demo's button reset
   (`.sc.ca button`, left-aligned) beat clock.css's centring, so they sat 7-9px left of centre on
   laptops and 13-17px on phones; now 0px. Only the week strip changed (pixel-checked in every look,
   phone and laptop). Before and after: /mnt/project-files/smartcrew/fixes/.

## The optimized look (the agency owner, Oct 19)

"is it too much text at the start yes or no, or somehow does that improve conversion", then "Just look at
the numbers, make a optimized version and post it as optimized version". Built as a fifth look,
`?look=optimized`: the bold look (Katie's quote under the button, the sign-up form's answers, Watch it
work and Try it) with a trimmed first screen. Bold stays as the comparison; classic (Andrew's link),
glass, focus and bold are pixel-identical to before.

1. **Done. Fewer words before the button, same words.** The headline takes four lines set smaller
   (HERO4.lines.trim); Andrew's sub moves below the fold to open the Replace section, word for word;
   "Featured at ConExpo" moves down to the logos. First-screen words: phone 57 → 42, laptop 59 → 44
   (without the menu).
   Trial button: phone y 362 → 226, laptop 607 → 422. Nothing waiting on Andrew is switched on.
2. **Simulator** (blind head-to-heads, phone page, upgraded analyzer): optimized vs bold **too close to
   call** (+0.07; 3 of 4 judges favoured optimized by about 2%, none favoured bold). The judges' one
   doubt: the sub was the one plain sentence saying what the product does. Retrained heatmap: the
   button's share of the first 3 seconds 2.6% → 5.7% (at the edge of the model's ~2.7-point miss).
   Results: /mnt/project-files/smartcrew/optimized/results.md.

## The conversion list, in the bold look (the agency owner, Oct 19)

"work on implemening all of that" (the click research's summary: a price, trial before the call, Katie's
quote under the button, the QuickBooks ad, win the first screen, answer the crew's and office's fears at
the form), then "lets focus for now about driving traffic to the part where they book a call. we can work
on the booking flow later." Bold look only; classic (Andrew's link), glass and focus are unchanged.
Results: /mnt/project-files/smartcrew/bold/conversion.md.

1. **Done. Answers at the sign-up form** (popup step 1, under the company name): batteries, QuickBooks
   payroll, no contract (Andrew's own wording). Simulator, blind popup head-to-heads: **lean: answers**
   (+0.10, 4 of 4 judges, ratio 1.02), not a call.
2. **Done. First screen.** The hero fills it on phones (390×844 and 390×664) and laptops with the button,
   Katie's quote and the logos in view; the laptop popup is taller so step 1 never scrolls on 900px.
   The attention gain once claimed for a full-screen hero came from the old heatmap and no longer
   stands: the retrained heatmap (Oct 19) gives the button 2-4% in every look, logo and headline first.
   Its untested suggestion: a shorter headline or a higher button (the headline is Andrew's copy).
3. **Waiting (Andrew): the price.** Built and off (`config.pricing`, src/lib/offer.ts): under the hero
   button, in the popup per crew size, in the FAQ's cost answer. `?review` shows ⚑ placeholders.
4. **Waiting (Katie, Andrew): Katie's photo** beside her quote (`config.katiePhoto`), her OK, JW or JCR.
5. **Waiting (Andrew): "Only tracks your crew while they're clocked in"**, flagged until he confirms it
   alongside GPS auto clock-in. With it the simulator scored +0.11, no better than without.
6. **Parked: trial before the call** (`config.trialFirst`, preview `?review&trial=first`): the booking
   flow waits, per the agency owner. Built and off; /book is unchanged unless it's switched on.
7. **Done. Ads** led by "Stop re-typing timecards into QuickBooks every Friday.":
   /mnt/project-files/smartcrew/ads/ (files only, nothing posted).

## The bold look (the agency owner, Oct 18)

"Is their any way to still not make it look like lovable and look better but keep that as a draft and
fork it to make a net version"; "I need to see them be less boring tho. They are just not somthing
apealing at all"; and the one goal: "Just worry about driving conversion to the get free trial link".
Built as a fourth look: `?look=bold`. A fork of the classic page (no glass); classic, glass and focus
are unchanged, and Andrew's link still shows classic.

1. **Done. Night on the job site.** A dark warm ground, white type, and a rendered 3D terrain of a
   graded pad (contour lines, the pad's orange edge, a dashed geofence, crew GPS pins) filling the
   first screen, with the laptop and phone standing on it. The terrain comes back behind the FAQ's
   closing product shot. Art: public/bold/, rendered by tools/terrain/ (three.js, headless Chromium).
2. **Done. The orange button is the one bright thing on any screen.** Orange elsewhere is a hairline
   or a dot; kickers go warm grey. All 34 checks pass, including "never two orange CTAs on screen".
3. **Done. Big, left-aligned type.** Headlines set large and flush left; the hero's sub, button and
   demo link sit in one left column beside the product on laptops.
4. **Done. Katie's quote right under the hero button** (the simulator's one repeat winner, 7 of 8
   blind head-to-heads).
5. **Done. The product stays true.** The app's screens keep their light colours inside the dark page.
6. **Done. /book carries the look**, so the popup doesn't land on what looks like a different site;
   Cal.com's booker stays its own light card.
7. **Checks:** 34 of 34 e2e checks pass in all four looks (`--look=bold`); classic, glass and focus
   are pixel-identical to before at every screen, laptop and phone, and on /book.
8. **Done. Checked with the click simulator** (re-scored with the upgraded analyzer, Oct 18): blind
   head-to-heads on the phone page, bold vs classic, 8 judges in both orders: **lean: bold**, not a
   call (score +0.10, a call needs 0.15; all 8 favoured bold, ratio 1.02-1.03). Leans were right 63% of
   the time on real page tests, so read it as "probably a bit better". Every judge credited Katie's
   quote in the first screen. Results: /mnt/project-files/smartcrew/bold/results.md.
9. **Waiting:** a real split test against classic on trial clicks before it goes anywhere near
   Andrew's link.

## The focus look (the agency owner, Oct 17)

"Make liquid glasses best you can … the minimal example … angelo.so … accentuating that one main
point and also not overcrowding … don't edit [what] we have now, make a second version with this
minimalistic focus on one thing at a time concept." Built as a third look: `?look=focus`. It builds on
the glass look (both classes are on) and goes further; classic and glass are unchanged.

1. **Done. One point per screen.** Each section is reduced to its one point (the headline, one
   visual, one action) with room round it (`--focus-gap`); the rest of the section stays, word for
   word, but goes quiet (smaller, lighter ink, fewer containers). The calculator's dollar figure,
   the testimonials and the offer each sit on one liquid-glass card.
2. **Done. One section at a time.** src/site/focus.ts marks the section filling most of the screen;
   on laptops the others dim to 30% round it (never hidden, still tappable; the footer never dims).
   A button in a dimmed section doesn't count as on screen, so the header's bright one stands in: a
   full-strength trial button is always in view. Phones don't dim (Oct 18, below).
3. **Done. Liquid glass where it can't hurt:** a deeper aurora that drifts slowly on laptops (still
   with reduced motion), bright rimmed glass sheets, near-solid fills under text, the orange button
   solid, no blur on phones. Rules: src/styles/focus.css, each section's focus.css.
4. **Done (Oct 18). Real liquid glass, from the agency owner's references** (kube.io's refraction
   write-up, Apple's Liquid Glass docs and WWDC25 219, and the open-source builds he linked; angelo.so
   only as the bar for "clean, simple, draws focus", not copied: "Number maxx so we get the best
   conversion but it's not a eyesore but conversion is #1"). The header is a real lens on desktop
   Chrome and Edge: the page bends at its rim (a baked squircle displacement map through an SVG
   filter, Snell's law at n = 1.5) and is frosted under the links. Everywhere else (Safari, Firefox,
   phones, reduced transparency, more contrast) it stays the solid frosted pill; more contrast gets a
   plain bar with a border. On phones the page fades under the header instead (no blur). The orange
   button stays solid. Code: src/lib/liquidGlass.ts, src/site/shell/LiquidGlass.tsx. Research notes:
   /mnt/project-files/smartcrew/focus/liquid-glass-research.md.
5. **Done (Oct 18). Checked with the click simulator and the attention heatmap before keeping it.**
   Blind head-to-heads on the phone page: the Oct 17 focus look lost to classic 4 of 4 (small: about
   3-4% fewer trial taps; button low at y 528 against 367, washed-out dimmed sections, long gaps).
   Fixed on phones: the fold starts under the header with the button at y 407 and the next section
   peeking in, no dimming, gaps halved. Re-run: the new focus ties classic 4 of 4; a version with the
   fold filling the whole screen did slightly worse (classic favoured 2 of 4), so it was dropped. On
   laptops the logos sit at the foot of the first screen. (The old heatmap's reason for that, logos
   under the button taking its attention, was withdrawn Oct 19: that model matched real gaze at only
   0.37; the retrained one, 0.70, gives the button 2-4% in every look and no look wins.
   /mnt/project-files/sim-business/ueyes/results.md.)
   Results: /mnt/project-files/smartcrew/focus/results.md.
6. **Checks:** all 34 e2e checks pass in all three looks (`--look=focus`); classic and glass are
   pixel-identical to before at every screen, laptop and phone.
7. **Decided (Oct 18):** classic stays the default on Andrew's link, since focus only ties it and
   trial clicks are now the one goal ("Just worry about driving conversion to the get free trial
   link"). Open design notes: the gap between the testimonials and the offer is large on laptops; the
   Replace tiles are tall on phones (16px body text kept).

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
