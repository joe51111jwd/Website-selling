# CLAUDE.md: Scaling Up-Side-Down

This is the site for Michael Wentz's book *Scaling Up-Side-Down* (SUSD), built by James's agency
(GitHub `joe51111jwd`).
- Live: https://scaling-up-side-down.vercel.app
- Vercel project: "scaling-up-side-down"
- Code: this folder, on branch `claude/beautiful-cori-a7cq5v`

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
   - all 49 of James's messages, word for word

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
  numbers). Labels, buttons and status messages are the only exception.

**Look**
- Its own style: no Apple look, no flat text pages, nothing that looks AI-generated. The bar is
  Awwwards-level craft.
- Real 3D: the blocks are Blender renders made in the cloud (`render/`) and played back as you
  scroll. No AI images.
- The story: a business grows too fast and topples; strong foundations let it scale; growth is a
  cycle of Up, Side, Down.
- Less text and clean on phones. Desktop comes first, but check every section at phone sizes.

**The Bootloader**
- It is a **file/spec**, not a prompt. Present it with its version and word count. People upload
  it and then use the short starting prompt.
- Getting it is an **email opt-in**, not "copy the prompt".
- The single source is `public/bootloader.md`. The site, `/appendix`, word count and version are
  all built from it, so to update, replace that file and redeploy.
- `/appendix` must stay plain, script-free, citable HTML for AI crawlers (GEO), with llms.txt and
  a sitemap. The book prints scalingupsidedown.com/appendix.

**Accounts and keys**
- Keys go in Vercel env only, never in the repo or chat. The env names are:
  - KIT_API_KEY and KIT_FORM_ID
  - or MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID
  - or OPTIN_WEBHOOK_URL
- No domain or DNS changes without James's OK.

## Waiting on Michael (as of Oct 29)

- His email platform (Kit, Mailchimp or other), so the opt-in can send the file.
- The book's pre-order link (`src/links.ts`).
- Pointing scalingupsidedown.com at the Vercel project.

## Proposed next build (once Michael agrees)

- Open with "How many people are on your team?" so visitors see the book is for them.
- An Up, Side, Down section where the blocks go up, sideways, down and repeat.
- The same two choices, the book and the Bootloader, after each key moment.
