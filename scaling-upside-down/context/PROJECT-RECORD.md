# Scaling Up-Side-Down: project record

This is a text copy of the project record James made on Thu 29 Oct 2026. The original is
`context/source/2026-10-29-scaling-up-side-down-project-record.docx`. New messages from Michael or
James go in `context/client-log.md`; when state changes, update this file too.

## Where things stand

The site for Michael Wentz’s book *Scaling Up-Side-Down* is live at
https://scaling-up-side-down.vercel.app. It includes both rounds of his
feedback: the 27 Oct round (sign-up, /appendix) and the 30 Oct round (the
book first, one sign-up, the file by email only). The home page's last
release went out on Sat 31 Oct 2026. Next to it, at /focus, is the focus
version James asked for (one thing on screen at a time). Since Wed 4 Nov it
plays its own wordless Blender film, an architect's white model that falls
and is rebuilt in separate Up, Side and Down moves, and words appear only on
their own, after the picture. Nobody has picked between the two yet; on Fri 6 Nov James turned
that film down ("rework from the ground up"), and two concept rounds for a new one wait on his pick.

Thu 12 Nov (James: implement all of Michael's feedback): the home page went through his two emails again,
point by point. It now lands on the book (the opening plays by itself and the first screen is the hardcover
standing beside its blocks, with who it is for and why), the margin panel and the extra tags are gone, and
the end card fits every phone. Built on branch `claude/great-lamport-os1jry` (from
`claude/beautiful-cori-a7cq5v`), as a Vercel preview; production is still the 4 Nov build until James says go.

Thu 12 Nov, evening (James: "use the blocks to show all the text needed without having any left-aligned
text"): the hero's words are now on blocks rendered into the hero frame's own scene, and the text column is
gone: SCALING beside UP / SIDE / DOWN, A BOOK BY MICHAEL WENTZ and FOR BOOTSTRAPPED FOUNDERS under them, and
the red JOIN THE FIRST-EDITION LIST plank as the button. Same preview branch.

Sat 14 Nov (James: "there's still like text along the bottom. We have two focuses"): the story under the hero
is now told by the blocks alone, with no words over it. A new Blender film (`render/words_film.py`): three
ALWAYS planks thrown on before the rush; SCALING and the cover's stack turning upside down together; slabs
reading SIDEWAYS FOR STABILIZATION, DOWN FOR PRUNING and UP FOR GROWTH, each arriving its own way (slid in,
lowered, risen from the table) before the action it starts. The beats, the chapter rail and the tags are gone
from the story. Same preview branch.

| What                                        | Where                                                                                               |
|---------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Live site                                   | https://scaling-up-side-down.vercel.app                                                             |
| The focus version                           | https://scaling-up-side-down.vercel.app/focus                                                       |
| The Appendix (the Bootloader as a web page) | https://scaling-up-side-down.vercel.app/appendix                                                    |
| The Bootloader file                         | V16, 35,445 words, 284 KB: by email only, with the first-edition list (not served since 31 Oct)     |
| Hosting                                     | Vercel project “scaling-up-side-down”                                                               |
| Code                                        | GitHub joe51111jwd/Website-selling, folder scaling-upside-down: branch claude/great-lamport-os1jry (12 Nov, newest), from claude/beautiful-cori-a7cq5v |

Waiting on Michael: his email platform (Kit, Mailchimp or other; until
then the sign-up says the list opens soon), the final cover file, what
the first-edition list promises, the book’s pre-order link, and pointing
scalingupsidedown.com at the site (the book already prints
scalingupsidedown.com/appendix).

## Michael’s messages

Michael has sent three things: the discovery call on Tue 21 Oct
(recorded in Granola), his written feedback on Tue 27 Oct, and a second
email on Fri 30 Oct (5:27 PM ET), which James forwarded on Sat 31 Oct.
No email from him turned up in the connected Gmail.

## 1. Discovery call, Tue 21 Oct 2026, 2:51 PM ET (Granola notes)

These are Granola’s notes of the call, as recorded.

### Michael: background and context

- Austin-based bootstrap founder and author with 12 years of
  bootstrapping experience and 9+ years on Wall Street (institutional
  equity research at Morningstar).
- Originally from Las Vegas; previously lived in New York City for 4
  years.
- Currently writing *Scaling Upside Down*, a business book aimed at
  bootstrap founders with teams of 12 and under.
- Self-polishing the manuscript: hired Fiverr readers (\$50–\$200) to
  leave comments in a Google Doc, then uses AI to extract and
  pattern-match feedback (boring, confusing, frustrating moments).
- Turned down a top 1% book agent to retain creative control; targeting
  publication by end of 2026.
- James is a Founder School student in Manhattan, referred by Andy,
  offering website builds, SEO and AEO services as part of his \$10,000
  Founder School stage.

### Book thesis: Scaling Upside Down

- Core argument: most bootstrap founders follow growth advice designed
  for the 3% of companies that are true scale-ups with capital and a
  moat; the other 97% are poorly served.
  - Rooted in a critique of Larry Greiner’s 1972 Harvard paper, written
    in a capital-intensive era.
  - Today businesses rent scale (contractors, subscriptions, SaaS), so
    complexity can be added faster than a team can absorb it.
- Framework: scale up to grow, scale sideways to stabilize, scale down
  to prune and simplify, then scale up again. A cyclical growth model
  rather than linear.
  - Most businesses should stop at a team of 12; going beyond without a
    moat sets a “scaling trap”.
  - Guardrails: solopreneur floor of 1, team ceiling of 12,
    team-of-teams range of 40–70.
- Key inversions: systems as the goal, not revenue targets; let work
  reveal the role needed instead of hiring by title; complexity as the
  main source of revenue plateaus.
- AI argument: AI enables rented scale and cheap output, but review,
  judgment and discernment remain expensive; AI will push more companies
  into the scaling trap.
- Target reader: founders who have grown to around 8 people, felt the
  pain and burnout of complexity, and are open to a different operating
  model. The first 7 chapters focus on diagnosis and removing shame
  around not scaling.
- The book creates its own vocabulary and a bounded framework on
  purpose, which Michael says makes the ideas hard to steal without the
  full engine.

### The Bootloader spec

- The book’s appendix is a 35,000-word document in dense, table-heavy
  Markdown, meant to be taken in by AI as efficiently as possible.
  Michael calls it a “bootloader” (about 47,000 tokens).
- Uploaded to an AI, it keeps the model inside a bounded, closed system:
  entry points, routing rules, floors and guardrails, so answers stay
  within the framework. Still being pressure-tested.
- Built by sending drafts to founders, having them paste back what their
  AI said, and refining.
- Known limit: over a long conversation the AI compresses the file and
  drifts. This is a deliberate hook: the free file gives a taste; a paid
  tier would offer enforcement.
- James compared it to software as a service; Michael called it
  “software as a book”.

### Website vision and phased scope

- **Phase 1**, a simple site to launch with or shortly after the book:
  - Page 1: homepage or book sales page, visually compelling,
    communicates the core benefit and challenges conventional thinking.
  - Page 2: the full 35,000-word appendix shown publicly for AI crawling
    (AEO/GEO), with an email opt-in to download the Bootloader file. The
    opt-in captures the email; the download comes with its own prompts
    and an email sequence; file updates over time keep people on the
    list.
  - Michael’s priority: push updated versions of the Markdown file to
    the site easily, without rebuilding anything.
  - Stack discussed: Cursor, Vercel, Markdown (Michael had also looked
    at Quarto and Netlify).
- **Phase 2**: a logged-in environment where people work inside an
  enforced version of the spec, fixing the drift problem (options
  discussed: Claude connector, GPT plugin, custom MCP, own login; no
  decision).
- **Phase 3**: subscription, an ongoing patching pipeline, and usage
  data on a new business category as the long-term moat.

### Design, technical and collaboration points

- Michael wants a mix: Page 1 looks compelling and challenges
  assumptions; Page 2 is functional and dense.
- The book cover exists but is not final; Michael has it in a Google
  Doc.
- James offered basic mockups on Vercel with placeholder text to avoid
  leaking content.
- A custom MCP is a possible later add-on, not Phase 1.
- Michael would like James to read the full manuscript and comment in
  the Google Doc, and offered to pay for the time.
- Michael floated involving James’s mother’s small design firm; happy to
  keep design with James instead.

### Relationship and scope

- Michael wants an ongoing, iterative relationship, not a one-time fee:
  start small, build step by step, recurring revenue of some kind.
- Agreed: show demand first, then build the more complex parts.
- Michael is not in a rush.

### Next steps from the call

- James sends his email address; Michael sends the manuscript Google Doc
  and the Bootloader file.
- James reads the manuscript, comments, and tests the Bootloader.
- James builds basic Phase 1 mockups and shares them.
- James asks his mother about design involvement.

## 2. Written feedback, Tue 27 Oct 2026 (forwarded by James at 1:06 PM ET)

Sent with two examples Michael made with AI: a screenshot of a “Get the
Free Bootloader” email sign-up, and a screen recording of a mocked-up
Appendix page (“an example not necessarily direction”).

> Hey James! Really impressed with what you’ve put together, especially
> with very little direction from me.
>
> You’ve captured something important about the book, and I really like
> the visual storytelling with the blocks, the growing complexity, and
> the transition toward a different way of scaling.
>
> I definitely don’t think you need to go back to the drawing board. I
> think this is a great starting point, and I’d love to keep building on
> the concept.
>
> As we iterate, I think the biggest things to focus on will be helping
> visitors immediately recognize that the book is for them, making the
> central idea of cyclical growth (Up, Side, Down) clear, and figuring
> out how we guide them toward the book and Bootloader.
>
> I also really like that you’re thinking about making the Bootloader
> something people want to share. That could be a big part of what makes
> the site different. That said, I think making it clear where they can
> “Opt-in” to get the appendix instead of a “copy the prompt”.
>
> The only other thing, and maybe, I’m missing it but I’d like the
> Appendix Bootloader also sitting on it’s own page in a way that if
> crawled by AI it would best best be assimilated by AI…for GEO
> purposes. I’ve recorded a video of something I mocked up with AI as an
> example not necessarily direction. I’d also distinguish the Bootloader
> from a generic AI prompt. It’s a file/spec/software containing the OS,
> not just something to paste into AI.
>
> But honestly, I don’t want to over-direct you at this stage. I like
> where your creativity is taking this, and I’d love to see how you
> continue developing it.
>
> Really great first pass! Let me know how you want to take next steps.

## 3. Second email, Fri 30 Oct 2026, 5:27 PM ET (forwarded by James, Sat 31 Oct, 7:41 PM ET)

> Hey James!
>
> First off, thanks for jumping on the initial feedback so quickly! I've spent a little more time looking at the site and thinking about where we should go next.
>
> I really like the direction you've taken with the blocks and animations. I think the visual storytelling is one of the strongest parts of what you've created, and I definitely want to keep that.
>
> My biggest concern right now is that the book itself feels a little hidden. The site almost feels like it's promoting an AI tool with a book attached, when it should really be the other way around.
>
> A few thoughts for the next iteration:
>
> 1. Make the book the main focus.
>
> When someone lands on the site, I want them to immediately understand that Scaling Up-Side-Down is a book, who it's written for, and why they might want to read it.
>
> I think the blocks and animations already help tell the story, but we need to connect that experience more directly to the book.
>
> I'd also like to see the actual book cover featured more prominently, especially near the beginning. The blocks are already doing a great job of telling the story, and connecting those visuals to the physical book could be really powerful.
>
> I'm open to your ideas on how best to accomplish this without losing what you've already created.
>
> 2. Make the problem recognizable to founders.
>
> The target audience is primarily bootstrapped founders who've had some success growing their businesses, but are discovering that growth is making things more complicated, stressful, and harder to manage.
>
> I want someone visiting the site to think, "That's exactly what I'm dealing with."
>
> The existing "Always launching. Always hiring. Always adding." language is already heading in that direction. I think we can build on it without adding a lot of copy.
>
> 3. Make the central idea clearer.
>
> The book challenges the assumption that scaling means continually growing bigger.
>
> The underlying idea is that scaling is cyclical. Sometimes you need to grow (Up), sometimes stabilize (Side), and sometimes simplify or prune (Down). You can't effectively do all three at the same time.
>
> The twelve systems help support that process, but they aren't the entire message.
>
> I don't think we need to explain the whole framework on the website. I'd actually prefer that we create some curiosity around the idea and give people a reason to read the book.
>
> 4. Keep the Bootloader secondary.
>
> I love that you've incorporated the Bootloader, and I think it could be a great way to introduce people to the book.
>
> But it's a companion to the book, not the main product.
>
> My thought is to have one primary email signup that does double duty: people join the list for the book's first edition and receive the Bootloader for free. That gives visitors something useful right away while helping us build an audience of interested readers.
>
> One clarification here: I do want the full Bootloader appendix page to remain public. That's intentional, so search engines and AI tools can discover and index the material. The downloadable file itself, however, should be delivered through the email opt-in rather than through a direct download link.
>
> And since some people may arrive directly at the appendix from search, we should make sure there's a clear path back to the book.
>
> 5. Keep things simple!
>
> This is probably the most important point beyond positioning.
>
> As I mentioned when we first spoke, I don't want to overbuild the website right away. We don't need every feature, section, or conversion detail worked out before putting something live.
>
> I'd rather have a simple, visually compelling site that communicates the book's message well, and then improve it over time as we learn what works.
>
> I suspect a lot of this next pass could be accomplished by adjusting the copy, layout, and emphasis rather than building a bunch of new things.
>
> We also don't need to communicate every concept from the manuscript. The website should give people enough to recognize the problem, become curious about the approach, and want to read the book.
>
> Anyway, those are my main thoughts for now. I really like what you've started and don't want you to feel like you need to reinvent it.
>
> I'd love to hear how you think we could accomplish this while keeping the visual experience you've created. And feel free to push back on anything if you have a better idea!
>
> Thanks again!
> Michael

How each point was answered (released Sat 31 Oct) is in `client-log.md`
under this email: the book and its real cover up front, the problem
first, the cycle named once, one sign-up for the first-edition list with
the Bootloader by email only, and less on the page.

## How Michael’s 27 Oct points were answered

| His point                                                                                | What was done                                                                                                                                                                         | State                                            |
|------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| Opt-in instead of “copy the prompt” (feedback); email opt-in to download the file (call) | The big block at the end of the page is an email sign-up. Every “Get the Bootloader” button leads to a sign-up. /appendix has its own form.                                           | Live; sends email once his platform is connected |
| Appendix on its own page for AI crawling (call and feedback)                             | /appendix: the whole Bootloader as one plain page crawlers read without scripts; a permanent link for every section and Vocabulary Lock term; structured data; llms.txt and a sitemap | Live                                             |
| Bootloader is a file, not a prompt                                                       | Shown as a 35,445-word file with version and download; “Upload the file and use the starting prompt provided with it.”                                                                | Live                                             |
| Easy updates to the Markdown file (call)                                                 | The page, word count, version and date are all built from the one file, public/bootloader.md; replacing it and redeploying updates everything                                         | Live                                             |
| Make the Bootloader shareable                                                            | Every section of /appendix has its own link                                                                                                                                           | Live                                             |
| Visitors recognize the book is for them                                                  | Proposed: open with “How many people are on your team?”                                                                                                                               | Proposed                                         |
| Up, Side, Down clear as a cycle                                                          | The finale ring centres on UP SIDE DOWN; proposed a section where blocks go up, sideways, down and repeat                                                                             | Proposed                                         |
| Guide people to the book and the Bootloader                                              | Bootloader path done; book path needs the pre-order link                                                                                                                              | Partly done                                      |
| Compelling homepage that challenges thinking (call)                                      | Scroll story of 3D blocks: a business grows too fast, topples, rebuilds on foundations, ends in the closed loop                                                                       | Live                                             |

## Decisions and working principles

The main rule from the start: every sentence on the site is taken word
for word from Michael’s manuscript. Labels, buttons and status messages
are the only exception.

- **Its own style.** No Apple look, no flat text pages, nothing that
  looks AI-generated. The bar is Awwwards-level craft.
- **Real 3D, not AI images.** The blocks are rendered in Blender in the
  cloud (James’s computer can’t run it) and played back as you scroll.
- **The story.** A business grows too fast and topples; strong
  foundations let it scale; growth is a cycle of Up, Side, Down.
- **The opening.** Just the blocks, which rearrange and stack into the
  hero as you scroll.
- **Less text, clean on phones.** Desktop first, but every section is
  checked at phone sizes.
- **The ending.** The 12 system blocks form a closed ring around UP SIDE
  DOWN, with one dramatic red block as the call to action. It first
  copied the prompt; after Michael’s feedback it became an email
  sign-up.
- **The Bootloader is a file.** Shown with its version and word count;
  people upload it, then use the short starting prompt.
- **Built for AI readers too.** /appendix is plain, citable HTML with
  llms.txt and a sitemap.

- **The focus version (/focus), since 4 Nov.** Words are on screen only when they are the one thing to
  look at, and the picture makes sense without them (James, 3 Nov). The film is a professional
  architect's massing model, "Load Path" (`render/loadpath.py`); a panel of three concepts was judged,
  and the toy blocks were dropped. The film has no words and no labels; its three phases are told by
  colour and direction alone (green up, ochre in from the sides, red lowered away), one move at a
  time. The book comes first, the words after the film, then the book and its sign-up. On any
  screen the picture's zoom and its place on the screen change by at most 1.5% a frame, so it never
  jumps, and wherever it does not reach an edge the wall and floor are painted on in its own colours.
  Through the film's still beats (the held breath, the wreckage) the picture holds still too, and it
  glides into them; on a wide screen it stays centred; on a landscape screen a smaller picture sits
  flush with the top; when the core climbs out of the picture's top it runs off the
  screen's top, never into a painted band (on a tall phone the picture glides up for it, leaving
  plain floor below). Following the pile sideways on phones, tablets and 4:3 screens is kept: easing
  it or centring on the pile's whole extent were tested and cut more of it off.

- **Land on the book (since 12 Nov).** The first screen is the hardcover beside its blocks, the title, who
  it is for, why, and the one button: the opening plays by itself on load instead of waiting for a scroll
  (Michael, 30 Oct: "immediately understand that Scaling Up-Side-Down is a book"). The story's scroll
  starts at the hero (the story section is 1392vh, was 1513vh).
- **The words on the blocks (since 12 Nov, evening; James).** The first screen has no text column: the
  title, the byline, who it is for and the button are stamped on planks in the hero frame's own scene.
  New words there mean a new render (`render/README.md`, "The hero's planks").
- **One thing in focus in the story.** Words beside the picture only where they carry the beat: the
  margin-inversion panel and the tags that repeat a block's own stamp are out (12 Nov).

**Tried and dropped:** the margin-inversion panel beside the problem beats (Michael's Chapter 17 numbers;
dropped 12 Nov: a third thing on screen, and a concept the site need not teach); the first focus film (the toy blocks carrying the words, with lines beside
the held picture; 2-3 Nov), retired as too playful and still splitting the eye; the first reflection,
pyramid and flip ideas; an
Apple-style homepage; ten design directions (Index, Ink, Curve,
Wireframe, Stencil, 97, Constellation, Manifesto and others) that looked
good but weren’t about the book; a second round (Read and Use, Blocks,
964, Coordination Tax) that was too busy; 20 typed-out ideas.

## Every chat, in order (summary)

All times US Eastern. The full text of every message is in the last
section.

| When                       | James                                                                                                                                                                                  | What came of it                                                            |
|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Sat 24 Oct, 12:37 pm       | Kickoff: read the Granola call and the manuscript; design style choices, a cool intro, React, no clutter, Awwwards inspiration, publish to Vercel                                      | Research of the call, manuscript and cover; first homepage mockups         |
| 2:05 pm                    | Reflection idea not useful; pyramid interesting; flip makes no sense; 10 more ideas                                                                                                    | More concepts                                                              |
| 2:09 pm                    | “The first one was good” (the intro); the rest basic and AI-looking                                                                                                                    | Apple-style homepage built (2:59 pm)                                       |
| 3:34 pm                    | “Too much like Apple… It needs to be its own style.” Wants 10 design ideas                                                                                                             | Apple look dropped; ten directions built                                   |
| 4:32–5:38 pm               | When will they be done; screenshots; “let me see the 10”                                                                                                                               | Screenshots shared                                                         |
| 5:42 pm                    | Reviewed each: Index great but off-point; Ink, Curve, Stencil, 97, Constellation, Manifesto not about the book; Wireframe interesting; read the manuscript, just a homepage screenshot | Manuscript-driven mockups                                                  |
| 5:57 pm                    | What Michael wants: a place to copy the prompt (main thing), the book, the philosophy                                                                                                  | Mockups reworked                                                           |
| 6:24 pm                    | Too flat and AI-looking; homepage should be simple                                                                                                                                     | Another round                                                              |
| 10:07–10:08 pm             | Too complicated; don’t build, type out 20 ideas                                                                                                                                        | 20 ideas written                                                           |
| Sun 25 Oct, 12:03–12:05 am | Illustrate a business that grows then crumbles, real rendering; render Blender in the cloud                                                                                            | Plan for real 3D blocks as a scroll story                                  |
| 12:38 am                   | Build it; every scroll moves the story; ultracode; “maybe we’ll win an Awwward”                                                                                                        | Scroll story from Blender renders (2:16–4:30 am)                           |
| 4:25 am                    | Screenshot                                                                                                                                                                             | Adjusted                                                                   |
| 10:10 am                   | Show growing too fast and falling over; strong foundations                                                                                                                             | Story reworked                                                             |
| 10:36 am                   | “This looks super good”; clean up phone; less text                                                                                                                                     | Phone cleanup, text cuts                                                   |
| 10:44–11:44 am             | Four screenshots with fixes                                                                                                                                                            | Fixed                                                                      |
| 11:51–11:53 am             | Mobile? Bottom is a wall of text; more inviting copy                                                                                                                                   | New ending started                                                         |
| 1:42 pm                    | Open on just the blocks, which stack as you scroll                                                                                                                                     | Flat-lay opening (3:49 pm)                                                 |
| 1:48–2:05 pm               | Three screenshots                                                                                                                                                                      | Fixed                                                                      |
| 2:31–3:31 pm               | When on Vercel; how’s it going; smooth and clean                                                                                                                                       | Deployed; polish                                                           |
| 3:48–3:53 pm               | Screenshot; a time in Eastern                                                                                                                                                          | Answered                                                                   |
| 5:32–5:36 pm               | Two screenshots                                                                                                                                                                        | Full-quality frames (5:33 pm)                                              |
| 6:29 pm                    | Below the animation is “not SUSD”; cooler copy area; real prompt ~35,000 words                                                                                                         | Closed-loop ending (9:10 pm)                                               |
| 7:47–9:11 pm               | Six screenshots                                                                                                                                                                        | Fixed                                                                      |
| 10:02 pm                   | Copy should be one dramatic button; phone refinement                                                                                                                                   | The red COPY block (11:33 pm)                                              |
| Mon 26 Oct, 4:14 pm        | The real Bootloader V16 file                                                                                                                                                           | On the site (4:16 pm)                                                      |
| Tue 27 Oct, 1:06 pm        | Michael’s feedback, mockup and video                                                                                                                                                   | Opt-in, /appendix, file wording; 43-point review, all fixed; reply drafted |
| 3:09 and 3:27 pm           | Recommitted? Repushed on Vercel?                                                                                                                                                       | Deployed and checked live (5:19 pm)                                        |
| Thu 29 Oct, 3:08 pm        | Asked for this record                                                                                                                                                                  | This document                                                              |
| Sat 31 Oct, 7:41–7:54 pm   | Michael’s 30 Oct email, word for word; “Implement everything and give me the link”                                                                                                    | The book-first release (Sat 31 Oct, evening)                               |
| 9:18 pm                    | A version with one thing on screen at a time, on a separate link                                                                                                                       | The first /focus (Mon 2 Nov)                                               |
| Sun 1 Nov, 10:19 pm        | No full-screen text between the blocks; rethink the blocks and the animations                                                                                                          | Storyboard, then the focus film (Tue 3 Nov)                                |
| Tue 3 Nov, 12:17–12:23 pm  | The link to the updated focus version; it must look put together                                                                                                                      | The focus film at /focus                                                   |
| Tue 3 Nov, evening         | A less playful, more professional look (a new idea for the blocks, or something else); no words popping up unless they are the focus, and nothing vital left to them | A new film and page for /focus (in progress)                               |

## Releases

Before each release the site was reviewed by independent checkers and
tested in a browser at desktop and phone sizes. The last review found 43
issues; all were fixed before it shipped. Newest first, US Eastern.

| When                     | What it added                                                          |
|--------------------------|------------------------------------------------------------------------|
| Sat 14 Nov (preview) | The story told by the blocks alone (James: "We have two focuses"). A new Blender film, `render/words_film.py`, from the hero on: the hero's planks are in its scene, so the first scroll carries straight on; three ALWAYS LAUNCHING / HIRING / ADDING planks are thrown on before the rush and fall with it; SCALING and UP / SIDE / DOWN turn upside down together and are set right; slabs in the cover's paints read SIDEWAYS FOR STABILIZATION (slides in), DOWN FOR PRUNING (lowered) and UP FOR GROWTH (rises out of the table), each in a push-in before the action it starts; the last picture has SCALING beside the finished building with the three slabs in front. The page puts no words over the story: the beats, the chapter rail, the tags and the wash behind them are gone. On a phone the picture steps back until the thing it is about fits the screen, and a block that runs off the picture runs off the screen there too. The hero steps in to fill the screen on the first scroll, then the film takes over. The cover blocks' faces were recovered from the hero frame (the photo is not in the repo). Reviewed independently (seven findings, all fixed) and checked at desktop, wide, tablet, phone, phone on its side and reduced motion |
| Thu 12 Nov, evening (preview) | The hero's words on the blocks (James: no left-aligned text). Planks stamped in the cover's condensed face are set down on the hero frame's table, rendered in Blender from the frame's own camera and lights (`render/hero_words.py`, checked against frame 89 to the pixel) as transparent layers with their shadows, and drawn by the page with the frame: SCALING beside UP / SIDE / DOWN as on the cover, A BOOK BY MICHAEL WENTZ over FOR BOOTSTRAPPED FOUNDERS, and the red JOIN THE FIRST-EDITION LIST plank, a link to the sign-up that lifts under the pointer. The picture steps back for the hero so the whole title page fits any screen, centred; the planks are set down as the opening settles (the red one last) and fade as the rush starts. The text column and the hardcover are gone from the first screen; the words stay in the page for screen readers and search |
| Thu 12 Nov (preview)     | Michael's feedback, all of it, on the home page (James: "implement all of that. Make it perfect"). Land on the book: the opening (the blocks lying face up stand up and stack) plays by itself as the page loads, about 2.5 s, and the first screen is the hero; reduced motion, a slow connection and a reload part-way down skip it, and a scroll during it hands over at once. The hardcover stands on the table beside the blocks that stacked into its cover, at their scale, placed from the picture (the picture slides sideways to make room where it can; on screens with no room the old column returns); on phones the words are above and the book and the blocks stand side by side under them. "A book by Michael Wentz" and "For bootstrapped founders" on their own lines, and the why line (L415) on phones too. The margin-inversion panel and the tags that repeated the blocks' stamps (Hire #6, Slack, Hire #9, CRM, The Graveyard, Twelve holds) are gone. The book's card at the end shows the back cover's line on phones and fits a phone held sideways (the open item from 4 Nov). Checked at 16 screen sizes, with reduced motion, a scroll during the opening, a reload mid-page, the keyboard, and on throttled networks (8 Mbps: the book in about 6 s; a slow line skips the opening). Centred on landscape screens: the picture may slide past its own plain left edge for the hero. An independent code review found 5 real defects, all fixed before release: the book overlapped the blocks on some upright screens 800-1000px wide (the slide was measured from the clamped picture but applied before the clamp); the end card met the book picture on phones like 375x812 (the line about the appendix now steps aside on upright phones under 940px tall, the back cover's line stays); a scroll of a few pixels during the opening brought the hero in over the tumbling blocks (one threshold now); the hero's button could be focused before it appeared; the scroll cue had lost its line. The margin panel's leftover styles are gone too |
| Wed 4 Nov                | A more professional /focus (James, 3 Nov: less playful; no words unless they are the focus). A new wordless film, "Load Path" (`render/loadpath.py`, 386 frames at 1600×1000): an architect's white massing model is grown by doing everything at once and falls; it is rebuilt on a raft and core one move at a time, three rounds, far taller. The page shows the book alone, then the film alone, then the words alone, then the book and its sign-up. Picked from three rendered concepts by two judges; the page went through an independent review on devices and in code, and every confirmed finding was fixed. A second review (11 confirmed findings) was fixed before it went out: on tablets and phones the picture's place on the screen is eased like its zoom, so it never hops for a frame; on 4:3 screens the zoom holds through the build-up and the blocks drop in from the screen's edge; on wide screens the board stays crisp out to the edges; the annex no longer flashes as a black plate (six frames re-rendered); the menu turns solid before the words can slide under it; the hero fits short phones; the title uses the display face's own hyphens; and a line never starts with an em dash. A third review (10 confirmed findings) was fixed too: the climbing core no longer fades into a painted band on phones and tablets (the film's data marks it cut only where it is), the held breath and the wreckage hold still, the tower no longer sinks and rises before the tipping point on 4:3 screens, the picture no longer sways sideways on wide screens, the floor band has no ghosts, a shadow no longer streaks a side band, the third annex grows in like the others, the menu bar goes solid at once, the hero fits every phone height and shows its note on a phone held sideways, and copied text has no hidden character. A fourth review (12 confirmed findings, all small) was fixed as well: the picture glides into each still beat instead of stepping, a smaller picture on a landscape screen always sits flush with the top (no one-frame jumps or dips), the core's cap comes back into view crisp, the floor's line glides in the side bands, the menu sits on paper once the words are still, and the hero balances on wider phones and fits the shortest screens on their side. A fifth check (9 small findings) was fixed last: the picture no longer swells and shrinks back just before the held breath on some phones and the iPad mini, near-square windows no longer sink for three frames as a block lands, and the menu's paper is set in the same frame as the scroll. The home page is unchanged, except that on a phone held sideways its sign-up keeps its headline |
| Tue 3 Nov                | The rethought focus version at /focus (James, Sun 1 Nov: no full-screen text, rethink the blocks): its own film (`render/focus_film.py`, 1600×1000) where the first three blocks are planks stamped ALWAYS LAUNCHING / HIRING / ADDING, the cover's stack turns upside down and is set right, the systems slide in from the sides, the planks leave with the dead weight and the building rises. The film holds while each short line sits beside the blocks it is about (under the picture on an upright phone); the closed loop and the book end the same way. Fixes from two independent reviews of the film and the page, including a collision check over every frame. On desktop windows wider than the picture it fills the width wherever the blocks allow (eased, never a jump), and the wall and floor round the picture are painted in its own colours. One fix also reaches the home page: on a phone on its side (844×390) the sign-up keeps its headline and offer |
| Mon 2 Nov                | The focus version at /focus (one thing on screen at a time), next to the live home page; fixes from the round-3 review (the footer's styles back, the hero on wide, square and short screens, the sign-up's wording and states, an unconfirmed address asked to confirm again, llms.txt book-first) |
| Sat 31 Oct, evening      | The book first (his 30 Oct notes): the real hardcover in the hero, the problem first, the cycle named once, one sign-up for the first-edition list, the file by email only. Live in production now |
| Tue 27 Oct, 5:19 pm      | Fixes from the 43-point review                                         |
| Tue 27 Oct, 1:26 pm      | The /appendix page, the email sign-up, the Bootloader shown as a file  |
| Mon 26 Oct, 4:16 pm      | The real SUSD Bootloader V16 (35,445 words)                            |
| Mon 26 Oct, 12:54 am     | Fixes from the COPY block review                                       |
| Sun 25 Oct, 11:33 pm     | The COPY block: one dramatic button                                    |
| Sun 25 Oct, 9:10 pm      | The closed-loop ending                                                 |
| Sun 25 Oct, 5:33 pm      | Full-quality frames for the opening and the story                      |
| Sun 25 Oct, 3:49 pm      | The new ending and the opening where the blocks stack                  |
| Sun 25 Oct, 2:16–4:30 am | The scroll story from Blender renders, two review rounds, final frames |
| Sat 24 Oct, 2:59 pm      | Apple-style homepage (later dropped)                                   |

## Draft reply to his 30 Oct email (not sent yet)

> Hey Michael,
>
> Thanks, this was really helpful, and you were right: the site was selling the Bootloader with a book attached. It's flipped now, and it's live: https://scaling-up-side-down.vercel.app
>
> - **The book up front.** As the blocks finish stacking, your hardcover stands beside them, with the title, who it's for, the subtitle and one button. The page also ends on the book.
> - **The problem first.** It opens with "Always launching. Always hiring. Always adding.", then your lines about revenue growing while the bank account doesn't feel it, margins shrinking, and the founder becoming the bottleneck.
> - **The cycle, not the framework.** One line each for Up, Side and Down, ending on "You're already doing all three." The twelve-systems detail and the extra sections are gone.
> - **One sign-up.** "Join the first-edition list", with the Bootloader free by email. There's no direct download anywhere now. The appendix page stays fully public, with the book at the top and bottom and a way back.
>
> Three things from you:
>
> 1. **Your email platform** (Kit, Mailchimp or other). The file only comes by email now, so until it's connected the sign-up says "The list opens soon."
> 2. **The final cover file.** The hero uses the cover from your manuscript.
> 3. **What the first-edition list promises**, in your words: roughly when people hear from you, and anything special about the first edition.
>
> Push back on anything that feels off.
>
> James

## Earlier draft reply, to his 27 Oct feedback

> Hey Michael,
>
> Thanks, that’s really encouraging. Your notes were clear, so here’s
> what’s already changed and what I’d like to do next.
>
> **Live now** (https://scaling-up-side-down.vercel.app)

1.  **Opt-in instead of “copy the prompt.”** The big moment near the end
    of the page is now an email sign-up: type your email, hit the block,
    and the Bootloader is sent to you. Every “Get the Bootloader” button
    on the site (top bar, hero, story) leads to the same sign-up.
2.  **The Appendix on its own page:** /appendix (the address the book
    already prints). It’s the whole Bootloader as one clean HTML page,
    built for people and for AI: plain text that crawlers read without
    running scripts; a permanent link for every section and every
    Vocabulary Lock term, so an answer can cite the exact part;
    structured data marking it as the appendix of your book; an llms.txt
    file and a sitemap pointing AI tools to it; and the raw file at
    /bootloader.md for any AI that wants the source. It also has its own
    sign-up, a download, the starting prompt, and the Use Notice.
3.  **A file, not a prompt.** The site now treats the Bootloader as a
    ~35,000-word document you load into your AI: a version number, a
    word count, and “Upload the file and use the starting prompt
    provided with it.” The only thing you ever copy is the short
    starting prompt, and it’s presented as part of the file.

> **What I need from you to switch the sign-up on**

- **Your email platform** (Kit/ConvertKit, Mailchimp, or something
  else). Until it’s connected, the sign-up just downloads the file and
  stores nothing. Once you tell me which one, I’ll send you the two
  settings to add, and the welcome email will deliver the file.
- **The pre-order link** for the book buttons.
- **Pointing scalingupsidedown.com at the site,** so /appendix is
  exactly where the book says it is. Once it’s connected, the next
  update switches every link over to it.

> **What I’d build next for your three big points**

1.  **“Is this book for me?”** Open with the question you ask founders:
    *“How many people are on your team?”* The visitor taps a number, and
    the page answers in your own words, from the bicycle to the car to
    the limousine, with the 12–40 range where things break. That way
    they see themselves in the first ten seconds instead of reading a
    pitch.
2.  **Up, Side, Down as a cycle.** A dedicated section where the blocks
    visibly go *Up for growth, Sideways for stabilization, Down for
    pruning*, and then repeat, so the idea reads as a rhythm and not a
    line. It closes on “The cycle isn’t something you install. It’s
    something you stop resisting.”
3.  **Two clear paths.** After those two moments, the page offers the
    same two options every time, *the book* and *the Bootloader*, so no
    visitor is left wondering what to do next.

> As with everything on the site, every sentence comes straight from the
> manuscript. If that direction sounds right, I’ll start with the
> team-size opening, since it does the most for “this is for me.”
>
> James

## Open items and next steps

**James**

- Send Michael the reply above.
- Check the live site on an iPhone in Safari (the download after sign-up
  was tested in Chrome only).
- From the call: read the manuscript and comment in the Google Doc
  (Michael offered to pay); ask about your mother’s design involvement;
  agree the ongoing working arrangement Michael asked for.

**Waiting on Michael**

- His email platform, then add its settings in Vercel and redeploy:
  - Kit: KIT_API_KEY and KIT_FORM_ID (a double opt-in form whose
    incentive email carries the file).
  - Mailchimp: MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID (the welcome
    email carries the file).
  - Anything else (Zapier, Make, a CRM): OPTIN_WEBHOOK_URL.
- The book’s pre-order link.
- Pointing scalingupsidedown.com at the Vercel project; then a redirect
  from the vercel.app address.

**Waiting on Michael, since his 30 Oct email**

- The final cover file (the hero renders the cover from the manuscript).
- What the first-edition list promises, in his words.
- His email platform is now a blocker: with no download, the sign-up
  is the only way to get the file.

**James**

- Compare the live home page with the focus version (/focus) and pick one.
- Look at the 12 Nov preview of the home page and say whether it goes live (it is not in production yet).
- Pick the new /focus film's direction (the chart drawn in ink, or the cover's blocks becoming the chart),
  or drop /focus: the live /focus still plays the film turned down on 6 Nov.
- (Done 12 Nov: the home page's end card on a phone held sideways now fits.)
- Make the GitHub repo private: it is public, so the Bootloader file and this client record can be
  read there by anyone.

**Later phases from the call**

- A logged-in environment that enforces the spec, then a subscription.

## All of James’s messages, word for word

Every message James sent in this project’s chats, in order, US Eastern
time. Screenshots and files he attached are noted in brackets.

**1. Sat 24 Oct, 12:37 PM ET**

> What we need to do is look through my granola. I had a chat with this
> guy Michael. We need to make him a website that meets all the
> criteria. His manuscript is in the doc. It has the prompt, I think.
> It’s in the Google Doc he shared with me.
>
> Give me some design style choices. We need to make this thing really
> cool. Look at the cover of his book. We want to have some cool intro.
> Build it all in React.
>
> You know how we need it, looking through. You know how we code. We
> don’t do clutter effects. We don’t do BS. We make the best. Look at
> awards.com for inspo. Then open source that and edit it to how you
> want it to be for this specific website, and then obviously publish it
> to Vercel.
>
> But first, get your awards inspo. Come up with a couple of homepage
> mockups, and then show me.
> https://x.com/devdsgn/status/2113558647024632115?s=46. Also, look at
> this link. It’s really good. The homepage design is really good. It
> really draws you in.

**2. Sat 24 Oct, 2:05 PM ET**

> There’s something there with the reflection. I like it because it’s
> high fidelity, but I don’t know. It just doesn’t seem useful. It
> doesn’t seem like it conveys a good message, right? At the same time,
> I want a cool animation when you log onto the site, and then that home
> page needs to be a banger. I don’t know.
>
> Come up with these new ideas. The pyramid one is interesting, but the
> flip doesn’t make any sense. I don’t get the flip. I don’t think the
> flip is odd. I don’t know. The Bootloader is maybe… I don’t really
> know about it when it loaded into something that was bad. The
> complexity thing is interesting, but I don’t know. Give me more ideas,
> 10 more.

**3. Sat 24 Oct, 2:09 PM ET**

> Yo, one of the biggest things that I think is just an important thing:
> the first one was good. The intro, the scaling soundbar, was good, but
> the rest is just horrible, right? Maybe we can use Higgsfield or
> something, but it just feels so basic. The text on stuff looks
> AI-generated. I’m just like, I can’t put that out there. It looks like
> it was AI-generated. It just seems flat. Nothing’s high fidelity.
> Remember, look at awards.com and find inspo, and then basically copy
> that.

**4. Sat 24 Oct, 3:34 PM ET**

> I didn’t want you to make it look like Apple. I see. Are these some of
> the possible? This looks too much like Apple. I didn’t want to make it
> look like Apple. The reason I showed you that was because of high
> fidelity. I do not want it to look like Apple. It needs to be its own
> style.
>
> What is the point of this? I wanted 10 different design ideas. Where
> can I see those? Right now, this makes no sense. I don’t like this at
> all. Needs to have its own style

**5. Sat 24 Oct, 4:32 PM ET**

> When are the directions going to be done? Can I see screenshots?

**6. Sat 24 Oct, 5:32 PM ET**

> Can I see the stuff?

**7. Sat 24 Oct, 5:38 PM ET**

> let me see the 10

**8. Sat 24 Oct, 5:42 PM ET**

> Okay, first things first: want to compliment you. I’m just going to go
> through. - Index: cool as fuck, right? I don’t see how it works with
> the scaling upside-down point, but it’s just so cool. I’m definitely
> going to do a website like this, but I think maybe if you made it more
> like a manuscript, like a book. At the same time, though, remember
> we’re just trying to just display that prompt. They can download that
> prompt, but right now it’s so cool, bro. - Ink: let’s check out Ink,
> okay? Ink is chill, but again, nothing to do with his book. Scaling
> upside down, where the book is rotating the plinth one, I don’t know,
> but that just doesn’t seem cool. - Curve: loading. Another cool one,
> but again, I just don’t see how it’s useful. I guess the scaling up.
> Can you read his manuscript and understand, maybe, and then we can do
> something else? - Wireframe is interesting. - Stencil: not it. Cool
> idea, but just not there. - 97: I don’t know what the fuck’s going on
> with the built for the 97. Oh shit, it’s actually tough as hell. Just
> doesn’t make any sense at all. - In Constellation, why would we do
> Constellation? I don’t see. - Manifesto: a lot of these are cool, but
> they just don’t display. Read his manuscript and make some shit, make
> some stylized shit for him. You’re only to make the whole web page,
> bro. Just generate a screenshot of a homepage. That’s all I really
> care about, and we can get off the style. Like Figma, we just need to
> get the style down.

**9. Sat 24 Oct, 5:57 PM ET**

> No, you should be able to see it because it tells you all of the parts
> that he wants in there. Make a list of all things he wants:

- A place to copy it (that’s the main thing). We need to get people to
  copy the prompt.
- Tell him about the book.
- Tell him about the philosophy.

> It’s all in the book, literally. I just gave you the book, so you need
> to get the message across, but in a cool way. Think about a design
> that would be interesting with the book. It gives it something new
> because all these designs are cool, but they don’t actually pertain to
> what his book is about. Keep working. Give me some screenshot mockups.
> You can just put them all in the thing. I can just look at all the
> screenshots. I’ll tell you which one I like as the homepage. You just
> need to make the homepage. You don’t need to make it scroll.

**10. Sat 24 Oct, 6:24 PM ET**

> I feel like the way that they’re done, it just looks so flat. These
> are just doing text and other things. You need to use React, floating
> components, rendering images, and other things to actually make it
> feel more alive.
>
> I don’t know if I’m vibing with any of these, to be honest. I feel
> like I want something more creative. I think the index is too
> cluttered. The “read and use” just seems kind of boring. Blocks, John,
> I just don’t like. The 964 just doesn’t make any sense. Coordination
> tax, again, a lot of these just have a lot going on. It just needs to
> be simple.
>
> The homepage should just be simple, bro. It’s a website you can
> scroll, but the homepage should just be simple and give the vibe,
> right? If you want to show me that the homepage can be simple, but
> then there’s a part that makes it really cool, then yeah. I don’t want
> just a flat HTML element where you just click it and it just looks
> bad. It just ends up looking bad, bro. It’s just not good. Looks too
> AI-generated. I don’t give that shit to my clients.

**11. Sat 24 Oct, 10:07 PM ET**

> First things first I don’t really like this. I don’t know. It seems
> too complicated. I just don’t like that idea to be honest no offense
> and then also the whole point was that he wanted to easily be able to
> copy the whole prompt or at least click down the file easily, but
> ideally copy the whole prompt so they could paste it into like a chat
> bot super easily. That’s one of the things that you talked about in
> Granola that he wanted, but I don’t know I don’t like this idea. Keep
> coming with more ideas, but don’t make it. You’re wasting token, bro.

**12. Sat 24 Oct, 10:08 PM ET**

> Just get me the homepage just a quick markup even if you gave me right
> now just for speed wise in the next like five minutes you gave me like
> 20 ideas and you just type them out I would like that more

**13. Sun 25 Oct, 12:03 AM ET**

> Okay, look, I’ve been trying to like figure out how I want to do this
> and how I want to make this site. Honestly, I have no idea, bro. One
> of the ideas I thought about was maybe like, illustrating a business,
> right? And you like, but it can’t look like a game. It can’t look like
> AI, and it like grows, and then stuff starts crumbling and whatever.
> We need to tell the story. Right, we need to get the message across.
> You have the manuscript, like, and the biggest problem I’m finding is
> like right now all the shit you’re building is like just like text, or
> it’s, and the stuff, other stuff is like AI generated images. It
> doesn’t look good either. Like, the best stuff is like, real, you
> know, like rendering and like depth, all that stuff on top of it, like
> the stuff that makes UI UX look so good. I don’t know, bro. I don’t
> know. I’m getting really stuck with this. I need you to bail me out. I
> need your help. What do you think is like a way to do this? Like,
> what, how do you think we’re gonna get that message across?

**14. Sun 25 Oct, 12:05 AM ET**

> Yeah, we can render and blender like my computer cannot handle that.
> Can we do it on yours?

**15. Sun 25 Oct, 12:38 AM ET**

> OK, build that right and then you need to tell a story, bro. It should
> be an experience like every scroll is moving through the experience
> and by the time I’m done with it I should understand what the point of
> the book is and it should convince me to really want to copy that
> prompt and by the book if you can do that, God knows we’ll give you.
> You’re in full ultra code now so I want you to take advantage and make
> the best coolest fucking site ever who knows maybe we’ll win an
> awwward

**16. Sun 25 Oct, 4:25 AM ET**

> \[Screenshot attached\]

**17. Sun 25 Oct, 10:10 AM ET**

> I think we need to show is like literally too fast and then they fall
> over and then the best companies they build strong foundations to
> allow them to build without strong foundation you can’t scale

**18. Sun 25 Oct, 10:36 AM ET**

> This looks super good though Also, if we could like clean it up on
> phone a bit so it’s not too like cluttered and I don’t know like the
> blocks are very like interesting right but I think it’s about like
> make sure that we illustrate all of it well I don’t know I wanna make
> sure that we get the message across with like last text like I want to
> move understand with last text so maybe work on that as well

**19. Sun 25 Oct, 10:44 AM ET**

> \[Screenshot attached\]

**20. Sun 25 Oct, 10:45 AM ET**

> \[Screenshot attached\]

**21. Sun 25 Oct, 11:02 AM ET**

> \[Screenshot attached\]

**22. Sun 25 Oct, 11:44 AM ET**

> \[Screenshot attached\]

**23. Sun 25 Oct, 11:51 AM ET**

> Also, I understand desktop is more important, but how does it look on
> mobile

**24. Sun 25 Oct, 11:53 AM ET**

> Also, I think everything is good, but like when you scroll to the
> bottom, we have to make the text have more depth and not be like a
> wall of text but still get the message across and then have a really
> cool way to copy it rather than just like a random box like I think
> invite you copy it more or something like that I think it would be
> more interesting but other than that, I think this is pretty cool so
> far

**25. Sun 25 Oct, 1:42 PM ET**

> \[Image attached\] I don’t know if this say you have it right now but
> be really cool like when you go in this is just what you see. You just
> see the blocks and then like as you scroll like they like rearrange
> themselves and they stack and then you continue like whatever you had
> before whatever you’re doing right now I haven’t seen it yet but when
> I see it

**26. Sun 25 Oct, 1:48 PM ET**

> \[Screenshot attached\]

**27. Sun 25 Oct, 1:49 PM ET**

> \[Screenshot attached\]

**28. Sun 25 Oct, 2:05 PM ET**

> \[Screenshot attached\]

**29. Sun 25 Oct, 2:31 PM ET**

> when will it be on vercel

**30. Sun 25 Oct, 3:23 PM ET**

> hows it going?

**31. Sun 25 Oct, 3:31 PM ET**

> also make sure when its on the website its vary smooth and i want it
> to be clean .

**32. Sun 25 Oct, 3:48 PM ET**

> \[Screenshot attached\]

**33. Sun 25 Oct, 3:53 PM ET**

> what is that in normal time on ets

**34. Sun 25 Oct, 3:53 PM ET**

> est

**35. Sun 25 Oct, 5:32 PM ET**

> \[Screenshot attached\]

**36. Sun 25 Oct, 5:36 PM ET**

> \[Screenshot attached\]

**37. Sun 25 Oct, 6:29 PM ET**

> work on the part below the animation. Right now, it’s just not SUSD,
> bro. Like, what? I want the copy-the-prompt area to be cooler. No,
> it’s not cool right now. The prompt is like 35,000 words, but I’ll
> give you the real one.

**38. Sun 25 Oct, 7:47 PM ET**

> \[Screenshot attached\]

**39. Sun 25 Oct, 8:09 PM ET**

> \[Screenshot attached\]

**40. Sun 25 Oct, 8:58 PM ET**

> \[Screenshot attached\]

**41. Sun 25 Oct, 8:59 PM ET**

> \[Screenshot attached\]

**42. Sun 25 Oct, 9:06 PM ET**

> \[Screenshot attached\]

**43. Sun 25 Oct, 9:11 PM ET**

> \[Screenshot attached\]

**44. Sun 25 Oct, 10:02 PM ET**

> I would like the prompt to be like a really cool area where it’s just
> like a cop. It’s not even a copy the prop it’s just like a button
> click it. It’s like really dramatic copy it whatever but I don’t know
> it does explain it pretty well, but I think on the phone it needs
> refinement, but like I don’t know how many people are gonna see you on
> the phone.

**45. Mon 26 Oct, 4:14 PM ET**

> \[File attached: SUSD_Bootloader_V16_Runtime.md\] this is the thing
> people need to copy

**46. Tue 27 Oct, 1:06 PM ET**

> \[Image attached\] \[File attached: Recording_80.mov\] We got feedback
> from the client,
>
> Hey James! Really impressed with what you’ve put together, especially
> with very little direction from me.
>
> You’ve captured something important about the book, and I really like
> the visual storytelling with the blocks, the growing complexity, and
> the transition toward a different way of scaling.
>
> I definitely don’t think you need to go back to the drawing board. I
> think this is a great starting point, and I’d love to keep building on
> the concept.
>
> As we iterate, I think the biggest things to focus on will be helping
> visitors immediately recognize that the book is for them, making the
> central idea of cyclical growth (Up, Side, Down) clear, and figuring
> out how we guide them toward the book and Bootloader.
>
> I also really like that you’re thinking about making the Bootloader
> something people want to share. That could be a big part of what makes
> the site different. That said, I think making it clear where they can
> “Opt-in” to get the appendix instead of a “copy the prompt”.
>
> The only other thing, and maybe, I’m missing it but I’d like the
> Appendix Bootloader also sitting on it’s own page in a way that if
> crawled by AI it would best best be assimilated by AI…for GEO
> purposes. I’ve recorded a video of something I mocked up with AI as an
> example not necessarily direction. I’d also distinguish the Bootloader
> from a generic AI prompt. It’s a file/spec/software containing the OS,
> not just something to paste into AI.
>
> But honestly, I don’t want to over-direct you at this stage. I like
> where your creativity is taking this, and I’d love to see how you
> continue developing it.
>
> Really great first pass! Let me know how you want to take next steps.

**47. Tue 27 Oct, 1:07 PM ET**

> \[Screenshot attached\]

**48. Tue 27 Oct, 3:09 PM ET**

> Lmk when it’s recommitted

**49. Tue 27 Oct, 3:27 PM ET**

> Yo, did you repush on vercel

**50. Thu 29 Oct, 3:08 PM ET**

> yo, give me a doc with everything you have done non code wise, all of our chats, what michael said etc

**51. Thu 29 Oct, 3:15 PM ET**

> bro, i need it now

**52. Thu 29 Oct, 3:16 PM ET**

> stop the workflow and take what you have now

**53. Thu 29 Oct, 3:18 PM ET**

> i need it to be a downloadble doc. make sure you have all of his messsages. thats what i really care about

**54. Sat 31 Oct, 7:41 PM ET**

> Here's Michael's email word for word (Oct 30, 5:27 PM ET):
>
> \[Michael’s second email, quoted whole under “Michael’s messages”, section 3, and in `client-log.md`\]

**55. Sat 31 Oct, 7:54 PM ET**

> Implement everything and give me the link

**56. Sat 31 Oct, 9:18 PM ET**

> Well, here’s my issue that we have now right now you have two main focuses on the screen you’re the words and then you have the blocks and I think it’s difficult because then you have to scroll the one position stop. It’d be ideal if all of the information wasn’t only one point at a time and making that like the main flow so that everyone can understand and see everything well only looking at one thing at a time is the most important thing that we need to optimize for so I want you to make a version of this site where you try and do that however, you need to

Asked what came after “you need to”, he answered “Nothing more, just go”, and chose a separate link.

**57. Sun 1 Nov, 10:19 PM ET**

> I kind of have a feeling you're going to do that. We're just going to put the text in between, covering the whole screen. I don't want that. Rethink how the blocks work. Rethink all the animations, rethink everything to make the focus version better.

**58. Tue 3 Nov, 12:17 PM ET**

> can i see the vercel link

**59. Tue 3 Nov, 12:23 PM ET**

> which is the one with the updated one focus and it dosent look not put to gether

**60. Tue 3 Nov, about 11:15 PM ET**

> Idk, I want a less playful more professional look. Come up with a new thing for the blocks or something else entirely and render and create. Rn there is still text popping up. It shouldn't be there if it's not the focus. And if it's not the focus then it shouldn't be vital for people to understand

**61. Fri 6 Nov** [with a screenshot of the /focus film's first act at its peak]

> wtf is this

**62. Fri 6 Nov**

> it mainly just makes no sense

**63. Fri 6 Nov**

> rework from the ground up

**64. Thu 12 Nov, about 1:40 PM ET**

> Look at Michael's website. It's an upside-down book. Look at his go-to Gmail. Look at his feedback. We need to implement all of that. Make it perfect. I don't know. Figure that shit out.

**65. Thu 12 Nov, about 7:40 PM ET**

> Okay, I don't know if I still see that it's immediately a book. What I want you to do is actually try and do this. I want you to try and use the blocks to show all the text needed without having any left-aligned text.

**66. 13-14 Nov (time not recorded)**

> Find the chat, where I asked you to try and make the whole thing without any like text besides blocks or anything like that didn't just have to be stacking or fade in. It could be other cool movements. Just find the link or whatever the output was that I don't need the exact chat

**67. Sat 14 Nov**

> The problem with both of these is that there's still like text along the bottom. We have two focuses and that's the problem.
