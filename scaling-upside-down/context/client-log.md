# Client log: Michael's messages and James's calls

This is the running record of what Michael Wentz (the client, author of *Scaling Up-Side-Down*) and
James (the agency owner) have said. Newest first. Quote their exact words, and under each entry say
what it means for the work and its status (Open, Done or Waiting).

**Every chat adds to this file.** Michael's emails and texts, call notes, Looms, and James's
messages and screenshots all get logged here, in the same commit as the work they cause.
James's full chat history (67 messages to Nov 14, word for word) is in `PROJECT-RECORD.md`,
under "All of James's messages, word for word".

---

## Tue 24 Nov 2026: James: make the site out of the book, like the AirPods page; he does not like the blocks

> Basically I want you to do is go and look at Michael look at the email they sent update all that [...] I want you basically take like the Apple AirPods website that won awards and basically make it out of a book like show the book render it now you can open it up. You can show the pages you can do cool stuff you can show charts and diagrams to explain the point of the book the purpose why you should care because I think I don't know about this block system right now and I don't like it

(Dictated.) What it means: a new direction for the home page, and it overrides two standing rules in `CLAUDE.md`
("no Apple look", "real 3D: the blocks are Blender renders"). **Done** (preview, branch
`claude/interactive-book-website-0iua5w`): the home page is the hardcover itself, in a dark room, drawn live in the
browser from the cover's flat art (`public/cover/`, cut from direction 1's wrap on `claude/susd-cover`). The scroll
opens it and turns its pages; each spread sets Michael's words on the left page and one diagram on the right:
- who it is for (L415);
- Revenue Up. Margins Down.: Chapter 17's exhibit as three charts (revenue $3M to $4.2M, margin 20% to 5%, owner
  take $900K to $150K);
- the team from 12 to 25 people, drawn with a line between every pair (66 to 300 coordination pathways);
- "That isn't scaling." / "That's scaling upside down.": the second is printed upside down and the book is turned
  over to read it;
- the cycle as a staircase against the scaling trap's one spike, with Up, Sideways, Down in Michael's order;
- the twelve systems.
Then the book closes and stands beside the one sign-up. Both of Michael's 23 Nov points are answered in it (below).
The block story is kept at `/?v=blocks`. **Waiting** on James's review. **Open**: the cover used is direction 1
(nearest Michael's mockup), since no cover is picked yet; and whether the dark room is right for this book.


## Mon 23 Nov 2026, 5:28 PM ET: Michael: Up first, then Side, then Down (email, Alpha inbox, with a screenshot)

> And one more thing James. I don't know if this was intended or not ... but Up for Growth should go first? then Sidways for stabilzation? the Down for Pruning? Up-Side-Down?

The screenshot (`media/2026-11-23-michael-slab-order.png`) is the story's three slabs standing in a row: SIDEWAYS FOR
STABILIZATION, DOWN FOR PRUNING, UP FOR GROWTH.

What it means: wherever the three are shown together, the order is the title's: Up, Side, Down. **Done** on the book
page (the cycle's diagram and its three lines, the twelve systems' rows). **Open** on the block story (`/?v=blocks`):
its film is rendered in the old order (`render/words_film.py`) and was not re-rendered.


## Mon 23 Nov 2026, 11:02 AM ET: Michael: drop the two middle planks, keep the JOIN plank under the title (email, Alpha inbox, with a screenshot)

> Thank you update James. For the initial appearance I think you can remove the two middle blocks "A book by Michael Wentz" and "ffor bootstrapped founders". And keep the "Join the First-Edition List" Right below it but separated with a space. That is if it's possible.
>
> Looking forward to the graphics :)

The screenshot (`media/2026-11-23-michael-hero-planks.png`) is the live hero: the hardcover, the SCALING / UP / SIDE /
DOWN blocks, the two planks and the red JOIN plank.

What it means: the first screen is the book and the one button, nothing between them. **Done** on the book page: the
hero is the hardcover (its cover carries his name) with JOIN THE FIRST-EDITION LIST under it, set apart. **Open** on
the block story: the planks are in the render (`render/hero_words.py`).


## Sun 22 Nov 2026, 9:23 AM ET: James's update to Michael (email, Alpha inbox)

