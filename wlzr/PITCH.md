# WLZR.TV: Major Lazer's pirate station

Brief (&SONS deck, Oct 27 2026, and the call with Alexander Ferzan): a pirate-radio landing page for
*Shock The System*. A white desktop with MAJOR LAZER, WLZR.TV, four icons (Tour, Videos, Music, Merch) and the
green SHOCK THE SYSTEM bar. Each icon opens a Winamp-style player shaped like a band member's head; the
players move around and open one at a time or all together. Due end of month.

Built in `wlzr/` (Vite + TypeScript, no framework). `npm install`, `npm run dev` (port 5201), `npm run build`
(outputs `dist/`, relative paths, so it works at wlzr.tv/ or under any sub-path).

## What it does

- **Boot.** A short green-on-black tuning sequence ("SCANNING 103.3 MHz… SIGNAL LOCKED"), then the screen
  collapses like an old CRT into the desktop. Once per session; click to skip; `?noboot` skips it.
- **WLZR.TV tunes in.** The red pixel wordmark is drawn live on a coarse grid: it sharpens from a few blocks to
  full resolution on load, and loses signal now and then (rows slip, a blue ghost splits off). Hover it to
  jam it; with the radio on it glitches on the beat.
- **Four heads, four players.** Click an icon (or press 1–4) and that head flies out of its icon, lands with a
  bounce and boots its screen through a burst of static. The globe (top right, or `A`) opens or closes them
  all. Each head floats on its own rhythm; grab anywhere on its visible pixels to drag it (the hit test uses
  the picture's alpha, not a box), toss it, and it comes to the front. Hover shows a little title bar with ×.
  - **Videos** (blue visor): the visor screen plays the video. FILES flips clips, OPTIONS tints it, VIEW or a
    tap opens the classic **Video Player** window: seek, transport, volume, playlist. With a YouTube id it plays
    YouTube.
  - **Music** (green speaker helmet): a round red LCD with the clock, title, a live spectrum and transport.
    It's a radio: changing track tunes through static. The speakers ring and the head nods on the beat, the
    ON AIR light goes red and the SHOCK logo pumps.
  - **Merch** (red LED goggles): the left lens is the menu (T-Shirts, Hats, Sweats, Accessories), the right
    lens cycles products. Tap a product for its window with sizes and Add to cart.
  - **Tour** (orange visor): the dates roll across the visor; TICKETS opens the full list.
- **Phones.** The deck's mobile layout: wordmark, WLZR.TV, the icons two by two, the green bar. Heads land in
  the middle and drag with a finger.

The live screens are real HTML laid onto each device's screen with a projective transform. The renders leave
the screen as a transparent hole, so the bezel frames the HTML and nothing has to be traced by hand.

## What's placeholder, and how the real thing drops in

Everything editable is in `src/data.ts`.

| Thing | Now | To swap |
| --- | --- | --- |
| Heads | Blender renders of a CC BY 3.0 scan (Lee Perry-Smith, Infinite-Realities) wearing devices modelled for this site (`tools/heads.py`), tinted in the deck's colours (`tools/post.py`) | The deck's own head art. Export each as a cut-out PNG with the screen area transparent, mark the screen's four corners in `public/heads/heads.json` (fractions of the picture, TL TR BR BL). |
| Music | A synthesized placeholder groove per track (`src/radio.ts`) | Set `audio` on each track in `TRACKS`. The spectrum, beat and speakers follow the file. |
| Videos | Mixkit stock loops (free licence) | `loop` for the visor clip, `youtube` for the full video. |
| Merch | Flat-lay art drawn in SVG | `image` and `url` on each product (Shopify product links). |
| Tour | The four dates from the deck | `tickets` links. |
| Logos | SHOCK THE SYSTEM and the wordmark set in Archivo | The record's lockup as SVG. |

To re-render the stand-in heads: `pip install bpy pillow`, then for each of `video music merch tour`:
`python tools/heads.py -- <LeePerrySmith.glb> <out> <variant> 64` and `python tools/post.py <out> public/heads`.

## Directions worth showing them

1. **Their faces, screaming.** The deck's heads have expressions (tongue out, screaming); with the real art
   the heads can swap to an open-mouth frame on the kick.
2. **Two-tab broadcast.** Everyone on the site hears the same station at the same moment (a shared clock),
   with a live listener count on the ON AIR light.
3. **Drop the record.** On release day the boot sequence changes to "SIGNAL LOCKED: OUT NOW" and the radio
   opens itself.
