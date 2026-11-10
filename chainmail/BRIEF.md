# chainmail — site rebuild brief

Source of truth for every agent working in `chainmail/`. Read it fully before touching anything.

**Inspiration:** https://chainmail-redesign.vercel.app/index.html (screenshots of it are not needed; the concept,
copy and catalog below are taken from it). We keep the *idea* and the *client facts*, not the look.

**What chainmail is:** a Miami agency that builds high-end promotional gift kits around a client's own product.
A kit = the client's product + branded goods (hoodie, tee, cap, tumbler…) + optional premium spirit + a printed
note, packed in a rigid box, numbered as an edition (e.g. no. 01/48), shipped to every address on the client's list.
Tagline: **"your brand is the feature, we're the service."** Contact: Luis, luis@chainmail.store.
Footer facts: "End-to-end, curated kit building. Miami, FL. Kits ship 2–3 weeks after proof approval. Spirits
ship 21+ only, via licensed partners." "© 2026 chainmail, LLC · a sister agency to FERZAN&SONS".

The user's direction (non-negotiable):
1. **High fidelity.** Every product, box and packing moment is rendered in **Blender (Cycles)** at maximum quality.
   No stock photos of products, no flat CSS boxes pretending to be packaging, nothing that looks like "random BS".
2. **No serif fonts anywhere.** Sans and mono only.
3. **Clean and on brand.**
4. **Don't left-align everything.** Mix centred compositions, right-weighted blocks and asymmetric splits.
5. **Shaders.** Real WebGL work that makes it feel alive — not just flat sections.
6. Colours may change from the reference (they did: see palette).

---

## 1. Brand system

### Palette (identical in Blender `lib/common.py PALETTE` and CSS `--c-*` tokens)
| token | hex | use |
|---|---|---|
| ink | `#0B0B0F` | primary dark: the kit box, type on light, dark sections |
| graphite | `#2A2A31` | secondary dark surfaces, borders on dark |
| bone | `#EFEBE3` | warm off-white: page background, paper, card stock |
| fog | `#D9D4CA` | hairlines on light, muted fills |
| cobalt | `#2B3BFF` | THE accent: tissue paper, seal, CTAs, highlights, links |
| cobalt_d | `#1420B8` | pressed / deep accent |
| volt | `#D8FF3C` | micro-accent only (a tag, a focus ring, a single word). Never large areas. |
| chrome | `#C9CCD3` | metallic foil logo, shader highlights |

The concept: *chainmail* → interlocking metal rings → **chrome on ink, with an electric cobalt accent, on warm bone paper.**
Packaging = matte soft-touch ink rigid box, chrome hot-foil wordmark, cobalt tissue, bone note card, cobalt numbered seal.

### Type (sans only — verify no serif fallback anywhere, including `<select>`, `<button>`, `<input>`)
- **Display:** Archivo, expanded width (wdth 112–125), weight 700–900, lowercase headlines, tight tracking (-0.02em to -0.04em). Self-host via `@fontsource-variable/archivo` (use the `wdth` axis file).
- **Text:** Geist (variable, `@fontsource-variable/geist`), 400–600.
- **Numbers / labels / prices / edition numbers:** Geist Mono (`@fontsource-variable/geist-mono`), tabular figures.
- Fallback stacks end in `system-ui, sans-serif` — never `serif`.
- The same Archivo Expanded ExtraBold TTF is in `blender/assets/fonts/` for 3D logos/numbers.

### Logo
Lowercase **chainmail** in Archivo Expanded ExtraBold flanked by two interlocked oval links each side
(`o-chainmail-o` idea). Blender: `common.logo()`. Web: an inline SVG component (`src/components/logo.js`) — text
converted to paths is ideal, or SVG `<text>` with the self-hosted font + ring paths. Must read at 18px tall.

### Voice
Lowercase headlines, short, confident, a little cheeky ("how many kits we talking about?", "reasons to blush").
Body copy in sentence case. No exclamation-mark spam.