> Hi Michael,
>
> Quick update so you know where things are. I'm still working on the site, and here's what's in progress.
>
> The opening book section: I saw your recording, and I'm making that part hold on screen even when someone scrolls fast, so the book intro and signup can't fly by.
>
> The handoff: I'm setting it up so you own the domain, hosting, code and assets, with nothing that adds ongoing cost, and so you can make basic updates yourself.
>
> Graphics: I'm also drafting cover ideas now. I'll send you a few directions to react to before going further.
>
> December 1 for layout works on my end. I'll send you the updated link to look at as soon as this pass is ready.
>
> James

What it means: Michael has been told the hold is coming (it is on the book page: one fast scroll stops on the closed
book), that he will own everything, that cover directions are coming, and that 1 Dec works. **Open**: the updated link.


## Thu 19 Nov 2026, later: James: a cover in five ideas, a second site in a new direction, and fix the blocks site

> He also wants a cover design, so spin up a chat, like a subchat. You can put it on Opus and just make a design. Then I want you to look through his website [...] I think we could have more aura to it. [...] I want to try doing less symbolism. Just make a cool-ass website for this. [...] Update the live version with the newest version, but modify it a lot better, and then make it more clean. [...] Right now, it's kind of boring because the blocks are just sitting around, whereas I feel like if I could actually have more of an understanding, that'd be better. I think you can add some text, but put the text in certain ways that make it good. [...] I don't want weird left-aligned.

> I know, I understand that he likes blocks, right, and whatever, but I just want to make another one that has just a completely different direction, or it's just cool. Then you focus right now on the blocks one and making it good, while the other one makes the book cover. I want five different book cover ideas from the other ones. Let me know so I can pick the top two to send to him. You need to fix the shit out of the site, so get to work.

What it means, and what was done:
- **The live site went to the newest version** (14 Nov blocks story plus the 13 Nov hero hold). **Done**.
- **A second site in a completely different direction**, not built on the blocks, researched on awwwards.com and
  James's taste repo (`joe51111jwd/james-taste`) first, as a preview only (branch `claude/susd-aura`, its own chat).
  **Open**: James compares the two.
- **Five cover ideas** for James to pick two to send Michael (branch `claude/susd-cover`, folder
  `scaling-upside-down-cover/`, its own chat). Michael asked to agree the graphics' scope and cost first, so this is
  a pitch. **Open**.
