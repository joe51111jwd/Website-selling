# 04 · DIRECTION

### How we got to the rendered Waterline, and the two rules every screen serves

This is the decision record. It says what James asked for, in his words and in order; what the meaning work
found; which other concepts were started and then parked; why the Waterline is Michael's own picture and not
one we invented; and the two rules the page is judged by: **scroll only**, and **it's all about Bootloader clicks**.

Read it before changing the direction. For what exists today and what comes next, see
[`00-README.md`](00-README.md).

**References.** `[BL n]` is line *n* of `susd-options/source/public_bootloader.md` (the SUSD Bootloader V16).
`[M n · copy.ts:k]` is manuscript line *n* as recorded on line *k* of `susd-options/source/src_copy.ts`.
`[TASTE]` is James's words as recorded in `susd-options/brief/TASTE.md`. Michael's lines are in straight double
quotes with a tag and are character-exact (checked by `tools/check_meaning_quotes.py`, section 8). Labels and
my own notes are in `code` or plain text, never in straight quotes with a tag.

---

## 0. The decision on one screen

| | |
|---|---|
| **Direction** | **WATERLINE, rebuilt as real Blender renders.** Michael's thesis is a physical object in a real place, and real water rises toward it as you scroll. |
| **The words** | "Every hire compounds complexity before it compounds capacity." [M 696 · copy.ts:60] |
| **What scrolling does** | Each scroll step is one more hire. The water rises by the coordination pathways that hire adds, n(n-1)/2: 8 people = 28, 12 = 66, 13 = 78, 15 = 105, 39 = 741. Every step is bigger than the last, so you feel the compounding in your scroll wheel. |
| **The arc** | Dry up to twelve. At thirteen the water touches the words. Past fifteen they go under (Redline). Then Up, Side and Down change the physics: Down drains, Side raises the ground the words stand on, Up loads again, only to the line. Each cycle ends higher. The words finish high and dry with air above the water (Oxygen), and the story ends on the SUSD Bootloader. |
| **Rule 1** | **Scroll only.** A visitor who never clicks still gets the whole argument. Clicks exist only for the two paths. |
| **Rule 2** | **Bootloader clicks are the goal.** The Bootloader (a file, V16, 35,445 words, for any AI assistant) is visible and attractive from the first screen to the last, framed as the fix the story builds to. The book is the second path. |
| **Standing rule** | Not AI-made, not template-made, not flat: photographic renders, type with character, no SaaS stack ([`02-AI-TELLS.md`](02-AI-TELLS.md), [`03-TYPE.md`](03-TYPE.md)). |
| **Who decided** | James chose it in his third message (section 1). The images (drowning, Redline, Oxygen, the line at twelve) and every sentence on the page are Michael's (section 4); the place they are staged in (a ship's side) and the craft are ours. |

---

## 1. James, in order

Word for word, with what each message changed.

**Message 1, the night of Thu 29 / Fri 30 Oct** (the end of a longer message, recorded in full in `TASTE.md`
section 1; it produced the four options built that night: The Title, Count Yourself, Waterline, Corrected Edition):

> "If you have blocks and left aligned text then rn you just look at the blocks and don't read the text. Then people wonder wtf in the point of this site. They need to know weather they like it or not" [TASTE]

What it changed: the words must be the thing you look at, not a caption beside a picture; and a stranger must
be able to tell within seconds whether the book is for them.

**Message 2, 30 Oct, after seeing the four built options** (from the project brief; not in `TASTE.md`):

> it needs to not look ai. use blender to render everything so it wont look flat and ai made. it looks too ai made. find intresting fonts that ai wouldetn use. make your own. idk. ... try your best to derive meaning ... document everything and make this good.

What it changed: this whole render project. Meaning first ([`01-MEANING.md`](01-MEANING.md)), then the list of
what reads as AI-made ([`02-AI-TELLS.md`](02-AI-TELLS.md)), then type, including a face of our own, Plimsoll
([`03-TYPE.md`](03-TYPE.md)), then Blender look-dev ([`05-RENDER-PIPELINE.md`](05-RENDER-PIPELINE.md)), all of it
written down.

