# Client handoff checks (brief 10.6)

These are not build gates. This box (4 cores, headless Chromium, WebGL in SwiftShader at 2-5 fps, no
H.264 decoder, no mail client, no printer, no phone) cannot run them. Each item says what to do and
what "pass" looks like. Automated results are in `qa/RESULTS.md` (from `scripts/qa.mjs`); the truth
sign-off is `qa/TRUTH.md`.

## 1. Real phones: iOS Safari (iPhone 13 or newer) and Android Chrome (mid-range, e.g. Pixel 6a)

| Check | How | Pass |
|---|---|---|
| Hero pull and tap | Open the site cold. Drag the chalk-box handle down and let go; reload and tap the line instead. | The line pays out within 1.8 s, follows the finger, snaps on release or tap; the H1 inks; dust and film rise. A vertical swipe anywhere else on the hero scrolls the page (never trapped). |
| Freeze and swing | On a phone with WebGL2 (any recent iPhone; Android with 4 GB+ RAM), watch to the end of the snap. | Time stops on the dust peak, the camera swings about 6 degrees with no torn edges or stretched sheets; on weaker phones the still with the near-matte appears instead, never a blank frame. |
| H.264 freeze crossfade | Safari plays the H.264 fallback (Chromium here could only test AV1). | No visible jump in colour or position when the film hands over to the frozen frame. |
| Low Power Mode | iOS: Settings → Battery → Low Power Mode on, reload. | Every film shows its poster with a `▶ PLAY` button; tapping plays it. Nothing is blank. |
| Memory over a full scroll | Scroll top to bottom twice, then back up. | No reload or crash (iOS kills tabs that hold too many decoded videos); at most two films play at once. |
| A-300 mini-slot with the keyboard up | Tap `1 · PLATFORM` in RFI-001 and type. | The 64 px strip with the stencil slot stays visible above the field while the keyboard is up and shows what you type, upper-cased. iOS sometimes scrolls the visual viewport under sticky elements; if the strip slides away, report it (fix: pin it to `visualViewport`). |
| Forms do not zoom | Tap every field on A-300 and A-301. | The page does not zoom in (inputs are 18 px). Chips toggle on a single tap and are easy to hit (64 px rows on phones). |
| Phone bar | Scroll the whole page on a phone with a home indicator. | `PLANNED · NYC · 2027 · A-xxx`, `Teams →`, `Sponsors →` always visible above the home indicator (safe-area inset respected); the left button opens the title block sheet. |

## 2. A real GPU (desktop and laptop)

| Check | How | Pass |
|---|---|---|
| Frame rate | Chrome on a laptop with integrated graphics at 1440p: Performance panel while the hero swings and while scrolling A-101 (slide) and A-103 (iris). | 60 fps; no long frames during the swing and both entrances. |
| Hero GPU time | Same session, GPU track during the swing. | ≤ 6 ms per frame (brief 8.6). |
| Lighthouse | PageSpeed Insights on the **deploy preview** (not this box), mobile and desktop. | Mobile Performance ≥ 85, Accessibility 100, Best Practices ≥ 95, SEO 100; LCP < 2.5 s mobile / < 2.0 s desktop, CLS 0, INP < 200 ms (brief 8.6). |

## 3. Mail clients (both mailtos)

The mailto builder is unit-tested against RFC 6068 (`src/lib/mailto.test.ts`: exact subjects and
bodies, percent-encoding, CRLF line breaks, ASCII template text). What no test here can prove is how
real clients open them.

| Client | How | Pass |
|---|---|---|
| Apple Mail (macOS and iOS) | Fill RFI-001 (team, platform, tick 01 and 03, needs) and click **Discuss competing →**; repeat with the kit composer and **Discuss sponsorship →**. | A new message to the placeholder address with the exact subject, e.g. `HRCG 2027 (planned) - Discuss competing - <team>`, and the body on separate lines exactly as typed, ticked challenges by name (`Bricklaying, Bolted assembly`). Accented names (e.g. `Zürich`) survive. |
| Gmail web | Chrome with Gmail set as the mailto handler (chrome://settings/handlers). Same two forms. | Same subject and line breaks in Gmail's compose window. |
| Outlook web | Edge or Chrome with Outlook on the web as the handler. Same two forms. | Same as above. |
| No mail client at all | A browser with no handler: click the button. | The line `Nothing opened? Copy the address below and email us from your mail app.` appears; **Copy address** copies it (button reads `Copied`; VoiceOver/NVDA announce "Address copied."). |

**Before launch:** replace the placeholder `hello@example.com` with the real address in **one place**,
`src/content/config.ts` (`CONTACT_EMAIL`). Everything else (links, mailtos, footer, copy buttons)
follows. The copy lint will then need that address allowed instead of the placeholder (rule 15 check in
`src/system/lintRules.ts`).

## 4. Control target T7 (print and detect)

| Check | How | Pass |
|---|---|---|
| US Letter | Print `/kit/hrcg-t7-letter.pdf` at **100% / Actual size** (not "Fit to page"). Measure the tag's outer black edge. | It matches the `TAG EDGE` printed on the sheet (the pipeline measured 15.0 cm / 5.91 in, `t7-proof.json`). |
| A4 | Same with `/kit/hrcg-t7-a4.pdf`. | Same edge length. |
| Real camera detection | Photograph each print (phone camera, room light, 0.5-2 m) and run any AprilTag detector (family tag36h11). | Detected as **ID 7**. Note the smallest size and angle that still detect; the site only claims detection on digital renders. |

## 5. Assistive technology (spot checks)

| Check | How | Pass |
|---|---|---|
| VoiceOver (macOS Safari, iOS) and NVDA (Windows Firefox/Chrome) | Use INDEX, a strip CTA, RFI-001 and the kit composer by keyboard and screen reader. | INDEX opens as a dialog, Esc closes it, focus returns; a CTA jump announces `Sheet A-300, For teams.`; every field reads its label; chip groups read as groups with their legend; the challenge chips read `01 BRICKLAYING`…; the send link reads its fine print (`aria-describedby`). |
| Zoom 200% and 400% | Browser zoom on desktop. | No horizontal page scroll, the strip collapses per its rules, nothing overlaps a CTA or a focused field. |

## 6. Facts and open questions for the client

- **A-200 fact gate: signed VERIFIED by A6** (2026-10-08; two independent sources per figure, listed in
  `qa/TRUTH.md`). The verified body ships (`FACT_GATE = 'verified'` in `src/content/copy/a104-a200.ts`).
- Still unknown and **not stated anywhere on the site** (audit §4 "open questions"): date, venue,
  organiser, eligibility, autonomy rules, scoring, prizes, entry cost, spectator access, the real contact
  address, social handles, and whether teams can enter a subset of challenges. Each one ships as a HOLD
  or is simply absent; answering any of them is a copy change, not a design change.
- Remotion licence (brief R14): free for organisations of up to 3 people; larger companies need a
  Company License. It affects only the film pipeline (`film/`), not the site.