### Layout principles
- 12-col fluid grid, max content width ~1440px, generous whitespace, 8px spacing scale.
- **Alignment rhythm** (do not left-align every block): hero = centred; process = centred stage with captions
  alternating left/right; goods = asymmetric editorial grid with alternating text sides; spirits = centred bottle
  lineup with a two-column price list; edition = split (number left, grid right) → mirrored next time; work =
  full-bleed horizontal drag rail; testimonials = centred huge quotes; quantity = centred segmented picker; FAQ =
  title right-aligned column, answers left; footer = centred giant wordmark.
- Dark/light section alternation: bone → ink (process) → bone (goods) → ink (spirits) → bone (work) … with
  shader-driven transitions where sections meet.
- Fully responsive (360px → 2560px). Mobile is not an afterthought: renders swap to `@half.webp`.

---

## 2. Rendered assets (Blender → WebP)

All scene scripts live in `blender/scenes/`, all reusable model builders in `blender/lib/`.
`blender/lib/common.py` is the shared foundation — **use it, don't fork it** (palette, materials, studio rig,
`lathe()`, `rounded_box()`, `text()`, `logo()`, `render_to()`). You may add helpers to your *own* lib module.
If you believe `common.py` itself needs a fix, make the minimal change and say so in your report.

Pipeline:
```
blender -b --factory-startup -P blender/scenes/<scene>.py -- --preview   # 40% res, 32spp -> blender/previews/
blender -b --factory-startup -P blender/scenes/<scene>.py                # final -> blender/out/<path>.png (16-bit)
python3 tools/optimize.py <filter>                                        # -> site/public/renders/<path>.webp + @half.webp
```
(Run from `chainmail/`. Blender 4.5 LTS is at `/usr/local/bin/blender`. 4 CPU cores, no GPU — the machine is
shared with other agents, so iterate on `--preview` and only render finals once a preview looks right.)

### Shared conventions (so everything looks like one shoot)
- Real-world scale in metres. Z up. Items rest on Z=0. Front of a product faces −Y (toward camera).
- Lighting: `studio()` rig + HDRI (`soft` default). Tune `key`/`scale`, but keep the key upper-left, rim back-right.
- Cutouts: `film_transparent=True` + `shadow_catcher()` so each PNG carries its own soft contact shadow.
- "Product" camera: 3/4 view, ~30–38° elevation, 70–100 mm lens, slight DOF optional (f/8+). Frame with ~8% padding.
- Final quality: `setup_render(samples=256)` default (OIDN denoise, AgX Medium High Contrast). Go to 512 for glass.
- Materials from `common.py` (fabric with knit bump + sheen, soft-touch box wrap, foil, tissue, leather, powdercoat,
  glass, liquid absorption). Add micro-detail: bevels on every hard edge, seams/stitch lines on textiles, ribbing on
  cuffs/hems, threads on bottle necks. Perfectly sharp CG edges and untextured flat colour are failures.
- Decoration on goods = the *client's* logo. Use a neutral placeholder mark: the words **"your logo"** in Archivo
  Expanded (or a simple cobalt badge with it), applied the way it would be made: embroidered (raised, satin-stitch
  look) on caps/hoodies, screen-printed (flat, slight ink sheen) on tees/tote, laser-etched (exposed steel) on the
  tumbler, foil-debossed on the journal. The chainmail logo itself only appears on chainmail packaging.
- Colourways come from `site/src/data/catalog.js` (`swatches`), e.g. hoodie Black/Cement/White.

### Kit box spec (owner: packaging agent; everyone else just needs the item footprints)
Rigid two-piece box, outer **0.50 × 0.36 × 0.15 m** (W×D×H), lid 0.506 × 0.366 × 0.06 m slips over the base.
Ink soft-touch wrap outside, cobalt inside wall wrap, a bone/ink molded insert (EVA foam or molded pulp) with
cut-outs, cobalt tissue paper crumpled around items, chrome-foil wordmark on lid, a round cobalt seal sticker
("no. 01/48", Geist Mono) on the lid corner.

