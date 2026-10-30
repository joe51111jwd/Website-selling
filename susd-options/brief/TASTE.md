# TASTE: what James loves, what he hates, what Michael asked for

Read this before you design anything for *Scaling Up-Side-Down*. It is distilled from
`source/context_PROJECT-RECORD.md` (all 49 of James's messages, the discovery call, every direction
tried), `source/context_client-log.md` (Michael's Oct 27 feedback) and `source/CLAUDE.md` (standing
rules). Quotes are James's or Michael's exact words; `[#n]` is James's message number in the record.

---

## 0. The one-paragraph version

James wants a **new idea**, built as a **one-page MVP with full craft**, where **the book's message is
the thing your eye lands on**. Within seconds a visitor must know what the book says, who it is for,
and whether they like it. The visual must never out-compete the words. But the words cannot sit on a
flat text page either: he hates flat, AI-looking, Apple-looking, cluttered, wall-of-text, and
"cool but not about the book". He loves high fidelity, real depth, a cool opening moment, one
dramatic single action, smooth and clean motion, desktop first and clean on phones, Awwwards ambition.
He wants **options**, and he picks by looking at screenshots.

---

## 1. Tonight's complaint (Thu 29 / Fri 30 Oct), and what it means for layout

His words:

> "I want a new idea And a new. Full effort site rendered by morning. Everything needs to be perfect
> and I want options I would say just build a mvp to get the point across but it needs to look good
> but display a clear message. The message of the book and it needs to be something where you want to
> look. If you have blocks and left aligned text then rn you just look at the blocks and don't read the
> text. Then people wonder wtf in the point of this site. They need to know weather they like it or
> not"

What it rejects: the live site's composition. A big, beautiful Blender render (the blocks) owns the
screen, and the message sits in small left-aligned overlay text beside or over it. The eye goes to
the picture and never reads the sentence, so nobody learns what the book says.

What it implies, concretely:

1. **The message is the hero.** The first viewport's focal point is a sentence (or a few words) from
   the book, set large, composed so it is read first. If you screenshot the first screen and squint,
   the brightest, biggest, most alive thing must be the words.
2. **No caption-beside-a-picture layouts.** No small left-aligned text column next to or over a
   dominant image or 3D object. No "kicker + headline + detail" stack tucked in a corner of a render.
3. **The visual serves the sentence, or *is* the sentence.** If there is imagery, it illustrates the
   exact claim on screen (the cycle, the 12, the break) and is subordinate in size, contrast or motion.
   Better still: the type itself carries the depth, motion and drama (the words are the object).
4. **Seconds, not scrolls.** The first screen alone must answer: what is this (a book by Michael
   Wentz), what does it say (the thesis), who is it for (bootstrapped founders, teams of 12 and under),
   and what do I do (get the Bootloader / the book). Scroll can deepen it; it must not be required.
5. **Let people self-select.** "They need to know whether they like it or not." A visitor should be
   able to recognize themselves (or not) fast. The Bootloader's own first question is
   "How many people are on your team?" (Bootloader L310, verbatim), and the unsent draft reply to
   Michael already proposed opening with it. That fits tonight's ask exactly.
6. **Still not flat.** "Display a clear message" is not permission for a plain text page. Big type with
   real craft: depth, light, layering, considered motion, a strong single interaction.
7. **Fewer words, bigger.** "Less text" (his Oct 25 rule) and "the message must be what you look at"
   (tonight) resolve the same way: one idea per screen, very few words, set large.
8. **New idea.** The Blender block scroll story is what is being replaced. Do not resubmit it as an
   option. (Michael liked the blocks; see section 7 for how to carry what he liked without them.)

---

## 2. What James loved (his words)