- **The blocks site, fixed** (this branch, then live):
  - **The real hardcover is back on the first screen.** It stands on the table beside the title page of blocks it
    is made of, so the first screen shows the book itself, its subtitle (the "why") and who wrote it (Michael,
    30 Oct, asked twice; James promised "the cover at the top" on 3 Nov).
  - **Four of Michael's lines**, each while the film holds on what it says, centred in the open paper beside or above
    the blocks, never over them, never in a column or along the bottom:
    - the tower straining: L1070 (revenue up, the bank account didn't feel it; margins, the founder the bottleneck)
    - the title upside down: "That isn't scaling. That's scaling upside down." (the back cover)
    - the dead weight leaving: L2564 (what to keep)
    - the finished building: L1728 ("You're already doing all three...")
  - **The ending:** the chapter rail and the line over the close-up of the pile are gone.
  - **The story is about 15% shorter** (1460vh to 1240vh), so the blocks never sit still for long.
  - **`/focus` is retired:** it redirects home, and its two films are no longer shipped.

## Thu 19 Nov 2026: James: "lock down" his site: get the design exact so the message lands (and the $2,000)

> No, I meant lockdown. I need to build his site. We need to get it looking good, sorry, not security-wise. I need you to understand all of the context so we can get our 2K, because he said he'd pay us 2K. Fully understand everything so that we can actually get a good site. I need all the links. I need to go through. I need to make changes. I need to get the exact design down because right now we're not getting across the message.

What it means: finish the design so it carries the book's message, and get the site to the "completed website"
Michael agreed to pay $2,000 for (13 Nov). This time the Alpha inbox (james.camarota@alpha.school) was read, so the
emails earlier chats could not find are filed below: Michael's 3 Nov and 9 Nov emails and James's replies of 3 Nov
and 12 Nov. The 13 Nov hero hold (branch `claude/hero-hold`) and the 14 Nov blocks-only story (branch
`claude/great-lamport-os1jry`) had split; branch `claude/relaxed-ptolemy-r93t8h` joins them. The hold's stop moved
from 0.015 to 0.01 of the story, because the 14 Nov hero starts to leave at 0.014. Checked with a trackpad-shaped
flick in a browser: one flick stops on the title page and the next goes on. On production the same flick goes
3,533 px down, past the whole hero. **Open**: James's review of the design, then the reply to Michael's 13 Nov email
(it is not answered yet, and James's 12 Nov reply promised him the updated link "this week").


## Sat 14 Nov 2026: James: the story still has text along the bottom: "We have two focuses"

> The problem with both of these is that there's still like text along the bottom. We have two focuses and that's the problem.

(Before it, in the same chat, time not recorded: "Find the chat, where I asked you to try and make the whole
thing without any like text besides blocks or anything like that didn't just have to be stacking or fade in. It
could be other cool movements. Just find the link or whatever the output was that I don't need the exact chat".
That chat was not found; the nearest were the home preview, where only the hero's words are on blocks, and the
retired focus film of 3 Nov, where the planks carried the first line but a line of text still came up at each
hold. "Both of these" is those two.)

What it means: the hero was fixed, but the story under it still put words on the screen apart from the picture:
the beats (on the left on desktop, along the bottom on phones), the chapter rail along the bottom and the tags
pinned to blocks. The eye has two places to be. The story is now told by the blocks alone, in a new Blender film
(`render/words_film.py`), and the page puts no words over it. **Done** (preview, branch `claude/great-lamport-os1jry`):
- The hero's planks are in the film's scene, so the first scroll carries straight on from the title page.
- Three raw-wood planks are thrown on first, read top down: ALWAYS LAUNCHING / ALWAYS HIRING / ALWAYS ADDING
  (L1993). Then the hires and tools, faster and crooked, and it falls over.
- SCALING and UP / SIDE / DOWN turn upside down together (the title, upside down), hold, and are set right.
- Three slabs in the cover's paints, each read in a push-in before what it starts, each moving its own way:
  SIDEWAYS FOR STABILIZATION slides in from the side and the twelve systems slide in (L3316); DOWN FOR PRUNING
  is lowered from above and the dead weight leaves, the ALWAYS planks with it (L3317); UP FOR GROWTH rises out
  of the table and the team goes back on, the building rising past where the rush fell (L3315).
- The page: the beats, the chapter rail, the tags and the wash behind them are gone from the story. On a phone
  the picture steps back until the thing it is about (a slab being read, the whole building) fits the screen.
  The words are still in the page for screen readers, in the story's description.
Unchanged: the opening, the hero, the closed loop and the sign-up after the story, `/appendix` and `/focus`.

## Fri 13 Nov 2026, 5:15 PM ET: James: implement Michael's newest feedback

> I saw that he gave a bunch of feedback. Can you give me a huge favor and send a claw chat on that implementing all that feedback into his website? The book is called scaling upside down

> Just the most recent one pls

What it means: the newest email (below, 13 Nov, 12:03 PM). Its one change to the site is the fast scroll. **Done**
(preview, branch `claude/hero-hold`): see the entry below.

## Fri 13 Nov 2026, 12:03 PM ET: Michael: a normal trackpad scroll skips the book's opening (email, Alpha inbox, with a 5 s screen recording)

> One small thing I noticed with the opening animation: I did a fairly normal two-finger scroll on my laptop, and the entire book introduction and signup offer went by almost instantly. I've attached a quick recording so you can see what I mean. I really like the animation, but I wonder if there's a way to keep that opening book section in view longer, even when someone scrolls quickly? It's probably the most important part of the website, and I wouldn't want visitors to miss it. I'll leave the best way to handle that to your judgment.

> The $2,000 sounds reasonable for the completed website as you've outlined it.

> My main concern is keeping things simple and minimizing ongoing costs. [...] Ideally, I'd own the domain, hosting accounts, source code, and site assets, and be able to make basic updates myself.

> As for the graphics, I'd love to see what you come up with. Let's treat that as a separate project. [...] Maybe start by identifying one or two illustrations you think have the most potential for a fresh approach. We can agree on the scope and cost of that initial exploration before you invest significant time.

> On timeline, my hope is to have the book go to layout on December 1st and publish on January 1st. Let me know if that timeline is doable or if it's aggressive.

The recording (`media/2026-11-13-michael-fast-scroll.mp4`) is of the live site (the 31 Oct home page with the "Scroll"
cue): one flick, and the hero (title, who it is for, the sign-up button) is on screen for about a quarter of a second
before the rush and the margin panel.

What it means:
- The opening must hold even on a fast scroll. **Done** (preview, branch `claude/hero-hold`): one scroll that starts on
  the hero now stops on the hero (`src/herohold.ts`, `HERO_HOLD` in `src/story.ts`). It moves a little, so the page
  answers (the "Scroll" cue goes), and the title page of blocks and the red JOIN plank stay whole; the next scroll goes on
  into the story as before. It covers a trackpad fling, a mouse wheel, Space and Page Down, and a flick on a phone.
  Scrolling up, links and the menu are never held; a visitor who keeps scrolling without a pause is let go after about
  2 seconds, and a fresh swipe made during the first one's glide goes on. The wheel rules are checked against simulated
  trackpad and wheel gestures by `scripts/check-herohold.mjs`.
- He owns everything at the handoff (domain, hosting, code, assets) and keeps costs low: James plans to set it up on
  Vercel and transfer it to him. **Open** (not a site change).
- Graphics are a separate project, scope and cost agreed first. **Open** (not this site).
- Book to layout 1 Dec, published 1 Jan. **Waiting** on James's answer to him.

## Thu 12 Nov 2026, 10:50 PM ET: James's reply to Michael's 9 Nov check-in (email, Alpha inbox)

> Hi Michael,
>
> Thank you, that means a lot. It's coming along well: the book and cover now lead the page, the copy speaks to bootstrapped founders, and the Bootloader sits behind one email signup with the appendix page still public. I'll send you the updated link this week.
>
> The initial build is $2,000. That covers the site as you described it, the signup that delivers the Bootloader, and the public appendix page with a path back to the book.
>
> And yes, I'd love to take on the graphics too. I can do a first pass alongside the build so you can see whether it fits before we decide anything more.
>
> James

What it means: the price ($2,000), and what it pays for: the site as Michael described it, a sign-up that **delivers**
the Bootloader (so an email service has to be connected), and the public `/appendix` with a path back to the book.
Michael accepted on 13 Nov. **Open**: the updated link is not sent yet.


## Thu 12 Nov 2026, about 7:40 PM ET: James: put all the hero's words on the blocks, no left-aligned text

> Okay, I don't know if I still see that it's immediately a book. What I want you to do is actually try and do this. I want you to try and use the blocks to show all the text needed without having any left-aligned text.

What it means: the first screen still did not say "book" at a glance: the eye goes to the blocks, and the
words sat in a column on the left. The words the hero needs go on the blocks themselves, and the text column
goes. **Done** (preview, branch `claude/great-lamport-os1jry`): the first screen is a title page made of
blocks, rendered into the hero frame's own scene in Blender (`render/hero_words.py`), so it stands on the same
table in the same light:
- SCALING, stamped up a tall plank beside UP / SIDE / DOWN, as on the cover (the title in blocks);
- A BOOK BY MICHAEL WENTZ and FOR BOOTSTRAPPED FOUNDERS on two planks laid one on the other under them;
- JOIN THE FIRST-EDITION LIST on the red plank in front: the page's one button (a link to the sign-up; it lifts
  under the pointer and has a focus ring for the keyboard).
The opening still plays by itself; the planks are set down as the blocks settle, the red one last. The picture
steps back for the hero so the whole title page fits any screen, centred, and steps in again as the rush starts.
The words are also in the page for screen readers and search (and the red plank's link reads "Join the
first-edition list. Comes with the SUSD Bootloader, free."). The hardcover is no longer on the first screen (the
blocks rebuild its cover; the book itself is still at the end of the page and in the link preview).


## Thu 12 Nov 2026, about 1:40 PM ET: James: implement all of Michael's feedback, and make it perfect

> Look at Michael's website. It's an upside-down book. Look at his go-to Gmail. Look at his feedback. We need to implement all of that. Make it perfect. I don't know. Figure that shit out.

(Dictated. "Upside-down book" is *Scaling Up-Side-Down*. The connected Gmail was searched again: Michael's
emails are not in it, so his feedback is the two emails filed below, 27 Oct and 30 Oct, plus the call.)

What it means: back to the client. The home page `/` is what Michael sees, so every point of his two emails
was checked against it again, on desktop and phones, with fresh eyes, and what still fell short was fixed.
What fell short, and what changed (release on branch `claude/great-lamport-os1jry`, preview first):

| His point | What was still wrong | What changed |
|---|---|---|
| 30 Oct #1: "When someone lands on the site, I want them to immediately understand that Scaling Up-Side-Down is a book" | The first screen was the three blocks and "Scroll". The book only came after scrolling | The opening plays by itself as the page loads (about 2.5 s: the blocks lying face up stand up and stack) and lands on the hero. No scroll needed to see the book. Reduced motion, a slow connection or a reload part-way down skip it |
| 30 Oct #1: "the actual book cover featured more prominently, especially near the beginning", "connecting those visuals to the physical book" | The hardcover was a thumbnail at the screen's edge, a third the size of the blocks | The hardcover stands on the table beside the blocks that stacked into its cover, at their scale (desktop), and beside them under the title (phones). Placed from the picture itself, so it holds on every screen shape |
| 30 Oct #1: "who it's written for, and why they might want to read it" | "For bootstrapped founders" was the tail of a tiny label; phones hid the why line | "A book by Michael Wentz" and "For bootstrapped founders" on their own lines; the why line (L415) on phones too; the book's card at the end shows the back cover's line on phones |
| 30 Oct #2 and #5: the problem in few words; "We also don't need to communicate every concept" | Beside "Always launching..." and the revenue line sat the margin-inversion panel (team, revenue, margin, owner take, communication pathways), plus tags repeating the blocks' own stamps | The panel and those tags are gone: one thing in focus at a time |
| (record, open item) the end card on a phone held sideways ran under the menu, its button cut | | Fits from 667x320 up: the line about the appendix steps aside there, the back cover's line stays whole |

Unchanged on purpose: the copy (still word for word), the blocks film Michael said he wants to keep, the one
sign-up, `/appendix`, and `/focus`. **Waiting** on James to look at the preview and say whether it goes live;
still **Waiting** on Michael for his email platform, the final cover, the list's promise and the pre-order link.


## Mon 9 Nov 2026, 2:37 PM ET: Michael checks in: the cost, and the graphics (email, Alpha inbox)

> Just thought I'd check in James. I'm so impressed with what you've accomplished thus far. How is everything coming along?
>
> A couple of follow-up questions.
>
> Can you let me know the initial cost for the website build?
>
> Are you interested in working on the graphics as well? In our conversation, you mentioned your mother but also that you might interested in giving the graphics a try?
>
> Let me know!

What it means: he asked for a price and offered the book's graphics. **Done**: James answered on 12 Nov ($2,000; yes to
the graphics).


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