**Message 3, 30 Oct, later the same day, after the four options** (from the project brief; not in `TASTE.md`):

> You just need to show the story the waterline could work but the user should only need to scroll nothing else if they don't want to. It should get the point across even if they click nothing. It's all about getting clicks on the boot loader

What it changed: it chose the direction (the Waterline), and it set the two rules in sections 5 and 6. The
concept lenses that were in progress were parked (section 3), and the render brief
([`../briefs/BRIEF-waterline-render.md`](../briefs/BRIEF-waterline-render.md)) was written for the Waterline.

**Since then** (31 Oct, about 00:30 UTC), James on the first renders: "it looks like a sewer". That changed the
*place*, not the direction: the canal lock became a ship's side in clear daylight water. It is logged in
[`07-CLIENT-FEEDBACK.md`](07-CLIENT-FEEDBACK.md) and answered in [`06-HERO-BUILD.md`](06-HERO-BUILD.md) section 13.

---

## 2. The meaning work

Full document: [`01-MEANING.md`](01-MEANING.md). Every quote in it was checked by script against its line.
What it found, in short:

1. **The core truth** (section 0, in my words): a founder's exhaustion is physics, not failure. Every person
   added brings more coordination than capacity, so a self-funded business that only grows up gets bigger,
   poorer and heavier until it breaks past twelve. One that grows, settles and prunes in turn starts every
   climb from higher ground.
2. **The book is an argument against flatness** (section 2). Michael calls traditional scaling a line and his
   own model a structure with volume and weight. A flat page is a picture of the business he argues against.
   Rendered depth on this site is not decoration: it is the thesis. This is why James's "use blender" and
   Michael's book point the same way.
3. **The mechanism** (section 3): complexity grows like n(n-1)/2 while capacity grows like n; twelve is the
   ceiling; 13-14 is the Threshold; 15-39 is the Graveyard; the cycle (Up, Side, Down) banks systems and
   margin so each climb starts higher.
4. **Michael's own images** (section 5): every metaphor he uses, grouped into families. The water family (5.B)
   is where the Waterline comes from (section 4 below).
5. **What it hands the design** (section 8): use only his images; make the words the object; one physical law
   per screen; self-selection is a location (his question "How many people are on your team?" [BL 310]); the
   first five seconds must hold the claim, who it is for, and the two paths.

---

## 3. The concept lenses that were started and parked

Before James chose, two *lenses* (ways of finding a concept) were written up, two concepts each. None was
rendered. They are parked, not rejected: James chose the Waterline before seeing them, and they stay on file in
case the Waterline fails.

**Lens 1, his images** ([`concepts/his-images.md`](concepts/his-images.md)): only pictures Michael himself put in
the book.
- **his-images-1 · All Three Dimensions.** The title built as a building (UP a column, SIDE along the floor, DOWN
  back into the room, bolted at the hyphens) under a slot of sunlight that falls on "You can't build a building with only height. You need all three dimensions or it topples." [BL 816]
- **his-images-2 · The Wrong Map.** A cut-plywood relief model of a founder's world laid out by team size, with a
  red thread pulled dead straight across it from 1 to the far peak, under "There are two kinds of growth. You inherited the wrong map." [BL 838]

**Lens 2, physical truth** ([`concepts/physics.md`](concepts/physics.md)): a real physical system whose behaviour
is the book's argument.
- **physics-1 · The Fold.** The title printed on one sheet of card, folded at its two hyphens, standing on edge and
  carrying a hardcover on its creases: depth gives a flat sheet its strength.
- **physics-2 · The Lifts.** A rammed-earth wall built in twelve layers with "Up. Side. Down. Repeat." [M 1713 · copy.ts:125]
  cut into them, beside the same earth poured in one go, which slumps when the forms come off.

