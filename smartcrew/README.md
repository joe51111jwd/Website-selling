# SmartCrew · "One Day" product page

The page a Facebook ad sends a dirt-work contractor to. In about a minute of scrolling they watch one workday at a 16-person crew (Cedar Ridge Earthworks, a made-up demo company) run itself on the real SmartCrew app, shown on a 3D iPhone and MacBook. Then they get one ask: **Get my free trial**. That opens a short "Set up your SmartCrew" popup, which hands them to `/book`, where they pick a call time with Andrew next to his walkthrough video.

The goal is booked calls with Andrew. Every scene is at most one tap from the popup. The orange button is the only primary action, and two orange buttons are never on screen at the same time.

Built with Vite, React 19, TypeScript (strict), motion, and three.js through React Three Fiber (one shared WebGL canvas).

---

## The flow

```
Facebook ad ──► product page (index.html) ──► popup "Set up your SmartCrew" ──► /book (book/index.html)
                 └ ?angle=… matches the ad      3 steps, live workspace preview      Andrew's video + Cal.com
```

| # | Scene | What happens | Desktop length (screens) |
|---|---|---|---|
| 0 | Intro | The night jobsite map. Three real SmartCrew notifications land, then the camera pulls back into the hero. Plays once per session, at most 3 s, skippable by any input, and is skipped for reduced motion. | not counted |
| 1 | Hero | "See what every job is making, every day." The MacBook and iPhone, a live clock-in toast, the profit ticking, the orange CTA. | 1 |
| 2 | One Day | 7 moments, 6:42 AM → Friday payroll. Each one: a tap on the phone, a pulse to the office, and the laptop updating with a crisp update card. The light and the page ground follow the clock. | 6.32 |
| 2b | Spec sheet | "That was one day. Here's everything it does." All 38 tools in 6 groups. Each group expands. | 1 |
| 3 | Try it | The visitor taps Clock In themselves. On phones the whole screen becomes the crew app. | 1.2 |
| 4 | Your number | Crew size, minutes lost and hourly cost give a yearly cost. The CTA carries the number into the popup. | 0.81 |
| 5 | Proof | Phil Drish's "~$150k per YEAR", then Katie. | 1.35 |
| 6 | Five apps → one | Five app tiles are pulled into the devices, and the screens light up. | 1.8 |
| 7 | Andrew + the offer | His three-line story and the offer, printed as a receipt and signed. | 1.0 |
| 8 | FAQ + close | Five questions. The devices come back for the last CTA. | 0.97 |
| — | Footer | | 0.5 |
| | **Total** | **15.95 screens tall, or 14.95 screens of scrolling** (390 × 664 phone: 18.9 tall) | |

The devices never just vanish. In scenes that don't use them (spec sheet, Proof, Andrew, FAQ), they glide and turn out of frame, and they glide back in for Try it, Five apps and the close.

---

## Run it

```bash
npm install
npm run dev               # Vite dev server (http://localhost:5173; this project's QA used :5310)
npm run typecheck         # tsc --noEmit, strict
npm run build             # typecheck, then dist/ (dist/index.html + dist/book/index.html)
npm run preview           # serve dist/ locally
npm run build:preview     # a noindex build for sharing (no tracking IDs needed)
npm run build:watermark   # a noindex build with the tiled "concept preview" watermark (.env.watermark)
npm run screens           # re-shoot the app screen textures into public/screens/ (dev server running)
```

The build uses `base: "./"`, so `dist/` can be served from any folder or subdomain.

### Useful URLs while developing

| URL | What it does |
|---|---|
| `/?intro=0` · `/?intro=1` | Skip the intro, or force it. It plays only once per session; the session key is `sc-intro`. |
| `/?intro=1&introDebug` | Holds the intro and exposes `window.__introSeek(ms)` (0–2410). |
| `/?angle=profit\|overbudget\|timecards\|payroll\|replace` | Swaps the hero headline to match the ad. |
| `/?nocursor` | Turns off the geofence cursor, for screen recordings. |
| `/?stageHQ` | Keeps the 3D at full resolution (headless browsers otherwise drop the resolution). |
| `/?daySlow=8` | Plays One Day's taps and updates 8× slower (dev only). |
| `/?screens` · `/?screen=<id>` | Every recreated app screen, or one at native size (dev only). |
| `/?sandbox=devices` · `/?cursor-demo` | The 3D device sandbox and the cursor test bench (dev only). |
| `/src/site/day/dev.html`, `/src/site/specsheet/dev.html`, `/src/site/try/dev/`, `/src/signup/dev/`, `/src/site/day/states/dev.html` | Per-scene harnesses (dev only). |
| `window.__stage` | In the dev console: `getTimeline()` lists every resolved pose key with its page position. |