| What | His words | Ref |
|---|---|---|
| A reference site that pulls you in | "It's really good. The homepage design is really good. It really draws you in." (an x.com/devdsgn post) | [#1] |
| Awwwards-level bar | "Look at awards.com for inspo." / "maybe we'll win an awwward" | [#1] [#3] [#15] |
| No clutter, no BS | "We don't do clutter effects. We don't do BS. We make the best." | [#1] |
| A cool intro | "We want to have some cool intro." / "I want a cool animation when you log onto the site, and then that home page needs to be a banger." | [#1] [#2] |
| The very first intro ("scaling soundbar") | "the first one was good. The intro, the scaling soundbar, was good, but the rest is just horrible" | [#3] |
| High fidelity | "There's something there with the reflection. I like it because it's high fidelity" / "The reason I showed you that was because of high fidelity." | [#2] [#4] |
| Index (round 1) | "Index: cool as fuck, right? ... I'm definitely going to do a website like this, but I think maybe if you made it more like a manuscript, like a book." / "right now it's so cool, bro." | [#8] |
| Wireframe | "Wireframe is interesting." | [#8] |
| Pyramid, complexity | "The pyramid one is interesting" / "The complexity thing is interesting, but I don't know." | [#2] |
| 97 (the look, not the sense) | "Oh shit, it's actually tough as hell. Just doesn't make any sense at all." | [#8] |
| Feeling alive | "use React, floating components, rendering images, and other things to actually make it feel more alive." | [#10] |
| Simple homepage with one really cool part | "the homepage should just be simple and give the vibe, right? If you want to show me that the homepage can be simple, but then there's a part that makes it really cool, then yeah." | [#10] |
| Real rendering and depth | "the best stuff is like, real, you know, like rendering and like depth, all that stuff on top of it, like the stuff that makes UI UX look so good." | [#13] |
| Story you understand by the end | "every scroll is moving through the experience and by the time I'm done with it I should understand what the point of the book is and it should convince me to really want to copy that prompt and by the book" | [#15] |
| The narrative: too fast, falls over, foundations | "literally too fast and then they fall over and then the best companies they build strong foundations ... without strong foundation you can't scale" | [#17] |
| The Blender blocks build (at the time) | "This looks super good though" | [#18] |
| Opening on just the object, which assembles as you scroll | "when you go in this is just what you see. You just see the blocks and then like as you scroll like they like rearrange themselves and they stack" | [#25] |
| Smooth and clean | "make sure when its on the website its vary smooth and i want it to be clean ." | [#31] |
| One dramatic button | "It's not even a copy the prop it's just like a button click it. It's like really dramatic" | [#44] |

---

## 3. What James hated (his words)

| What | His words | Ref |
|---|---|---|
| Pretty but useless / no message | Reflection: "It just doesn't seem useful. It doesn't seem like it conveys a good message, right?" | [#2] |
| Concepts he can't parse | "the flip doesn't make any sense. I don't get the flip." | [#2] |
| Basic, flat, AI-looking text | "it just feels so basic. The text on stuff looks AI-generated. I'm just like, I can't put that out there. It looks like it was AI-generated. It just seems flat. Nothing's high fidelity." | [#3] |
| Apple look | "This looks too much like Apple. I didn't want to make it look like Apple. ... I do not want it to look like Apple. It needs to be its own style." / "Right now, this makes no sense. I don't like this at all. Needs to have its own style" | [#4] |
| Cool but not about the book (his most repeated verdict) | "Ink is chill, but again, nothing to do with his book." / "Another cool one, but again, I just don't see how it's useful." / "a lot of these are cool, but they just don't display." / "all these designs are cool, but they don't actually pertain to what his book is about." | [#8] [#9] |
| Gimmick objects | "where the book is rotating the plinth one, I don't know, but that just doesn't seem cool." | [#8] |
| Flat text layouts | "it just looks so flat. These are just doing text and other things." | [#10] |
| Clutter, too much going on | "I think the index is too cluttered." / "Coordination tax, again, a lot of these just have a lot going on. It just needs to be simple." | [#10] |
| Boring | "The 'read and use' just seems kind of boring." | [#10] |
| Flat HTML that looks bad | "I don't want just a flat HTML element where you just click it and it just looks bad. ... Looks too AI-generated. I don't give that shit to my clients." | [#10] |
| Too complicated | "It seems too complicated. I just don't like that idea to be honest" | [#11] |
| Building unasked / slow | "Keep coming with more ideas, but don't make it. You're wasting token, bro." | [#11] |
| Game-like or AI-like visuals | "it can't look like a game. It can't look like AI" | [#13] |
| Plain text or AI images | "all the shit you're building is like just like text, or ... AI generated images. It doesn't look good either." | [#13] |
| Clutter on phone | "clean it up on phone a bit so it's not too like cluttered" | [#18] |
| Wall of text | "we have to make the text have more depth and not be like a wall of text but still get the message across" | [#24] |
| A "random box" CTA | "have a really cool way to copy it rather than just like a random box" | [#24] |
| Off-brand sections | "Right now, it's just not SUSD, bro. Like, what?" / "No, it's not cool right now." | [#37] |
| Visual that drowns the message (tonight) | "If you have blocks and left aligned text then rn you just look at the blocks and don't read the text. Then people wonder wtf in the point of this site." | tonight |

---

## 4. Patterns in his feedback

1. **"Cool, but what's the point?"** Aesthetic alone always fails. Each verdict on the ten directions
   came back to "nothing to do with his book". Every visual decision must trace to a claim in the book.
2. **Message first, now explicitly.** Oct 24: "get the message across, but in a cool way" [#9].
   Oct 25: "get the message across with ... less text" [#18]. Tonight: the message must be what you look at.
3. **Flat = death; AI-looking = death.** He uses "flat", "basic", "AI-generated", "nothing's high
   fidelity" interchangeably. Generic SaaS hero, stock gradients, template cards, text-on-a-box, AI
   imagery all read as this.
4. **Its own style.** Not Apple, not a template, not something seen before. He showed a reference for
   its fidelity, not to be copied ([#4]).
5. **Simple, but with one moment.** "It just needs to be simple" [#10] plus "a part that makes it
   really cool" [#10]. One hero idea, executed perfectly, beats many ideas.
6. **Dramatic single actions.** A cool entrance animation; one dramatic button; an object that
   assembles. He likes a moment, not a dashboard.
7. **Depth and life.** "Floating components", "rendering", "depth", "more alive" [#10] [#13].
8. **Less text, never a wall of text.** One idea per screen.
9. **Smooth and clean.** Motion must be buttery and never janky [#31].
10. **Desktop first, phone matters.** "I understand desktop is more important, but how does it look on
    mobile" [#23]; "I don't know how many people are gonna see you on the phone" [#44]. Design for a
    desktop screenshot first, then make phone clean and uncluttered.
11. **He decides by reacting to visuals.** He often says "I don't know" and then knows instantly when
    he sees it. He asked for screenshots again and again ("Can I see screenshots?", "let me see the 10",
    "Just generate a screenshot of a homepage. That's all I really care about") [#5-#8]. Give him
    distinct options with clear desktop (and phone) screenshots, fast.
12. **Speed and momentum.** He checks in often ("when will it be on vercel", "hows it going?") and
    hates wasted effort on unwanted builds [#11]. Tonight he explicitly wants full effort, by morning.
13. **Narrative arc lands.** The story that worked: grows too fast, topples, rebuilds on foundations,
    cycles Up/Side/Down. The arc was right; the presentation (picture over words) is what failed.

---

## 5. Every direction tried, with his verdict

| Round | Direction | Verdict | Interesting? |
|---|---|---|---|
| First mockups (Sat 24 Oct, early pm) | The first intro, "the scaling soundbar" | "the first one was good" | **Yes, loved** |
| | Reflection | High fidelity, but "doesn't seem useful", "doesn't ... convey a good message" | Partly (fidelity) |
| | Pyramid | "interesting" | **Yes** |
| | Flip | "doesn't make any sense. I don't get the flip." | No |
| | Bootloader (loading) concept | "I don't really know about it when it loaded into something that was bad" | Unclear, no |
| | Complexity | "interesting, but I don't know" | Somewhat |
| | The rest of that set | "horrible", "basic", "AI-generated", "flat" | No |
| Apple-style homepage (2:59 pm) | Apple look | "too much like Apple", "makes no sense", "I don't like this at all" | No, banned |
| The ten (5:42 pm) | Index | "cool as fuck", but "I don't see how it works with the scaling upside-down point"; make it "more like a manuscript, like a book" | **Yes** (style) |
| | Ink | "chill, but again, nothing to do with his book" | No |
| | Rotating book on a plinth | "just doesn't seem cool" | No |
| | Curve | "Another cool one, but ... I just don't see how it's useful" | No |
| | Wireframe | "interesting" | **Yes** |
| | Stencil | "not it. Cool idea, but just not there" | No |
| | 97 | "tough as hell", but "doesn't make any sense at all" | Look yes, sense no |
| | Constellation | "why would we do Constellation? I don't see." | No |
| | Manifesto | "cool, but they just don't display" | No |
| Manuscript-driven round (6:24 pm) | Index (again) | "too cluttered" | No |
| | Read and Use | "kind of boring" | No |
| | Blocks | "I just don't like" | No |
| | 964 | "just doesn't make any sense" | No |
| | Coordination Tax | "a lot going on. It just needs to be simple." | No |
| | Round overall | "so flat", "Looks too AI-generated", "I want something more creative" | No |
| 10:07 pm | Another built concept | "too complicated ... I just don't like that idea" | No |
| 10:08 pm | 20 typed-out ideas | None picked; he then pitched his own idea (a business that grows and crumbles, real rendering) | No |
| Sun 25 Oct onward | Blender scroll story of wooden blocks (UP/SIDE/DOWN cover blocks, tower topples past twelve, ring of 12 systems, red CTA block) | "This looks super good" then; Michael liked it. **Rejected tonight**: you look at the blocks, not the text | Superseded |
| Sun 25 Oct | Section below the animation | "just not SUSD, bro" | No |
| Sun 25 Oct | Bottom copy section | "wall of text"; CTA "just like a random box" | No |

Takeaways from the list: he responds to **fidelity, a single strong idea, and a book-like or
manuscript-like feel** (Index, "more like a manuscript, like a book"). He rejects anything abstract
whose link to the book he cannot see in one look (Flip, Constellation, 964, 97, Curve, Ink). If a
concept needs explaining, it has failed.

---

## 6. What Michael asked for

**Discovery call (Tue 21 Oct)**
- Page 1 (homepage / book sales page): "visually compelling, communicates the core benefit and
  challenges conventional thinking." Page 2 (/appendix): functional and dense.
- Target reader: bootstrap founders with teams of 12 and under; especially founders who have grown to
  around 8 people, felt the pain and burnout of complexity, and are open to a different operating
  model. The book's first 7 chapters focus on diagnosis and **removing shame around not scaling**.
- Thesis: most bootstrap founders follow growth advice built for the 3% (true scale-ups with capital
  and a moat); the other 97% are poorly served. Today businesses rent scale, so complexity can be
  added faster than a team can absorb it.
- Framework: scale up to grow, sideways to stabilize, down to prune and simplify, then up again. A
  **cycle**, not a line. Guardrails: floor of 1, ceiling of 12, team-of-teams 40-70.
- Inversions: systems as the goal, not revenue targets; let the work reveal the role; complexity is
  the main cause of revenue plateaus.
- AI argument: AI makes output and rented scale cheap; review, judgment and discernment stay expensive;
  AI will push more companies into the scaling trap.
- The Bootloader: 35,000-word appendix; email opt-in to download it; the file gets updated over time
  and that keeps people on the list. Michael's priority: push new versions of the Markdown file easily.
- "Software as a book."

**Written feedback (Tue 27 Oct), the three priorities in his words**
> "helping visitors immediately recognize that the book is for them, making the central idea of
> cyclical growth (Up, Side, Down) clear, and figuring out how we guide them toward the book and
> Bootloader."

Also from Oct 27:
- "I really like that you're thinking about making the Bootloader something people want to share."
- "making it clear where they can 'Opt-in' to get the appendix instead of a 'copy the prompt'."
- The Appendix on its own page, crawlable for GEO (done: /appendix; keep linking to it).
- "I'd also distinguish the Bootloader from a generic AI prompt. It's a file/spec/software containing
  the OS, not just something to paste into AI."
- "I really like the visual storytelling with the blocks, the growing complexity, and the transition
  toward a different way of scaling." / "I definitely don't think you need to go back to the drawing
  board." / "I don't want to over-direct you ... I like where your creativity is taking this."

So every option must do all four, visibly, on the homepage:
1. **This is for you** (bootstrapped founder, team of 12 or fewer) recognized immediately.
2. **Up, Side, Down as a cycle** made clear (a rhythm that repeats, not a line).
3. **Two clear paths**: the book (pre-order; link pending, so "Pre-orders open soon") and the
   Bootloader (email opt-in; it is a file).
4. **The Bootloader as a file/spec/OS**, shown with version and word count (V16, 35,445 words),
   never as "copy the prompt".

---

## 7. Tensions to manage (judgment calls, not rules)

| Tension | Resolve it like this |
|---|---|
| James asked many times to "copy the prompt" ([#9] [#11] [#15] [#37] [#44] [#45]); Michael asked for an opt-in | **Michael wins** (it is his site and it is now live that way). The CTA is an email opt-in for the Bootloader file. Keep James's ask for drama: one dramatic opt-in action, not a form in a box. |
| Michael liked the blocks; James wants a new idea | Every option is a new idea. Carry what Michael liked (growing complexity, then a different way of scaling) through type, structure and motion instead of a hero render. Do not make the blocks the hero again. |
| "Less text" vs "the message must be what you look at" | Very few words, set very large. One idea per screen. |
| "Simple" vs "more creative / alive" | Simple structure, one exceptional moment. |
| "Homepage doesn't need to scroll" [#9] vs "every scroll is moving through the experience" [#15] | MVP: the first viewport carries the whole message on its own; scrolling may add depth (the cycle, the paths) but nobody should need it to understand the book. |
| "Real rendering and depth" vs "the visual must not compete" | Put the depth into the message itself (dimensional or lit type, layered planes, subtle parallax), or keep any image clearly secondary. |
| James once floated Higgsfield [#3] (AI video) | Overridden by his own later verdicts and by CLAUDE.md: no AI images. |

---

## 8. Hard rules

- **Copy is word for word.** Every sentence on a page comes word for word from `source/src_copy.ts`
  (manuscript quotes, line numbers in comments) or `source/public_bootloader.md` (the appendix). Only
  labels, buttons, numbers and UI microcopy may be written fresh. Do not paraphrase, merge or "punch
  up" a sentence. Note the source line for every sentence you use. (The draft reply's line "The cycle
  isn't something you install. It's something you stop resisting." is **not** in either source, so it
  cannot be used.)
- **No AI images or AI video.** Real type, real code, real renders, real diagrams only.
- **No Apple look. No flat text pages. Nothing that looks AI-generated.** The bar is Awwwards craft.
- **No clutter, no wall of text.** One idea per screen.
- **The message is the focal point.** No dominant visual with small left-aligned text beside or over it.
- **Bootloader = file/spec/OS, not a prompt.** Show its version and word count. Getting it is an
  **email opt-in**, not "copy the prompt". People upload it, then use the short starting prompt.
- **Two paths everywhere:** the book (pre-order link pending: "Pre-orders open soon") and the Bootloader.
- **Link to /appendix** ("Read the Appendix"); it must stay plain, script-free HTML for AI crawlers. The
  book prints scalingupsidedown.com/appendix.
- **Smooth and clean.** No janky motion; respect reduced motion.
- **Desktop first, phone checked.** Every section must be clean at phone width.
- **Title and author:** *Scaling Up-Side-Down* by Michael Wentz (the cover's spelling).
- **Accounts:** no keys in code or chat; no domain or DNS changes without James's OK.

---

## 9. Message anchors (verbatim lines that already say it)

Not a copy brief; just proof the words exist. Ref key: `M L###` = manuscript line, as cited in
`src_copy.ts`; `BL L###` = line in `public_bootloader.md`.

| Job | Verbatim line | Ref |
|---|---|---|
| Thesis | "Every hire compounds complexity before it compounds capacity." | M L696 |
| Removes shame / for you | "You were never the problem. The model you inherited was." | M L216 |
| Self-select question | "How many people are on your team?" | BL L310 |
| Who it is for | "This bootloader is built for Rented-Scale businesses with 1-12 employees." | BL L4252 |
| The break | "Past twelve, something breaks." | M L3509 |
| The equations | "Complexity > Capacity = Redline." / "Capacity > Complexity = Oxygen." | M L2997, M L2999 |
| The cycle | "Up. Side. Down. Repeat." | M L1713 |
| The cycle, explained | "Growth comes FROM completing cycles (Up/Side/Down), not from pushing through them." | BL L241 |
| | "The growth is real. The path is seasonal." | BL L851 |
| Different rules | "Same game. Different rules." | BL L243 |
| Book vs file | "The pages are reference. The file is the operating system." | M L4497 |
| | "The book changed how you think. This SUSD Bootloader changes how you operate." | M L4553, L4555 |
| AI angle | "In an open system, AI accelerates chaos." / "In a closed system, AI accelerates clarity." | M L4523 |

---

## 10. How to deliver to James

- **Options**, clearly distinct from one another (not five skins of one layout), each a complete
  one-page MVP at full craft.
- For each: a name, a one-line idea, a desktop screenshot of the first viewport (his main judging
  surface), a phone screenshot, and a live link.
- Apply the five-second test to each: from the first screen alone, can a stranger say what the book
  claims, who it is for, and what to do next? If not, it is not done.
