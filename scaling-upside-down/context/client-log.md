# Client log: Michael's messages and James's calls

This is the running record of what Michael Wentz (the client, author of *Scaling Up-Side-Down*) and
James (the agency owner) have said. Newest first. Quote their exact words, and under each entry say
what it means for the work and its status (Open, Done or Waiting).

**Every chat adds to this file.** Michael's emails and texts, call notes, Looms, and James's
messages and screenshots all get logged here, in the same commit as the work they cause.
James's full chat history (60 messages to Nov 3, word for word) is in `PROJECT-RECORD.md`,
under "All of James's messages, word for word".

---

## Fri 6 Nov 2026: James on the live /focus film: "wtf is this", "it mainly just makes no sense", "rework from the ground up"

> wtf is this

(with a screenshot of the film's first act at its peak, f59-f64: the stack of white slabs leaning, with pieces
jutting out sideways)

> it mainly just makes no sense

> rework from the ground up

Asked how to fix the first act, he picked "Rebuild the fall", then said the film as a whole makes no sense and
to rework it from the ground up.

What it means: the "Load Path" massing-model film does not read. The white slabs and stubs look like a broken
render, and the story (piled on at once, falls, rebuilt one move at a time) does not come across without words.
The new film starts over from the book's own model and pictures, not from the old one. Two concept rounds were
rendered and tested on cold viewers (people shown only the book cover and four stills). Round one (a jack
machine, a ring of pegs and threads) scored 3-4/10 for clarity and was dropped. Round two, built on the growth
line (Up, Side and Down are directions), scored 6-7/10, and every viewer read the story right: all three at once
spikes and crashes; up, sideways, a small step down, repeat, climbs past the old peak. **Waiting** on James to
pick: the chart drawn in ink (recommended) or the cover's blocks becoming the chart.

## Tue 3 Nov 2026, about 11:15 PM ET: James wants a more professional look, and no words popping up

> Idk, I want a less playful more professional look. Come up with a new thing for the blocks or something else entirely and render and create. Rn there is still text popping up. It shouldn't be there if it's not the focus. And if it's not the focus then it shouldn't be vital for people to understand

What it means: the wooden toy blocks read as playful; James wants a more professional visual, either a new
take on the blocks or a different idea, rendered in Blender and built. The lines that appear beside the
held picture still split the eye: words should only be on screen when they are the one thing to look at,
and the picture must make sense without them. **Done** in the release that followed: a new film and
page for `/focus`, with the home page unchanged.
- The film: three concepts were rendered and judged, and the winner is an architect's white massing
  model ("Load Path", `render/loadpath.py`). It is grown by doing everything at once and falls. It is
  then rebuilt on a raft and core, one move at a time: green storeys grow up, ochre wings slide in
  from the sides, the red annex is lowered away. After three rounds it stands far taller. There are
  no words in it.
- The page (`src/components/FocusPage.tsx`) runs one thing at a time: the book alone, then the film
  alone, then the words alone ("Up. Side. Down. Repeat.") once the picture has gone, then the book
  and its sign-up.
- Before it went out (Wed 4 Nov) the page went through five rounds of independent review on phones,
  tablets, 4:3, near-square, 16:10 and wide screens, and every confirmed finding was fixed: the picture
  never jumps or bobs, holds still through the film's still beats, never fades the climbing core into a
  painted band, and the hero fits every phone size, upright and on its side.
**Waiting** on James (and Michael) to compare `/` and `/focus`.

## Tue 3 Nov 2026, 12:17 PM and 12:23 PM ET: James asks for the link to the new focus version

> can i see the vercel link

> which is the one with the updated one focus and it dosent look not put to gether

What it means: none of the links had the rethought version yet (the live `/focus` was still the first
take, with the full-screen lines). James wants the new one, and it has to look finished, not pieced
together. **Done** in the release that followed: the new focus film (see the entry below) at `/focus`.

## Sun 1 Nov 2026, 10:19 PM ET: James turns down the first focus version

> I kind of have a feeling you're going to do that. We're just going to put the text in between, covering the whole screen. I don't want that. Rethink how the blocks work. Rethink all the animations, rethink everything to make the focus version better.