Approximate item sizes (metres) — item builders must hit these so they fit the box:
| item | size | resting pose in kit |
|---|---|---|
| folded hoodie | 0.20 × 0.27 × 0.055 | flat, portrait |
| folded tee / long sleeve | 0.20 × 0.27 × 0.03 | flat |
| cap (dad cap) | 0.19 deep × 0.17 wide × 0.10 tall (incl. brim) | upright, often nested on the hoodie |
| tumbler (25 oz BruMate Rise) | Ø0.083 × 0.265 | lying along Y |
| spirit bottle 750 ml | Ø~0.08 × ~0.30 (varies per bottle) | lying along Y |
| journal | 0.14 × 0.21 × 0.016 | flat |
| note card (5×7 in) | 0.127 × 0.178 × 0.0008 | flat on top, last in |
| "your product" (client product) | ~0.12 × 0.07 × 0.20 — two slim cans in a sleeve, or a small boxed bottle | upright or lying |

### Lib APIs (needed later by the packing-sequence scene — keep these signatures)
Every builder returns ONE root object (an Empty parent if it has several parts) with its origin at the base
centre, resting on Z=0, front facing −Y, and does NOT render anything or create cameras/lights.
- `lib/kit.py`: `box_base()`, `lid(number=1, edition=48)`, `insert()`, `tissue()`, `note_card(text=...)`,
  `seal(number=1, edition=48)`, `your_product()`, plus `SLOTS` (dict name → (x, y, z, rot_z_deg) in box-local
  coords for: product, hoodie, cap, tumbler, bottle, card) and `packed_box(open=True)` that assembles everything.
- `lib/apparel.py`: `folded_hoodie(color="Black")`, `folded_tee(color="White", long_sleeve=False)`.
- `lib/accessories.py`: `cap(color="Black", style="dad")`, `tote(color="Natural")`, `journal(color="Blue")`.
- `lib/vessels.py`: `tumbler(color="Matte Black")`, `bottle(kind)` where kind ∈ catalog spirit ids
  (`kettle-one, manojo, johnnie-black, jameson, four-roses, casamigos, maestro-dobel`). Bottles evoke each
  category's real silhouette and glass/liquid colour but carry **no real trademarks or label art** — minimal,
  elegant blank/abstract labels only (the brand names appear in HTML, not in the render).

### Asset manifest (exact paths — the site references these)
All under `blender/out/` → published to `site/public/renders/` as `<name>.webp` + `<name>@half.webp`.
| path | size px | content | owner |
|---|---|---|---|
| `kit/hero-open.png` | 2400×1800 | the full packed kit, lid off and leaning behind, high 3/4 angle — the hero image | packaging |
| `kit/closed.png` | 1600×1600 | closed box 3/4, foil logo, seal no. 01/48 | packaging |
| `kit/lid-top.png` | 1200×1200 | orthographic top-down lid (tiled ×48 in the edition grid) | packaging |
| `kit/product.png` | 1200×1200 | "your product" stand-in | packaging |
| `kit/note-card.png` | 1200×1200 | the note card, slight angle, "untitled (your logo here)" style placeholder text | packaging |
| `kit/stack.png` | 1800×1800 | a tidy stack/tower of closed numbered boxes (the edition) | packaging |
| `goods/hoodie.png` | 1600×1600 | folded hoodies, colourways Black/Cement/White, stacked/fanned | apparel |
| `goods/tee.png` | 1600×1600 | folded short-sleeve tees Black/Dust/White | apparel |
| `goods/longsleeve.png` | 1600×1600 | folded long sleeves Black/Dust/White (show a sleeve cuff) | apparel |
| `goods/cap.png` | 1600×1600 | dad cap Black + White, 3/4 | accessories |
| `goods/tote.png` | 1600×1600 | tote(s) Black/Natural/White, standing, handles up | accessories |
| `goods/journal.png` | 1600×1600 | journals fanned Black/Red/Purple/Blue | accessories |
| `goods/tumbler.png` | 1600×1600 | tumblers Matte Black/Primrose/Lavender/Dune | vessels |
| `spirits/<id>.png` | 800×1600 | each of the 7 bottles, upright | vessels |
| `spirits/lineup.png` | 2400×1400 | all 7 bottles in a lineup, varied heights | vessels |
| `sequence/####.png` | 1600×1200 | packing animation frames (phase 2 — not yours unless assigned) | sequence |

