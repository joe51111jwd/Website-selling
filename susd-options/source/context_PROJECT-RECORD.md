# Scaling Up-Side-Down: project record

This is a text copy of the project record James made on Thu 29 Oct 2026. The original is
`context/source/2026-10-29-scaling-up-side-down-project-record.docx`. New messages from Michael or
James go in `context/client-log.md`; when state changes, update this file too.

## Where things stand

The site for Michael Wentz’s book *Scaling Up-Side-Down* is live at
https://scaling-up-side-down.vercel.app and already includes his first
round of feedback. The last release went out on Tue 27 Oct 2026.

| What                                        | Where                                                                                               |
|---------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Live site                                   | https://scaling-up-side-down.vercel.app                                                             |
| The Appendix (the Bootloader as a web page) | https://scaling-up-side-down.vercel.app/appendix                                                    |
| The Bootloader file                         | https://scaling-up-side-down.vercel.app/bootloader.md (V16, 35,445 words, 284 KB)                   |
| Hosting                                     | Vercel project “scaling-up-side-down”                                                               |
| Code                                        | GitHub joe51111jwd/Website-selling, branch claude/beautiful-cori-a7cq5v, folder scaling-upside-down |

Waiting on Michael: his email platform (Kit, Mailchimp or other), the
book’s pre-order link, and pointing scalingupsidedown.com at the site
(the book already prints scalingupsidedown.com/appendix).

## Michael’s messages

Michael has sent two things: the discovery call on Tue 21 Oct (recorded
in Granola) and his written feedback on Tue 27 Oct. No email from him
turned up in this Gmail.

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

## How each of Michael’s points has been answered

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

**Tried and dropped:** the first reflection, pyramid and flip ideas; an
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

## Releases

Before each release the site was reviewed by independent checkers and
tested in a browser at desktop and phone sizes. The last review found 43
issues; all were fixed before it shipped. Newest first, US Eastern.

| When                     | What it added                                                          |
|--------------------------|------------------------------------------------------------------------|
| Tue 27 Oct, 5:19 pm      | Fixes from the 43-point review. Live in production now                 |
| Tue 27 Oct, 1:26 pm      | The /appendix page, the email sign-up, the Bootloader shown as a file  |
| Mon 26 Oct, 4:16 pm      | The real SUSD Bootloader V16 (35,445 words)                            |
| Mon 26 Oct, 12:54 am     | Fixes from the COPY block review                                       |
| Sun 25 Oct, 11:33 pm     | The COPY block: one dramatic button                                    |
| Sun 25 Oct, 9:10 pm      | The closed-loop ending                                                 |
| Sun 25 Oct, 5:33 pm      | Full-quality frames for the opening and the story                      |
| Sun 25 Oct, 3:49 pm      | The new ending and the opening where the blocks stack                  |
| Sun 25 Oct, 2:16–4:30 am | The scroll story from Blender renders, two review rounds, final frames |
| Sat 24 Oct, 2:59 pm      | Apple-style homepage (later dropped)                                   |

## Draft reply to Michael (not sent yet)

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

**Proposed next build, once Michael agrees**

- “Is this for me?”: open with “How many people are on your team?”
- An Up, Side, Down section where the blocks go up, sideways, down and
  repeat.
- The same two choices, the book and the Bootloader, after each key
  moment.
- Later phases from the call: a logged-in environment that enforces the
  spec, then a subscription.

## All of James’s messages, word for word

Every message James sent in this project’s chat, in order, US Eastern
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
