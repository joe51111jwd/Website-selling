# CLAUDE.md: Scaling Up-Side-Down

This is the site for Michael Wentz's book *Scaling Up-Side-Down* (SUSD), built by James's agency
(GitHub `joe51111jwd`).
- Live: https://scaling-up-side-down.vercel.app
- Vercel project: "scaling-up-side-down"
- Code: this folder. Newest on branch `claude/relaxed-ptolemy-r93t8h` (19 Nov: the live site), which joins
  `claude/great-lamport-os1jry` (14 Nov) and `claude/hero-hold` (13 Nov). A second site in a new direction is on
  `claude/susd-aura` (preview only) and the cover ideas on `claude/susd-cover`

## The book page (since 24 Nov)

James, 24 Nov: "take like the Apple AirPods website that won awards and basically make it out of a book ... I don't
know about this block system right now and I don't like it". On branch `claude/interactive-book-website-0iua5w` the
home page is the hardcover itself, opened by the scroll (`src/components/BookPage.tsx`, `src/bookfilm.ts`,
`src/bookcopy.ts`, `src/book-page.css`, cover art in `public/cover/`). Where it disagrees with the Look rules below
(the Apple look, the Blender blocks, no text beside the picture), the 24 Nov direction wins. The copy rule, the
Bootloader rules and the hero hold all still apply. The block story is kept at `/?v=blocks`.

## Read before you work

1. `context/client-log.md`: Michael's messages and James's calls, newest first, word for word,
   with what each one means and its status. Check the top entries before you change anything.
2. `context/PROJECT-RECORD.md`: the full record. It covers:
   - where things stand
   - the discovery call notes
   - Michael's feedback and how each point was answered
   - decisions and what was tried and dropped
   - every release
   - the unsent draft reply
   - open items
   - all of James's messages, word for word (60 as of Nov 3)

   The original `.docx` is in `context/source/`.
3. `README.md`: how the site is built and how to update the Bootloader, links and copy.

## Filing context

Every piece of client context goes into this repo so the next chat has it:
- Michael's emails, texts, call notes and feedback, and James's messages, go in
  `context/client-log.md`, newest first. Each entry needs the date and time, the source, the exact
  words, what it means and its status.
- Screenshots and media go in `context/media/`, named `YYYY-MM-DD-<what>.<ext>`. Never put them
  in `public/`, which is served on the site.
- When state changes (a release, a decision, an open item closed), update `context/PROJECT-RECORD.md`.
- Commit the context with the work it caused, or on its own if no work comes from it yet.

## Rules that always apply

**Copy**
- Every sentence on the site is word for word from Michael's manuscript (`src/copy.ts`, with line
  numbers). The book's own covers count: the cover's subtitle and the back cover's copy (the
  manuscript's last picture) are quoted whole. Labels, buttons and status messages are the only
  exception.
- The book leads, the Bootloader comes second (Michael, 30 Oct). Keep it simple: build on the
  copy, layout and emphasis before adding anything new.

**Look**
- Its own style: no Apple look, no flat text pages, nothing that looks AI-generated. The bar is
  Awwwards-level craft.
- Real 3D: the blocks are Blender renders made in the cloud (`render/`) and played back as you
  scroll. No AI images.
- The story: a business grows too fast and topples; strong foundations let it scale; growth is a
  cycle of Up, Side, Down.
- Less text and clean on phones. Desktop comes first, but check every section at phone sizes.
- Land on the book (Michael, 30 Oct; since 12 Nov): the opening plays by itself on load and the first
  screen says it is a book, who wrote it, who it is for, and has the one button; never make the visitor
  scroll to learn it is a book. Since 13 Nov (James) the blocks carry those words, with no text column:
  SCALING beside UP / SIDE / DOWN, A BOOK BY MICHAEL WENTZ, FOR BOOTSTRAPPED FOUNDERS, and the red
  JOIN THE FIRST-EDITION LIST plank as the button (`render/hero_words.py`). Since 19 Nov the real hardcover
  stands on the table beside them (drawn with the hero frame, `HERO_BOOK` in `src/components/Story.tsx`), and
  one fast scroll never carries the visitor past this screen (`src/herohold.ts`, Michael 13 Nov).
- One focus (James, 14 Nov: "there's still like text along the bottom. We have two focuses"): no captions, tags
  or chapter rail over the picture, and each moment has one thing moving (`render/words_film.py`). Since 19 Nov
  (James: "add some text, but put the text in certain ways that make it good"; "I don't want weird left-aligned")
  four of Michael's lines come up, one at a time, while the film holds on what each says, centred in the open
  paper beside or above the blocks and never over them (`HOME_LINES` in `src/story.ts`, `HOME_COPY` in
  `src/copy.ts`). Never a text column, never along the bottom.
- `/focus` was retired on 19 Nov: it redirects home and its films are not shipped (`src/focus.ts`).

**The Bootloader**
- It is a **file/spec**, not a prompt, and a companion to the book, not the product.
- There is **one sign-up**: join the book's first-edition list, and the email service sends the
  Bootloader free. The file is **never a direct download** and is not served: no download links,
  no public `.md`.
- The single source is `content/bootloader.md` (not served). `/appendix`, its word count and
  version are built from it, so to update, replace that file and redeploy. The email service's
  welcome email must carry the same file.
- `/appendix` must stay fully public, plain, citable HTML for AI crawlers (GEO), with llms.txt
  and a sitemap, and a clear way back to the book. The book prints scalingupsidedown.com/appendix.

**Accounts and keys**
- Keys go in Vercel env only, never in the repo or chat. The env names are:
  - KIT_API_KEY and KIT_FORM_ID
  - or MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID
  - or OPTIN_WEBHOOK_URL
- No domain or DNS changes without James's OK.

## Waiting on Michael (as of Oct 31)

- His email platform (Kit, Mailchimp or other). Until it is connected the sign-up says "The list
  opens soon." and stores nothing, and nobody can get the file.
- The final cover file (the hero's hardcover is rendered from the cover in the manuscript:
  `render/book.py --solo 1`, `scripts/make_book_assets.py`).
- What the first-edition list promises, in his words.
- The book's pre-order link (`src/links.ts`).
- Pointing scalingupsidedown.com at the Vercel project.