**What the parked work still gives the Waterline** (my reading; each is in the render brief):
- From all four: the words are the object and the light falls on them, so looking is reading.
- From The Wrong Map: self-selection by team size. Michael's question heads the readout on the first screen,
  with the bands (Team 8-12, Threshold 13-14, Graveyard 15-39) as a gauge.
- From The Lifts: each cycle leaves the words higher. Side adds new plating under them.
- From the thread idea (01-MEANING 5.B6, rejected as a hero in `physics.md` section 1): the n(n-1)/2 count, now
  carried by the volume of water instead of strings.

---

## 4. Why the Waterline is Michael's picture, not ours

01-MEANING section 5.B, *Physics of the body*, holds three of his images that are about water and air. The
Waterline is those three images, in his order, with his numbers.

| His image | His words | In the render |
|---|---|---|
| **Drowning** (5.B3) | "The business is drowning. Every addition makes it worse." [BL 717] He uses it for the founder too: "Founder drowning in questions" [BL 1867]; and in the reader's own voice: "I'm drowning in tasks" [BL 4508]. | Past fifteen the water closes over the sentence and the camera goes under with it. The drowning looks serious because of how high the water is. |
| **Redline** (5.B1) | "Complexity > Capacity = Redline." [M 2997 · copy.ts:80] "Every addition makes it worse." [M 2997 · copy.ts:81] | Still under water, the readout races to 39 people and 741 pathways; a red lamp's light comes down through the surface. |
| **Oxygen** (5.B2) | "Capacity > Complexity = Oxygen." [M 2999 · copy.ts:119] "The business can breathe. Systems carry what the business creates." [BL 718] | The end state: the words high and dry, with clear air between them and calm water. |
| **Pathways** (5.B6) | "Each addition doesn't add one unit of complexity — it adds n-1 new interaction pathways." [BL 2339] | The amount of water. Each scroll step adds n-1 pathways, so each step of water is bigger than the last. |
| **The line at twelve** | "12 isn't where you're trying to get. It's the line you don't cross." [BL 544] | A load-line mark painted at the 12-person level. On a ship it is literally the line you must not load past. |
| **The cycle** | "Each cycle starts higher than the last" [BL 4488] | Down unloads (the hull rises out of the water), Side welds new plating under the words, Up loads again, only to the mark. |

Two things make this more than a good fit:
- **01-MEANING wrote the Waterline down before James chose it.** Its suggested render for Drowning (5.B3) is
  water rising as additions drop in, each displacing more than the last, with the title words submerged until
  systems raise the walls. James's "the waterline could work" picked an image that was already Michael's.
- **It answers the flatness finding.** Water has volume, refraction and a surface you can go under. Going under
  with the words at Redline is the one moment a flat page cannot fake.

The meaning work ranked other images higher for carrying the *whole* argument (01-MEANING 5.9: the title as a
structure, the destination map, the thread). The Waterline is strongest on the problem (Drowning, Redline) and
weaker on the cycle, so the cycle is carried by physical changes James can see without a caption: drain, new
plating, words climbing, a higher waterline each time.

**What was kept from the CSS/WebGL Waterline** (the one James said "could work"; `susd-options/waterline/`):
the thesis as the hero words; scroll = hiring; water = pathways; the band gauge with Michael's question at its
head; Up, Side and Down as water level and ground; the drain as the reward for opting in; two paths. **What was
dropped:** everything 02-AI-TELLS lists against it (Bricolage and JetBrains Mono, cream paper with grain, tracked
mono caps, the pill button, CSS water and a WebGL shader, the centred hero stack), and anything that needs an
interaction other than scrolling. The full table is in the render brief, section 16.

---

## 5. Rule 1: scroll only

James: "the user should only need to scroll nothing else if they don't want to. It should get the point across
even if they click nothing."

What it means on this page:
- **One input.** Scrolling is the only thing the story asks of you. Each step is one hire, and the frame shown
  always follows the scroll position.
- **The first screen works with no scroll at all.** It holds the claim (the rendered sentence), who it is for
  (bootstrapped, self-funded founders with teams of 1-12), Michael's question "How many people are on your team?" [BL 310]
  with the current answer (8 people, 28 pathways), and the Bootloader.