---

## Where everything lives

| Path | What |
|---|---|
| `index.html` | The page shell, plus the intro's first frame. The first frame is plain HTML, CSS and SVG, so the Facebook in-app browser paints something before any JS runs. |
| `src/App.tsx` | The page: the backdrop, the lazily loaded 3D Stage, the header, the scenes in order, the phone's sticky CTA bar, the popup and the cursor. |
| `src/site/<scene>/` | One folder per scene (`hero`, `day`, `specsheet`, `try`, `number`, `proof`, `apps`, `offer`, `faq`, `footer`), each with its own CSS. Choreography files are named `poses.ts`. |
| `src/site/scene/Scene.tsx` | `<Scene>`: pinned sections and progress helpers. |
| `src/site/ui/Cta.tsx`, `cta.css` | The orange primary `<Cta>`, `DemoLink`, `InlineCta`. Every CTA calls `openSignup()`. |
| `src/site/shell/` | The header, the phone's sticky bar, and `primaryCta.ts`, which keeps a second orange button off the screen. |
| `src/three/stage/` | The 3D Stage: one fixed canvas. Scenes place `<StageAnchor>` boxes and register pose keys. `exitKeys` / `returnKeys` (in `recipes.ts`) handle the device exits and returns. Import from `src/three/stage` (the index) only. |
| `src/three/models.ts`, `public/models/` | The device models (meshopt-compressed GLB). |
| `src/screens/` | The recreated SmartCrew app screens (React, Inter, made-up demo data). `public/screens/` holds their textures. |
| `src/site/day/states/`, `public/renders/day-s/` | The app's state screens for One Day (after each tap). |
| `public/renders/` | Poster stills of the 3D, shown until WebGL is ready and kept if WebGL fails. |
| `src/signup/` | The popup. `contract.ts` holds `openSignup()` and the size buckets; `Dialog.tsx` the 3 steps; `Preview.tsx` the live workspace preview. |
| `src/book/` | `/book`: Andrew's video (Vidalytics) and the inline Cal.com embed, prefilled from the popup. |
| `src/lib/lead.ts`, `src/lib/track.ts` | Lead capture (fbclid / UTM attribution, the webhook) and Meta Pixel / GA4 events (`Lead`, `Schedule`, custom events). |
| **`src/content/copy.ts`** | **All page copy**, plus the tokens it uses (`T.SIZE`, `T.N`, `T.PROGRAM`…), and every ⚑ marker. |
| **`src/content/moments.ts`** | The 7 moments and all 38 features (labels, one-liners, sources, `confirm` flags). |
| **`src/config.ts`** | Everything external: the Cal.com event, the call length, the lead webhook, the Meta Pixel and GA4 IDs, the Vidalytics videos, Andrew's phone, privacy/terms URLs, login, email. |
| `src/styles/` | `fonts.css` (@font-face), `tokens.css` (colours, type scale and type roles), `base.css` (type primitives, links), `shell.css`, and `type-roles.css` (per-scene width and tracking by role). |
| `src/brand/Logo.tsx`, `public/brand/` | The redrawn logo as inline SVG (a proposal for Andrew), with favicons and lockups. |
| `src/cursor/` | The geofence cursor. It loads only on mouse or trackpad (fine pointers). |

---

## Copy rules, and how to swap a ⚑ item

All copy comes from `research/features/TRUTH.md`: GREEN and AMBER lines only, or plain paraphrases of them. Never invent prices, trial terms, perks, stats or customer counts. Anything Andrew hasn't approved carries a visible orange **⚑** on the page. A ⚑ placed on purpose isn't a bug; it is the to-do list below.

To swap a flagged item:

- **A flagged line**: edit the string in `src/content/copy.ts`. The comment next to each one says what is pending. Then remove its marker:
  - the `flag` field on a FAQ entry;
  - `<Flag …/>` in `src/signup/Dialog.tsx`, `src/book/Book.tsx` or `src/site/footer/Footer.tsx`;
  - `{FLAG}` next to the line in `src/site/proof/Proof.tsx` or `src/site/number/YourNumber.tsx`.
- **The call length**: set `config.callLength`. Once the Cal.com event matches the copy, set `config.callLengthConfirmed: true`; that removes every call-length ⚑ at once. Keep `T.N` in `copy.ts` equal to it.
- **The receipt's proposals** (founding rate, why it's free, capacity, guarantee): fill in the placeholders in `RECEIPT` in `copy.ts`. To drop them all, set `RECEIPT.showProposals = false`.
- **A feature that exists only in mockups** (marked `confirm: true` in `moments.ts`): delete `confirm: true` once Andrew confirms it is live. If it isn't live, delete the feature; the spec sheet and One Day recount themselves.
- **The size range or program name**: `T.SIZE` and `T.PROGRAM` in `copy.ts` feed every scene, the popup and `/book`.
- **Andrew's photo**: replace `public/andrew/andrew-cutout.webp` (456 × 420 today) and `andrew-face.webp` with the same names, and update `width`/`height` in `src/site/offer/Offer.tsx`.

---

## Andrew's to-do list (⚑ before launch)

Gathered from every ⚑ in the code and from the research (`research/conversion/PLAYBOOK.md` §9, `research/features/TRUTH.md`).

**Must fix before it runs on ads**

1. **Call length.** Every page says "a 30-minute call", but his Cal.com link (`andrew-drish/15min`) opens a **45-minute** "SmartCrew Demo". Either set the Cal event to 30 minutes, or give us the real length for `config.callLength` and `T.N`. Then set `config.callLengthConfirmed: true`.
2. **One name, one range, matching the ads.** The page says "Founding Member trial" and "5–100 employees"; his ads and the live site say "5–50" in several places. Pick one name and one range, and update the ads to match (and drop "#1" and "Featured by CONEXPO" from them unless they can be backed up).
3. **Testimonials.**
   - Phil Drish (~$150k per YEAR): confirm the family relationship and approve the disclosure ("Drish Construction is Andrew's family's dirt work company, where SmartCrew started"). This is required under the FTC endorsement guides.
   - Katie: is it JW Excavating or JCR Excavating (the logo strip shows JCR)? We need written permission to quote her, and ideally her surname.
   - The six "Used by" logos: confirm each is a customer that agreed to be shown, and say what the "Repurposed" logo on the live site is.
