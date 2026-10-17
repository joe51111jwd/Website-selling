# Raymond Ekpo: website strategy

**Client:** Raymond Ekpo, Investor Narrative Specialist (also runs Maneuver & Co.)
**Audience:** pre-seed and seed founders in the US and UK who are preparing to raise
**Job of the site:** turn founders who arrive from X, DMs and outreach into qualified enquiries

---

## 1. The reference

The base is an Awwwards winner. A second reference came from James.

**Base: Niccolò Miranda, "The Paper Portfolio"** ([niccolomiranda.com](https://niccolomiranda.com)).
Awwwards Site of the Day (18 Nov 2021) and Site of the Month (Nov 2021). It's built like a broadsheet newspaper: a masthead with a dateline, hairline column rules, a giant nameplate, small-caps section labels, drop caps and a numbered stats bar.

The brief asks for something between "independent strategy advisory" and "investment research publication", and a broadsheet sits right there. Founders and investors already trust the visual language of the FT and of research notes. It also looks nothing like a typical startup template, which the brief rules out by name.

**Second reference: Neutomni** ([neutomni.com](https://neutomni.com)), sent by James.

**What we take**

| From | Move | How it's used here |
| --- | --- | --- |
| Miranda | Masthead with dateline and a giant nameplate | "Raymond Ekpo" fills the width on the home page. The dateline gives his title, stages and markets. |
| Miranda | Hairline column rules, small-caps section heads, numbered sections | Every section is a numbered `§`, and the problem section runs as four broadsheet columns. |
| Neutomni | Headlines that turn into italic serif halfway | "Investors fund what they can *explain to someone else.*" The plain statement is upright and the turn is italic. |
| Neutomni | Numbered process columns that rise in steps | The four-step process rises like a bar chart, which suits a fundraising brand. The last column, "The room", is oxblood. |
| Neutomni | Price cards treated as objects | The four services are printed as **term sheets**: a term number, the parties, "For", "You get" and "Fee". It's the document founders are raising toward. |
| Neutomni | Numbered index list for work | Notes and analyses are numbered rows with their topic and read time. |
| Neutomni | Giant cropped wordmark in the footer | The name returns at the bottom on an oxblood field. This is the one large block of accent colour, and it sits where people decide to get in touch. |

**What we leave out:** WebGL, page-curl effects, 3D objects, sky gradients, scroll-jacking and illustrated portraits. The brief rules out "unnecessary animations" and "trendy". Motion is used only where it says something about the work (see section 6). All of it switches off with the reduced-motion setting, and the page reads fine without JavaScript.

---

## 2. Positioning

**What he is:** an Investor Narrative Specialist. He works on the investment case behind a deck (the thesis, the storyline and the claims), not only on how it looks.

**The core idea of the site:** *Investors fund what they can explain to someone else.* An investor has to retell the company to partners, co-investors or their own judgement. The narrative has to survive that retelling. This is what separates him from a deck designer, in one line.

**The bridge to his existing work:** *A pitch deck is a positioning problem with a different buyer.* At Maneuver & Co. he diagnoses positioning for B2B companies. This line connects the two practices honestly, so the personal brand doesn't read as a pivot.

**Voice:** plain, precise and commercially aware. British spelling, to match his firm's site. The copy is direct about what he won't promise. Avoid hype, invented results, "10x" and "guaranteed".

---

## 3. Structure

The brief allowed one page or several. We built **one long, conversion-led home page that answers all five questions on its own**, plus focused supporting pages. A founder arriving from X should never need a second click to understand him. The supporting pages are there for the founder who wants to check.

| Page | Purpose |
| --- | --- |
| `/` Home | Who, for whom, the problem, the services and prices, the approach, the process, examples of his thinking, the fit criteria and the CTA |
| `/services` | Each service: who it's for, the problem it solves, what it covers, what you receive and what's needed from you. Plus the mini-audit and an FAQ. |
| `/work` | Notes and analyses (examples of his thinking), plus a slot for client case studies |
| `/work/<note>` | One analysis, with a before/after slide comparison |
| `/about` | His perspective on fundraising narratives, how he works, and the link to Maneuver & Co. |
| `/work-with-me` | The enquiry form, or the mini-audit request (the same form with a toggle) |
| `/privacy` | Required for a form that collects founder data from UK visitors |

### The five-second test (home, first screen)

| Question from the brief | Answered by |
| --- | --- |
| Who I help | Dateline: "Pre-seed & seed founders · US & UK" and the hero kicker |
| What problem I solve | H1 and lead: investors can't follow or retell the case |
| Why my approach is valuable | Lead: "The narrative first, then the deck." The fuller answer is in § 03. |
| What they can hire me for | The "What you can hire me for" index box beside the hero, with all four services and prices |
| What to do next | Two CTAs: **Discuss your raise** (primary) and **Request a free deck audit** (secondary) |

---

## 4. Conversion plan

- **Primary CTA:** "Discuss your raise" goes to `/work-with-me`. It's in the header on every page, in the hero, and in the closing band of every page.
- **Secondary CTA:** "Request a free deck audit" goes to `/work-with-me?type=audit`. The form opens with "mini-audit" selected and the deck link required.
- **Qualification is built in.** The fit / not-a-fit lists screen out bad leads before they write. The form asks for stage, raise size, timing, traction and the hardest part of the story. Every service CTA preselects its service in the form (`?service=rewrite`).
- **Secure deck sharing:** the form asks for a view-only link (DocSend, Google Drive, Pitch or Papermark) instead of an attachment, so the founder controls access and can revoke it. This is how founders already send decks to investors.
- **Prices are public.** This is consistent with his firm, and it qualifies leads: nobody enquires and then leaves at the quote.
- **Honest friction reducers:** "I read every enquiry myself", "reply within two business days" and "no success fees".
- **Analytics:** Plausible, which is already his tool at Maneuver & Co. It's cookieless, so there's no cookie banner. Goals:
  - `CTA` with `cta` and `location` props, on every CTA click
  - `Enquiry` and `Audit request` on successful form submits, with `stage`, `timing` and `services` props
  - `Contact click` on email, X and LinkedIn clicks
- **Booking:** a "book a 20-minute call" option appears on the contact page once `bookingUrl` is set in `src/site.config.ts`. It's off by default, because his working style is written-first.

---

## 5. Credibility without invented proof

The brief says every claim about past projects must be accurate and verifiable. So:

- **No testimonials, client logos or results are invented.** None were supplied.
- **The Work section shows his thinking.** The notes are analyses of the slides that decide early raises (market sizing, traction, competition, "why now" and the ask). Each has a before/after slide. Every example is labelled **"Illustrative. The company, numbers and events are invented to show the reasoning."** This follows his firm's own format ("These are investigations, not testimonials").
- **Client case studies get their own slot.** Until one exists, the empty state is honest: "Client work appears here with the founder's permission… ask and I'll share what I can."
- **Adding proof later is one Markdown file.** Use `src/content/work/_case-study-template.md`, which has fields for client, stage, sector and a *verifiable* outcome.

---

## 6. Design system

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F4EFE6` | Page background (warm ivory) |
| Sheet | `#FBF8F2` | Term sheets and slide mock-ups |
| Ink | `#1B1A17` | Headlines and rules |
| Text | `#3B3833` | Body copy |
| Muted | `#6B655B` | Meta text (meets AA on paper) |
| Rule | `#D9D1C2` | Hairlines |
| Oxblood | `#7A2222` | Accents, primary CTA, and the closing field |

- **Headlines:** Source Serif 4, display optical size, with italic for the turn. It's sharp, reads like a research note, and is deliberately different from the Newsreader his firm uses, so the two brands are related but distinct.
- **Body and UI:** Schibsted Grotesk, which was drawn for a news publisher.
- **Fonts are self-hosted.** Nothing loads from Google, which matters for UK GDPR, and everything is preloaded.
- **Layout:** 12-column grid, 1320px max, mobile-first, 16px minimum side gutter.

### Art direction: the editor's red pen

After the first pass read as too quiet, the style was built around one idea that is also the service: **Raymond red-pens your deck.**

- **Hero, Fig. 1.** A traction slide sits on a small stack of paper. As the page loads, a red pen strikes the headline, writes the rewrite above it, circles "2,000+ users" and adds margin notes ("A total, not a rate.", "Says who?"). The slide leans towards the cursor. Once the edit has played, visitors with a mouse can pick up the pen and mark it up themselves.
- **The pen recurs.** "Explain" is underlined in the hero headline, "public" is circled next to the prices, and "A deck designer." is struck out above "The thinking a deck is made of."
- **A narrative ticker.** A slow market-style ticker shows what investors discount (▼, struck through, e.g. "If we capture just 1%") and what they reward (▲, e.g. "A rate, a cohort, a source").
- **Rhythm of bands.** The page alternates ivory, ink, desk tan and oxblood instead of running one long ivory scroll.

### Round three: no plain lists

After the second pass still read as boring, every section that had been a list was turned into something you do or watch. This follows what this month's Awwwards winners do: LPAS's expanding service panels and Neutomni's set pieces. It also follows James's own pinned showcase chapters.

| Section | Was | Now |
| --- | --- | --- |
| § 01 The problem | Four columns | **A pinned story.** One draft market slide stays on screen while the page scrolls. Each of the four problems marks it up in turn: the headline is struck ("So why is it an investment?"), the claims are circled, investor questions pop up as speech bubbles, and three "PASS" stamps land. Then the slide turns over to show the rewrite. Progress tabs with filling bars sit along the bottom, after James's Showcase. |
| § 02 Services | Four term-sheet cards | **Expanding panels.** Four spines in paper, desk tan, ink and oxblood. Hovering over or clicking a spine unfolds it into the full term sheet (for, you get, covers, fee, CTA) while the others fold away. On phones they become an accordion. |
| § 03 Fit check | A two-column "good fit / not a fit" list | **A term sheet that writes itself.** Five quick questions (round, deck, meetings, investor list, timing) draft a sheet on the right: the engagements that fit, in order, the indicative fee, and an enquiry link with those services already ticked. Series A and later is told plainly that it's probably not a fit. On phones, a summary bar follows the questions. |
| § 04 Before & after | Pill tabs | The tabs are **slide thumbnails**, like a presentation app's slide sorter, above the drag-to-compare slide. |
| The line | A pull quote | **Kinetic type.** Three huge lines drift in opposite directions as they pass through the screen. |
| § 05 Approach | A four-column list | **Stacking cards.** Each principle is a full-width card that pins and piles on the last, which sinks back and darkens. |
| § 06 Process | Bars that animated in once | **A pinned chart.** The bars grow as you scroll, a "Ready for the room" counter climbs to 100%, and a trend line is drawn across the tops. |
| § 07 Notes | An index list | **A shelf of slides** you drag sideways, after the bookshelf slider on the Miranda reference. Each card shows the rewritten headline, with the original struck through beneath it. |

**Site-wide:**
- Lenis smooth scrolling.
- Page-to-page transitions that slide the new page in.
- A cursor label that says what you can do: "Drag", "Open" or "Draw".
- The Services page opens with the panels and the fit check.
- The Work page puts the notes on the shelf.
- The About page's beliefs are stacking cards.

**Fallbacks:** with reduced motion turned on, or JavaScript off, nothing pins. The story shows all five steps with every mark drawn, the panels are all open, the chart is fully grown, and the shelf scrolls natively.

### Round four: a Liquid Glass version

James asked for a second version in Apple's Liquid Glass language. It's the same site and content, built with `PUBLIC_THEME=glass`, and deployed separately for comparison.

- **The backdrop** is ink folding through water, in the brand's oxblood, copper and amber. It's drawn in WebGL behind the page, with a faint broadsheet grid that the glass visibly bends. Its mood shifts by section: ember through the problem story, dawn through services and the chart, oxblood at the quote and the footer.
- **Glass** sits under every panel, button, card and the floating capsule nav. It bends the backdrop at the rim and is flat in the middle, the way Apple's glass lenses. It frosts what's behind it, splits colour slightly at the edge, and carries a rim of light that turns towards the cursor. Tints follow the paper version's bands: clear, amber, smoke and oxblood.
- **Glass lettering:** the masthead name, the drifting quote and the footer signature are cut from glass. Each one condenses out of a blur the first time it comes into view.
- **A liquid droplet** follows the mouse and melts into any glass it passes, like iOS controls morphing.
- **What stays paper:** the slides themselves (hero, story, before/after, notes shelf) stay paper, sitting on glass. The work is still the work.

**Legibility:** glass under text is capped in brightness, so ivory text keeps its contrast whatever flows behind it.

**Fallbacks:** without WebGL2, the same elements get CSS frosted glass. The fixed nav frosts the page's own text in CSS, because the canvas can't bend real text.

---

## 7. Tech

- **Astro**, the same stack as maneuverandco.com. Pages are static HTML with no JavaScript framework. The only scripts are the form handler and the analytics shim.
- **Editing copy:**
  - Site-wide details (email, socials, booking link, form endpoint, analytics, portrait) are in `src/site.config.ts`.
  - Each service, with its price, is a Markdown file in `src/content/services/`. Change a price once and it updates on the home page, the services page and the structured data.
  - Notes and case studies are Markdown files in `src/content/work/`.
- **SEO:**
  - Per-page titles and descriptions, canonical URLs and Open Graph/X cards with a generated share image
  - `sitemap-index.xml` and `robots.txt`
  - JSON-LD for `Person`, `ProfessionalService` (with priced `Offer`s) and `Article` on notes
- **Form:** posts JSON from the page. It never opens a mail app. It works with FormSubmit (default, no account needed) or Formspree (his firm already uses it): swap `formEndpoint`. It has a honeypot, inline success and error states, and fires the analytics goal.

---

## 8. Confirm with Raymond before launch

These are written to the brief and to his firm's stated practices, but each one is a promise on his behalf:

1. **Domain.** The site is live at `raymond-ekpo.vercel.app`, and `src/site.config.ts` points there. `raymondekpo.com` doesn't resolve today. When Raymond has a domain, connect it in Vercel and update `url` and `plausibleDomain`.
2. **Email.** The site uses `raymond@maneuverandco.co`, from his firm site. Swap it if he wants a personal address.
3. **Form endpoint.** FormSubmit asks him to confirm his address on the first submission. Alternatively, create a Formspree form and paste its URL.
4. **"Reply within two business days."** This is taken from his firm's intake page.
5. **Service deliverables, revision approach and inputs** on `/services`. These are drafted from the brief.
6. **Pitch Deck Creation** includes both a send-ahead version and a presenting version. Confirm he offers both.
7. **Mini-audit:** "limited each month", "three changes I'd make first" and the "raising in the next six months" qualifier.
8. **FAQ:** no success fees or percentage of the round, NDA on request, and US/UK focus.
9. **Privacy notice wording and retention period.** Have it checked.
10. **Portrait.** None was supplied, so the About page uses a typographic byline plate. Add a photo path to `portrait` when he has one.
11. **Booking link** (Cal.com or Calendly), if he wants the call option shown.