What it means: the first `/focus` (the picture stepping back behind the paper while a line took the
whole screen) only took turns between words and blocks. James wants the blocks themselves to do the
telling. **Done** as a new film for `/focus` (`render/focus_film.py`), storyboarded first
(`render/focus_board.py`):
- the first three blocks on the stack are planks stamped ALWAYS LAUNCHING, ALWAYS HIRING, ALWAYS
  ADDING (the manuscript's L1993), so the problem is read off the blocks, not off a caption;
- after the fall, the cover's own stack turns upside down (DOWN on top, its letters inverted), holds,
  and is set right: the back cover's "That's scaling upside down." made literal;
- the twelve systems slide in from the sides (Sideways), the planks leave with the dead weight (Down),
  and the team goes back on and the building rises (Up);
- the film never moves while words are up: it holds, one short line sits on the paper beside the
  blocks it is about (an upright phone: in the band under the picture), then it moves on. No veils, no
  full-screen text;
- the closed loop the same way: the ring large with its line under it; at the sign-up the ring steps
  back and the card sits under it, so pressing JOIN closes the ring in plain view; then the book alone,
  its card under it.
The live home page is unchanged. **Waiting** on James (and Michael) to compare `/` and `/focus`.

## Sat 31 Oct 2026, 9:18 PM ET: James asks for a version with one thing on screen at a time

> Well, here's my issue that we have now right now you have two main focuses on the screen you're the words and then you have the blocks and I think it's difficult because then you have to scroll the one position stop. It'd be ideal if all of the information wasn't only one point at a time and making that like the main flow so that everyone can understand and see everything well only looking at one thing at a time is the most important thing that we need to optimize for so I want you to make a version of this site where you try and do that however, you need to

The message was cut off. Asked what came after "you need to", James answered "Nothing more, just go",
and chose a separate link (not replacing the live site).

What it means: the eye should never split between the words and the blocks. **Done** (first take,
since replaced: see Sun 1 Nov) as the focus version at `/focus` (same app, `src/focus.ts`): the book alone on landing; the picture alone, centred;
at each pause the picture steps back behind the paper and one line takes the screen; the sign-up is one
card that steps away while the ring closes, then comes back with the answer; the book alone at the end.
The live home page is unchanged. **Waiting** on James (and Michael) to pick one.

## Sat 31 Oct 2026, 7:54 PM ET: James asks to build all of it

> Implement everything and give me the link

**Done** in the release that followed (see the entry below for what changed, point by point).

## Fri 30 Oct 2026, 5:27 PM ET: Michael's second email (forwarded by James, Sat 31 Oct, 7:41 PM ET)

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

What it means: the book leads and the Bootloader comes second, with one sign-up that does double
duty. Mostly copy, layout and emphasis; keep the blocks.

| His point | State |
|---|---|
| 1. The book is the main focus; the real cover near the start | **Done.** The hero shows the real hardcover (a Blender render of the cover from the manuscript) beside the stacked blocks, with the title, "A book by Michael Wentz · For bootstrapped founders", the cover's subtitle and one button. The finale lands on the book. The final cover file is **Waiting** on Michael; the render uses the cover in the manuscript. |
| 2. Founders recognize the problem | **Done.** The story leads with "Always launching. Always hiring. Always adding.", then his L1070 lines (revenue growing but the bank account not feeling it, margins shrinking, the founder as the bottleneck), then the back cover's "That isn't scaling. That's scaling upside down." |
| 3. The cycle is clear; curiosity, not the framework | **Done.** One line per phase (Sideways for stabilization, Down for pruning, Up for growth), ending on "You're already doing all three" and "The problem is you're doing them at once". The equations, the trap beat, the twelve-systems count and the proof section are gone. |
| 4. Bootloader secondary; one sign-up; file only by email; appendix public with a way back | **Done.** One sign-up everywhere: "Join the first-edition list", with the Bootloader free by email. The file is no longer served or linked (moved to `content/`; its old addresses redirect to `/appendix`; `llms-full.txt` removed). `/appendix` stays public, with the book at its top and bottom. Until an email service is connected the sign-up says "The list opens soon." and stores nothing: **Waiting** on his email platform. |
| 5. Keep it simple | **Done.** Fewer beats, one button, nothing new to maintain. |

To ask him: the final cover file, his email platform (the file can only come by email now), and
what the first-edition list promises, in his words.

## Thu 29 Oct 2026, 3:08 PM ET: James asks for a project record

James asked for a full record of the project. It is `PROJECT-RECORD.md` (original `.docx` in
`source/`). Same day, he asked that all client context be filed in the repo so new chats have it.
**Done.**

## Tue 27 Oct 2026, 1:06 PM ET: Michael's written feedback (forwarded by James)

Michael sent two examples he made with AI:
- a screenshot of a "Get the Free Bootloader" email sign-up
- a screen recording of a mocked-up Appendix page, "an example not necessarily direction"

The recording (Recording_80.mov) is not in the repo.

> Hey James! Really impressed with what you've put together, especially with very little direction from me.
>
> You've captured something important about the book, and I really like the visual storytelling with the blocks, the growing complexity, and the transition toward a different way of scaling.
>
> I definitely don't think you need to go back to the drawing board. I think this is a great starting point, and I'd love to keep building on the concept.
>
> As we iterate, I think the biggest things to focus on will be helping visitors immediately recognize that the book is for them, making the central idea of cyclical growth (Up, Side, Down) clear, and figuring out how we guide them toward the book and Bootloader.
>
> I also really like that you're thinking about making the Bootloader something people want to share. That could be a big part of what makes the site different. That said, I think making it clear where they can "Opt-in" to get the appendix instead of a "copy the prompt".
>
> The only other thing, and maybe, I'm missing it but I'd like the Appendix Bootloader also sitting on it's own page in a way that if crawled by AI it would best best be assimilated by AI…for GEO purposes. I've recorded a video of something I mocked up with AI as an example not necessarily direction. I'd also distinguish the Bootloader from a generic AI prompt. It's a file/spec/software containing the OS, not just something to paste into AI.
>
> But honestly, I don't want to over-direct you at this stage. I like where your creativity is taking this, and I'd love to see how you continue developing it.
>
> Really great first pass! Let me know how you want to take next steps.

| His point | State |
|---|---|
| Opt-in instead of "copy the prompt" | **Done** (live). The ending block and every "Get the Bootloader" button lead to an email sign-up. Sending email is **Waiting** on his email platform. |
| Appendix on its own page for AI crawling (GEO) | **Done**: `/appendix`, plain HTML with section permalinks, structured data, llms.txt and a sitemap |
| Bootloader is a file/spec, not a prompt | **Done**: shown as a 35,445-word file with version and download, plus a short starting prompt |
| Make the Bootloader shareable | **Done**: every section of `/appendix` has its own link |
| Visitors recognize the book is for them | **Open, proposed**: open with "How many people are on your team?" |
| Up, Side, Down clear as a cycle | **Open, proposed**: a section where the blocks go up, sideways, down and repeat |
| Guide people to the book and the Bootloader | **Partly done**: the Bootloader path is live; the book path is **Waiting** on the pre-order link |

The draft reply to Michael is in `PROJECT-RECORD.md`. **Not sent yet**; James sends it.

Since his 30 Oct email (above): the sign-up is now for the book's first-edition list, the file is
no longer a download (email only), and the three "Open, proposed" points were done his way instead
(the book up front, the problem first, the cycle named once).

## Tue 21 Oct 2026, 2:51 PM ET: discovery call (Granola notes)

The full notes are in `PROJECT-RECORD.md`, under "Discovery call". The points that set the build:
- Phase 1 is a homepage that challenges conventional thinking, plus the 35,000-word appendix as a
  public page for AI crawling with an email opt-in to download the Bootloader.
- Michael's priority: push updated versions of the Markdown file easily, with no rebuild work.
- Phase 2 is a logged-in environment that enforces the spec. Phase 3 is a subscription. No
  decision yet on how to build Phase 2.
- He wants an ongoing, iterative relationship: show demand first, then build the complex parts.
  He is not in a rush.
- Next steps from the call:
  - James reads the manuscript and comments in the Google Doc (Michael offered to pay).
  - James tests the Bootloader.
  - James asks his mother about design involvement.