## Tue 3 Nov 2026, 12:57 PM ET: Michael: "I'm looking forward to seeing what you came up with" (email, Alpha inbox)

> Thank you for letting me know James. I'm looking forward to seeing what you came up with :)
>
> Cheers,
>
> Michael

## Tue 3 Nov 2026, 12:17 PM and 12:23 PM ET: James asks for the link to the new focus version

> can i see the vercel link

> which is the one with the updated one focus and it dosent look not put to gether

What it means: none of the links had the rethought version yet (the live `/focus` was still the first
take, with the full-screen lines). James wants the new one, and it has to look finished, not pieced
together. **Done** in the release that followed: the new focus film (see the entry below) at `/focus`.

## Tue 3 Nov 2026, 12:16 PM ET: James's reply to Michael's 30 Oct email (email, Alpha inbox)

> Hi Michael,
>
> Thank you again for the detailed feedback. I'm still working through it, but I have some updates I'd love to share with you.
>
> I'm putting the book front and center with the cover at the top, tightening the copy so bootstrapped founders recognize themselves right away, and keeping the Bootloader secondary behind a single email signup. The appendix page will stay public, with a clear path back to the book.
>
> I'll send you the updated link as soon as it's ready for a look.
>
> Best,
> James Camarota
> jamescamarota.com

What it means: this, not the draft in `PROJECT-RECORD.md`, is what Michael got. It promises "the cover at the top"
and founders who "recognize themselves right away". **Open**: the link.


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