4. **Photo.** A real field photo of Andrew. The only cut-out we have is 456 × 420 px and looks soft on retina screens.
5. **Signature.** The receipt's signature is traced from the small 277 × 73 image on smartcrewhq.com. He should OK its use, or send a clean scan.
6. **Privacy policy and terms.** `config.privacyUrl` and `config.termsUrl` point at the live pages, which predate this flow (SMS consent, the Founding Member trial). Update them before launch.
7. **SMS consent.** The popup's opt-in wording needs counsel's review. Texting needs a 10DLC-registered business number. Decide who sends the reminders, and from which number.
8. **Cal.com reminders.** Turn on the reminders: an email at booking, 24 h before and 1 h before (custom reminders and US SMS need Cal's Teams plan). The draft messages are in PLAYBOOK §6.8. Set `config.andrewPhone` (E.164) so "Save Andrew's number" appears after booking.
9. **"Why a call?"** In his own words, why the trial is free and set up on a call. This goes in FAQ 1 and on the receipt's "Why it's free" line. Also approve the "What the call covers" lines on `/book`, and the promise that he opens the call with the visitor's number from the calculator.
10. **The offer proposals** on the receipt: approve or reject each one. They are a founding rate locked for as long as they stay, a capacity cap (the real number of new setups a month), and a guarantee (name plus written terms; his ads already promise "a money back guarantee").
11. **Features that exist only in the mockups.** Confirm these are live, or they come off: missed clock-out flags, JSAs and toolbox talks, fuel records, won bid → job.
12. **QuickBooks.** Until he says how it works (direct sync or export → import, and which editions), the page says only "QuickBooks integration for payroll".
13. **Plumbing.** Set the lead webhook (`config.leadWebhook`), the Meta Pixel (`1259016858853739` on the live site) and GA4 (`G-FED5LLVE5W`) IDs. They stay empty on previews so test clicks don't reach the ad account. Also confirm where the page will be hosted.

**Good to settle**

- Is the trial set up on the call, or after it? Will the call be by phone or Zoom?
- Will he text or call people who don't book within 5 minutes?
- What happens to companies with 1–5 or 100+ people? They can book today, and the lead is tagged with their size.
- The logo redraw in `public/brand/` is a proposal. He should approve it or keep his current logo.

---

## The video: keep it

`/book` embeds Andrew's existing screen-share walkthrough from smartcrewhq.com/demo (Vidalytics `Lz1Z_A8eimAA04gJ`, account `5_H1Y3QY`, in `config.vidalytics`). The boss said to keep this video. **Any redo, replacement or re-edit of the video needs the boss's explicit approval.** Don't swap it as part of other work.

---

## Fonts and licences

| Face | Used for | Licence | Files |
|---|---|---|---|
| **Special Gothic** v1.011 (Alistair McCready / Monolith, for Special Group) | Headlines, the big times, state labels, numbers, the CTA label ("SmartCrew Display") | SIL Open Font License 1.1, no Reserved Font Name | `public/fonts/special-gothic-var.latin.woff2`, `special-gothic-figures-w104.woff2` (digits only), `OFL-SpecialGothic.txt` |
| **Finlandica Text** v3.103 (Helsinki Type Studio) | Everything people read ("SmartCrew Text", with Special Gothic's digits) | SIL Open Font License 1.1, no Reserved Font Name | `public/fonts/finlandica-text-var.latin.woff2`, `OFL-FinlandicaText.txt` |
| **Inter** (Rasmus Andersson), via `@fontsource-variable/inter` | The recreated app screens and the intro's notifications only | SIL Open Font License 1.1 | npm package |

The fonts are subset and their axes limited; the OFL allows both. The licence texts ship next to the font files. Neither display face contains ✓ or ⚑, so the browser draws those from a system font. The type system and its rules are in `src/styles/tokens.css` (Type) and the design notes (`design/v2/type/FONTS.md`).

## 3D model credits

| Model | File | Credit and licence |
|---|---|---|
| MacBook Pro 14" (black) | `public/models/macbook-pro-14.glb` | Supplied with the project, then compressed with gltf-transform (meshopt + WebP). ⚑ Its source and licence aren't recorded in this repo; confirm them before launch. |
| iPhone 18 Pro Max (black) | `public/models/iphone-18-pro-max.glb` | Supplied with the project (a Binkies conversion), then compressed the same way. ⚑ Its source and licence aren't recorded in this repo; confirm them before launch. |
| Apple Pro Display XDR | `public/models/pro-display-xdr.glb` | polyman Studio, CC-BY-4.0 ([Sketchfab](https://sketchfab.com/3d-models/apple-pro-display-xdr-7e92cfb7c84d41f886c7748be6c567da)). **No scene uses it today**, so it is never downloaded and the footer shows no credit. If a scene ever shows it, the footer adds the credit automatically (`FOOTER.xdrCredit`). |

Apple, iPhone, MacBook and the competitor names in Five apps are trademarks of their owners. The footer says so, and the page names them in plain text only, with no logos.

---

## QA notes

- Design viewports: **1440 × 660**, **1280 × 600** and **390 × 664**. Phones are checked as the Facebook in-app browser on iOS: `isMobile`, `hasTouch`, DPR 3, and the `FBAN/FBIOS` user agent.
- Headless Chromium draws WebGL in software (2–5 fps). Wait 1.5–3 s per scroll step before judging a frame, and use `?stageHQ` for sharp stills.
- Never complete a real booking on Andrew's Cal.com. Stop at the time picker.
- Reduced motion: no intro, static poses, and the receipt is shown already printed.
- Without WebGL: poster stills stand in for the 3D (`html.stage-fallback`). Try it falls back to the live DOM phone.