---

## 3. Website

### Stack
`site/` — Vite (multi-page: `index.html`, `builder.html`), vanilla ES modules (no React), `three` for WebGL,
`gsap` + `ScrollTrigger` for scroll choreography, `lenis` for smooth scroll, fontsource packages for fonts.
`npm run build` must pass with zero errors. Respect `prefers-reduced-motion` (shaders render a still frame, no
scroll-jacking, sequence becomes a static before/after). Lighthouse-friendly: lazy-load below-fold renders,
`<picture>` with `@half.webp` for narrow viewports, explicit width/height on images, no layout shift.

### File ownership
- **site-core agent:** `site/index.html`, `site/builder.html`, `site/package.json`, `site/vite.config.js`,
  `site/src/main.js`, `site/src/builder.js`, `site/src/styles/**`, `site/src/components/**`, `site/src/kit/**`
  (cart state), `site/src/data/**` (catalog already exists — import it, keep its facts).
- **fx agent:** `site/src/fx/**` only. Exposes the API below. Must not edit HTML/CSS outside `src/fx/`; documents
  required markup in `site/src/fx/README.md`.

### fx API (contract between the two)
```js
import { initFX } from './fx/index.js';
const fx = initFX();               // scans the DOM for [data-fx] canvases, sets up shared RAF, IntersectionObserver
                                   // pausing, DPR caps (≤1.75), reduced-motion stills, WebGL-unavailable fallbacks.
// Markup hooks (site-core places these):
// <canvas data-fx="chrome"></canvas>           hero background: liquid-chrome chainmail field (see shaders)
// <canvas data-fx="caustics"></canvas>         spirits section background: light through glass/liquid
// <canvas data-fx="grain"></canvas>            optional; or fx injects a fixed full-page grain overlay itself
// <canvas data-fx="sequence" data-manifest="/renders/sequence/manifest.json"></canvas>
const seq = fx.get(canvasEl);      // sequence instance: seq.setProgress(0..1); seq.ready (Promise)
fx.setTheme(el, 'ink'|'bone');     // optional: lets section shaders tint to the section they sit in
fx.destroy();
```
site-core owns ScrollTrigger and calls `seq.setProgress(p)` for the pinned packing section. Until the sequence
frames exist, the sequence player must fall back gracefully to `renders/kit/hero-open.webp` (and the
manifest may 404).

### Shaders (fx agent)
1. **chrome** (hero): full-bleed fragment shader of a *chainmail weave* — interlocking rings tiled as a height/normal
   field — shaded as polished chrome reflecting a procedural studio environment (ink + bone softboxes + a cobalt
   kicker). Slow flowing undulation (cloth-like waves through the mail), cursor/touch pushes a soft bulge/ripple,
   scroll subtly tilts the light. Must be gorgeous at 1x and 2x, stay ≥55fps on a mid laptop (budget: one pass,
   no raymarch loops > ~48 steps; analytic tiling preferred). Fades to ink at the edges so the rendered kit sits on top.
2. **caustics** (spirits, dark section): animated refracted-light caustic pattern in warm amber + cobalt, as if the
   bottles above are casting light onto the floor. Very subtle, low contrast.
3. **grain**: global animated film grain (very low opacity) to unify renders + UI — can be CSS/SVG or a tiny canvas.
4. **sequence**: canvas image-sequence player: preloads frames progressively (first, last, then bisection order so
   scrubbing is never blank), draws with object-fit: contain/cover semantics, picks 1280 vs 720 set by viewport.
5. Bonus if time permits: hover distortion on goods cutouts (subtle refraction/ripple), or a chrome treatment of
   the footer wordmark. Never at the cost of performance or readability.