- **Every beat reads with zero clicks.** One caption at a time, Michael's words, in a slot that never covers the
  sentence. The picture changes enough to be understood without reading the caption.
- **Banned:** hold-to, dials, steppers, hover-only content, click to reveal, toggles, horizontal sections, scroll
  that drifts or traps the wheel (02-AI-TELLS A34, A35). The four options had some of these (Count Yourself's
  `+` and `−` dial is the example in A34).
- **Clicks exist for the two paths only:** the Bootloader and the book.
- **Without JavaScript or with reduced motion** the same story arrives as stills and the same two paths
  (render brief, section 10).

The test: put one hand on the scroll wheel and nothing else. At every beat you can say what is happening and why,
and at every beat you can see where to get the Bootloader.

---

## 6. Rule 2: it's all about Bootloader clicks

James: "It's all about getting clicks on the boot loader".

**What the Bootloader is.** The `SUSD Bootloader`: a file, a spec, an operating system for running the book with
your AI. Not a prompt. Version 16, 35,445 words. It works with any AI assistant; BL 221 names Claude, ChatGPT and
Gemini. Michael's own line for the difference: "The file is the operating system." [M 4497 · copy.ts:61]

**How the page earns the click** (the render brief, section 6, has the full design and the reasons):
- **Visible from the first screen to the last.** Desktop: a dock at the top right in a band no story object
  enters. Phone: a solid bar at the bottom, in space the render keeps free. Both carry the name and one
  `Get it free` button; the desktop dock also says, as a label, what the file does for you and that it works with
  Claude, ChatGPT and Gemini. The dock and bar step aside while the offer or the form is on screen, so each screen
  has exactly one button (06-HERO-BUILD 13.7).
- **Framed as the fix the story builds to.** The load-line mark the water obeys all the way through is also the
  Bootloader's mark, so by the end the mark means *the thing that keeps you above the line*.
- **Asked for after the proof.** A mid-story offer comes only after the first full cycle has visibly worked, in
  Michael's words: "The pages are reference. The file is the operating system." [M 4497 · copy.ts:61]. The
  finale (`#get`) holds the one form, with the file's facts (V16, 35,445 words).
  (The render brief had the dock's line switch to the second sentence during the cycle; round 4 keeps the dock in
  one voice instead.)
- **The click does something physical.** On submit the water drains away. James asked for one dramatic button: "It's like really dramatic" [TASTE].
- **The MVP opt-in.** The email field submits by opening `https://scaling-up-side-down.vercel.app/appendix#get`
  (the live opt-in on Michael's site). A direct post to his list would remove the second email entry; it writes to
  his live list, so it waits for James's OK (06-HERO-BUILD 13.8, item 3).
- **The book is the second path**, quieter, labelled `Pre-orders open soon` until a pre-order link exists.
- **No dark patterns:** no pop-ups, countdowns, fake counts, pre-checked boxes or confirmshaming (brief 6.7).

---

## 7. What this record does not decide

These are open, and listed with their evidence in [`06-HERO-BUILD.md`](06-HERO-BUILD.md) section 13.8:
the ship's side as the setting; the rendered face (Ortica Angular Bold capitals on the hull, with our Plimsoll for
the title, figures and mark); the opt-in mode; the red/green load signal; the sequence budget; the dock button
(outlined or filled). The status of the renders is in [`00-README.md`](00-README.md).

---

## 8. Quote check

Every straight-quoted line of Michael's in this file was run through
`python3 tools/check_meaning_quotes.py docs/04-DIRECTION.md` (from `susd-render/`). James's messages 2 and 3 are
not in `TASTE.md` and are set as plain block quotes without quote marks; they are copied from the project brief.
The checker lists James's short untagged quotes (from messages 2 and 3, and "it looks like a sewer" from
`07-CLIENT-FEEDBACK.md`) for a look by hand; each was compared with its source.

Result (31 Oct 2026): **20 quotes verified, 0 failed**; the untagged ones are James's, checked by hand.