### Sections (index.html) and copy
Use this copy (client's own words, lightly tightened). Lowercase headlines as written.
1. **Nav** (sticky, minimal, blurs over content): logo · links (the goods, spirits, the work, questions) ·
   `your kit (n)` pill (opens kit tray drawer) · `build a kit →` primary button.
2. **Hero** — centred. H1 "your brand is the feature," / second line in cobalt "we're the service."
   Sub: "High-end promotional gift kits, built around your product." CTAs: `build a kit →` (builder.html) and
   "or send Luis an email, he'll make it happen." (mailto:luis@chainmail.store?subject=A%20kit).
   The `kit/hero-open` render sits centre-stage over the `chrome` shader. Scroll cue "↓ watch a kit get made".
   A thin marquee of client logos (`public/clients/*.webp` — these are real clients: Four Loko, Pernod Ricard,
   Olipop, Anheuser-Busch, AriZona, Manojo Mezcal, Chili's, E11EVEN Vodka, Filthy, On Your 6) below the fold line.
3. **How a kit gets made** — pinned, scroll-scrubbed packing `sequence`. Captions advance with progress, each with
   a running per-kit price in Geist Mono:
   - "your product goes in first." — $1 "a kit, to pack yours"
   - "then the goods. hoodie, cap, tumbler, your logo on all of it." — $153
   - "a premium spirit, if you want one." — $195 (manojo, $42)
   - "and a note. say something nice, we print the card." — $195
   - "lid on. take a look — ready to approve?" — $195 "a kit, as shown"
   (Math: 1 + hoodie 72 + cap 35 + tumbler 45 = 153; + manojo 42 = 195. The card is included.)
4. **Edition of 48** — "then we make 47 more." / "edition of 48". Grid of 48 `kit/lid-top` tiles each with a mono
   number 01–48 (a few tiles flip to `public/work/*` photos on hover/scroll). Big total "$9,360" (= 195 × 48)
   with caption "numbered, packed and shipped to every door on your list." `kit/stack` render can anchor it.
5. **The goods** (#goods) — "the goods" / "Seven things people actually keep, cut to carry your logo. Tap one and it
   lands in your kit." Seven items from `catalog.goods` with their render, name, "from $NN a kit", spec line
   (hoodie: 9.0 oz French terry · short sleeve & long sleeve: 4.2 or 7.5 oz cotton · cap: Dad cap or retro trucker ·
   tote: Bull denim, 15 in · tumbler: 25 oz BruMate Rise · journal: UltraHyde, 5.5 × 8.25 in), `+ add` (toggles
   into kit; becomes "in the kit ✓") and "customise →" (builder.html#goods/<id>). Colour swatch chips from
   catalog. Asymmetric editorial layout — renders large, alternating sides, some overlapping the grid.
6. **Spirits** (#spirits, ink section with `caustics`) — "add a premium spirit" / "(or don't)". "Seven bottles,
   750 ml, priced per kit. One per kit, if you want one." Lineup render + list: ketel one $36 vodka, 80 proof ·
   manojo $42 mezcal, 86 proof · johnnie walker black $47 blended scotch, 80 proof · jameson $42 irish whiskey,
   80 proof · four roses $27 yellow label bourbon, 80 proof · casamigos $47 tequila blanco, 80 proof · maestro
   dobel $44 tequila blanco, 80 proof · (or don't) $0 no bottle, no problem. Hovering a name highlights its
   bottle (`spirits/<id>`). Shipping chain: your order → chainmail → licensed shipper → carrier → 21+ recipient.
   Legal: "Spirits are sold and shipped by a TTB-licensed partner and paid through a separate licensed processor.
   Every recipient must be 21 or older, adult signature and ID at the door. Not every state allows it; recipients
   there get the kit without the bottle."
7. **The work** (#work) — "the work" / "Built from a brief, not a catalog. Nine kits and objects we made for people
   you know." Draggable rail of 9 projects using `public/work/*` (3 photos each):
   barbie × krispy kreme — 65th anniversary kit — A collector doll in a co-branded window box, a dozen-box insert
   and a patched white denim jacket. (krispykreme_x_barbie_1..3) · barbie × sweet loren's — "Bake bold. Dream big."
   — Chef Barbie, a pink robe and a printed mailer that opens onto the whole collab. (barbie_x_sweetlorens_1..3) ·
   olipop × crocs — "Sippin' on a dream" — Custom orange Crocs with Jibbitz, a cold can and a branded Igloo cooler.
   (olipop_x_crocs_1..3) · olipop guitar + case — Fender Malibu, one-off — A Fender Malibu finished in Olipop
   strawberry, in a branded hard case. (olipop_guitar_1..3) · four loko remix — "The best box you've ever tasted" —
   Printed mailer, sticker sheet, koozie and the cans, for the Remix launch. (four_loko_remix_1..3) · manojo mezcal
   — "Paz, amor y fe" — Bottle, copita, tee and cap under an illustrated lid. (manojo_1..3) · bachan's hella hot —
   Japanese barbecue sauce launch — Sauce, bowl, chopsticks and a recipe booklet in a fire-red box. (bachans_1..3) ·
   lesser evil — "Feed the feeling" — A trunk-printed box packed with Moonions, a bottle, a tin and stickers.
   (lesser_evil_1.webp, lesser_evil_2.jpg, lesser_evil_4.webp) · 14k gold caviar spoon — For Jefferson's — With
   inlaid mother of pearl scoop. (spoon_1..3)
   Then "looking for extra?!" — "One-off objects and fully custom kits, brief to doorstep. Concept, sourcing,
   decoration, packing and delivery under one roof. From 14 karat gold caviar spoons, to fully branded, fully
   functioning dirtbikes." CTA "ask luis about a custom kit →" (mailto subject "A custom kit").
8. **Reasons to blush** — centred, huge quotes, one at a time (auto-advance + controls):
   "chainmail brings our incredibly detailed concepts to life, always on brand and always in time." — Teresa
   Cesario, Pernod Ricard · "we have done over 25,000 gift boxes with these guys over the years. would never use
   anyone else." — Jaisen Freeman, Four Loko · "everything we've done with this group has been 10/10" — Charlie
   Hodges, Krispy Kreme.
9. **How many kits we talking about?** — centred segmented picker 24 / 48 / 72 / 96 / 120+; shows live total for
   the current kit (per-kit × qty); "Pick a number and the builder opens on it. Minimum is 24." 120+ → mailto
   subject "120+ kits". Selecting a number links to `builder.html?qty=N`.
10. **Before you ask** (FAQ accordion, #questions):
   - what's the minimum? — 24 kits. The builder runs 24, 48, 72 and 96. For 120 or more, Luis handles the order directly.
   - how long does it take? — Proof within 48 hours of ordering. Kits ship 2–3 weeks after you approve it. Rush is possible — ask Luis before ordering.
   - can i put my own product in? — Yes. Ship us one per kit and we pack it in for $1 a kit. It must be smaller than 12 × 12 × 8 in, under 4 lb, and not on the restricted items list (link: catalog.restrictedPolicyUrl).
   - how do sizes work? — You don't pick them. They come from your recipient list (the shipping template has a size column), so every tee and hoodie ships in the recipient's size. (link: catalog.templateUrl)
   - can every kit go to a different address? — That's the default. Upload a .csv, .xls or .xlsx list and every kit ships and tracks to its own address. Or send them all to one place to hand out.
   - where can spirits go? — Only to recipients 21+, through a TTB-licensed partner with its own checkout, adult signature and ID at the door. Some states don't allow it; recipients there get the kit without the bottle.
11. **Footer** — centred giant wordmark, luis@chainmail.store, section links, kit builder →, restricted items,
   back to top ↑, the footer facts lines above.

### Kit tray + builder
- Kit state in `localStorage` (`chainmail.kit.v1`): `{ qty, goods: {id: {color, weight?, style?, position?}}, spirit, sendIn:boolean, note }`.
  Shared by index (tray drawer + `+ add`) and builder. Nav pill count updates live.
- `builder.html`: a calm, centred, step-by-step flow — 01 quantity → 02 your product ($1) → 03 the goods (options
  per catalog item: colour chips, weight, style, decoration position) → 04 spirit → 05 the note (textarea, live
  preview on a rendered-card image) → 06 review: line items, per-kit price, × qty, total, and "send it to Luis →"
  which opens a prefilled mailto with the full kit summary (there is no real checkout). Sticky price bar with
  animated mono digits. Deep links: `?qty=48`, `#goods/<id>`. Uses the goods/spirit renders as thumbnails.
