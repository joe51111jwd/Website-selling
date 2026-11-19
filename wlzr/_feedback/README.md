# WLZR feedback assets (&SONS, Nov 19 2026)

Everything needed to apply Vanessa's Nov 19 feedback to the WLZR site (`wlzr/`). Nothing in the site code was changed on this branch. Original Drive files are kept under `originals/`; everything else is a web conversion made from them.

## Source

- From: Vanessa Veroes Viana <vanessa@sons.llc>, to James Camarota and Daniel Kim, cc Alexander Ferzan <ferzan@sons.llc>
- Sent: Thu Nov 19 2026, 5:00 PM ET. Subject: "Re: &SONS Website Projects + Priorities"
- Drive links in the email (all public, all downloaded Nov 19 2026 ~5:40 PM ET):
  - WLZR references and assets folder: https://drive.google.com/drive/folders/1M7iNFCeaZCug_eJgZPjc9sgcO5tmyrd2 (contains `ASSETS/`, `LOGOS/`, the deck PDF and a `.DS_Store`, which was skipped)
  - Crew photo player designs: https://drive.google.com/drive/folders/1lSx3JqyT5Kv4JL1LcG5r9WUM_FuVLMwu (same 6 files as `ASSETS/`)
  - Logo files: https://drive.google.com/drive/folders/1UnQhdLKkFxVYFxeSQnbeh2lVSvWLm1nd (same 4 files as `LOGOS/`)
  - Original deck: https://drive.google.com/file/d/1kLBnsKiPnzF2FejGiXK_8HBJZZmcn_h8/view (`MajorLazer_WLZR_Ver02_2026-10-27.pdf`)
- Important: all files are byte-identical (md5) to the files already in `wlzr/_brief/`. There are no new files in the new folders. The ones not in `_brief/` before were the two `.ai` logo sources, which are now in `originals/LOGOS/`.

## Vanessa's feedback (verbatim)

The exact email body is also in `vanessa_feedback_2026-11-19.txt`.

```text
Hey James and Daniel,

Sorry for the delay! I wanted to gather all the feedback before sending it
over. Thanks for already getting started on the corrections. Here are our
notes for WLZR:

*Branding*

   - USE previously provided assets for main logos (“MAJOR LAZER”, “WLZR.TV”,
   GLOBE)
   - Please use the new Major Lazer lockup and include the Shock The System
   logo from the logo files
   <https://drive.google.com/drive/folders/1UnQhdLKkFxVYFxeSQnbeh2lVSvWLm1nd>,
   with the branding placements shown in the original deck
   <https://drive.google.com/file/d/1kLBnsKiPnzF2FejGiXK_8HBJZZmcn_h8/view>.

*Head designs*

   - The WinAmp-style heads should match the mockups provided. Each one is
   a band member. We may need to adapt the shape of the “media” area to
   accommodate certain specific buttons, information, and display size for
   each section. If you can do this while keeping the overall aesthetic,
   great. (If not, we can figure out exactly what we need to display and
   figure out who is gonna customize them.)
   - We understand the current heads may be placeholders for the demo. The
   crew photo-based player designs
   <https://drive.google.com/drive/folders/1lSx3JqyT5Kv4JL1LcG5r9WUM_FuVLMwu>
   are linked in that drive shared earlier. The head players need to be
   scalable and interactive, with the controls working on both mobile and
   desktop.

*Player functionality*

   - *The WinAmp heads should function as more than just a button to open a
   separate content window.* Especially on desktop, the “Player” and
   “window” should work in tandem to create a cool user experience. Think of
   the WinAmp player as being the control center for each section.
      - *Audio:* The WinAmp player could include the track list to choose
      from, and maybe even the play/stop music controls themselves.
      - *Video:* Video List; the video itself opens in the separate media
      window. (there could be an archive of older videos as well at some point)
      - *Merch:* Maybe the WinAmp player has the categories listed and
      smaller product thumbnails cycling through. The media window can
show full
      pics/details or go into a Pleasure portal. etc
      - *Tour:* WinAmp player has the list of dates. Directs to a place to
      buy tickets and/or add-on merch. etc

*Desktop and mobile*

   - On mobile, this concept can adapt so when a section is selected, the
   “control” section of the WinAmp player stays on screen, but the face can be
   cropped to maximize fullscreen space for photos, videos, content, etc.
   - Use pages 1–7 of the deck for desktop and 8–11 for mobile as the
   visual references.
   - The main thing is taking these parts and having them work well on both
   desktop and mobile so that it is both unique but allows for all of the
   content to be displayed seamlessly.

*Creative details*

   - Experimenting in areas like the desktop icons you used looks cool.
   Anything like that that adds interesting details and a fun user experience
   is encouraged.

Sharing here
<https://drive.google.com/drive/folders/1M7iNFCeaZCug_eJgZPjc9sgcO5tmyrd2>
all references and assets for WLZR for a quicker grab.

Please let us know if anything needs clarification or isn’t feasible before
moving further. Could you also confirm timing for the next round against
our end-of-November target?
Thanks!

V
```

## Inventory

### What was asked for, and what we have

| Item | Status | Where |
|---|---|---|
| New Major Lazer lockup | FOUND. Best match is the stacked "MAJOR / LAZER" lockup with the globe in the A (page 2 of MAJOR_LAZER+GLOBES_Updated). The MAJOR LAZER + SHOCK lockups (SHOCK pdf pages 3 to 9) are the other possibility. Ask &SONS which one they mean if it matters. | `logos/elements/majorlazer_lockup_stacked_globe_{black,white}.png`, `logos/pages/globes_p2.svg` |
| Shock The System logo | FOUND, many versions | `logos/elements/shock_p-*`, `logos/pages/shock_p*.svg/png` |
| MAJOR LAZER wordmark | FOUND (plain + italic shadow) | `logos/elements/majorlazer_wordmark_plain_*`, `majorlazer_wordmark_italic_*`; blue version as used in the deck: `mockup_extracts/majorlazer_wordmark_blue_mockup.png` |
| WLZR.TV logo | PARTIAL. No standalone logo file in any folder. It exists only inside `WLZR_Homepage_Mockups.ai`. Extracted from a 300 dpi render with a color key | `mockup_extracts/wlzr_tv_logo_red.png`, `wlzr_tv_logo_white.png` (raster, 4396px wide; not a true vector) |
| Globe logos | FOUND, 3 versions (labels in the .ai: Distressed Globe, Distressed Globe minus drips, Clean Globe) | `logos/elements/globe_1_left_*`, `globe_2_middle_*`, `globe_3_right_drips_*`, `logos/pages/globes_p3.svg` |
| Crew photo head player designs (one per band member) | FOUND, 4 heads | `heads/` (see below), originals in `originals/ASSETS/*.psd` |
| Desktop icons (Tour / Videos / Music / Merch) and footer bar | FOUND in the mockup | `mockup_extracts/icon_*.png`, `footer_shock_bar.png` |
| Deck (desktop pages 1 to 7, mobile pages 8 to 11) | FOUND | `deck_pages/deck_p-01..11.png` (150 dpi), `originals/MajorLazer_WLZR_Ver02_2026-10-27.pdf` |
| Homepage mockups (desktop + mobile with UI window parts) | FOUND | `mockup_pages/mockup_p-1.png` (desktop), `mockup_p-2.png` (mobile + window/icon parts), `originals/ASSETS/Copy of WLZR_Homepage_Mockups.ai` |
| Audio tracks / track list | MISSING | none in any folder |
| Videos / video list | MISSING | none in any folder |
| Merch photos / product list / categories | MISSING | none in any folder |
| Tour dates / ticket links | MISSING | none in any folder |
| "Pleasure portal" link (merch) | MISSING | not given |

### Head players (one per band member)

Section assignments come from the deck and the earlier `_brief/assets/README.txt`. Each PSD is a flattened single image layer, so there are no separate control layers. Controls, track lists, etc. need to be built in code over the image. Transparent PNGs are trimmed to the art.

| Member file | Look | Section | Files |
|---|---|---|---|
| Diplo-MediaPlayer.psd (3000x2742) | blue visor | VIDEO | `heads/diplo_full.png`, `diplo_1600.{png,webp}`, `diplo_800.{png,webp}` |
| America-MediaPlayer.psd (3000x2742) | green speaker helmet | MUSIC / audio | `heads/america_*` |
| Walshy-MediaPlayer.psd (1166x1349) | red LED goggles | MERCH | `heads/walshy_*` |
| Ape_MediaPLayer.psd (993x1584) | orange visor | TOUR | `heads/ape_*` |

Use the `.webp` files on the site (140 to 525 KB). The `_full.png` files are the trimmed full-res masters.

### Logo files

- `logos/pages/`: every page of both logo PDFs as transparent PNG (200 dpi) plus a vector SVG for each page (SVGs are true vectors, no embedded images). globes p1 = wordmarks, p2 = stacked lockup, p3 = globes. shock p1 = same wordmarks title page, p2 = repeating "THE SYSTEM / MAJOR LAZER" type pattern, p3 to p9 = MAJOR LAZER + SHOCK THE SYSTEM lockup variants (two per page), p10 = 3 SHOCK wordmark finishes, p11 = 9 alternate SHOCK type explorations.
- `logos/elements/`: each logo cut out of those pages as its own trimmed transparent PNG, in `_black` (original) and `_white` (inverted, for dark backgrounds) versions.
- Contact sheets: `logos/_contact_sheet_pages.png`, `logos/_contact_sheet_elements.png`, `deck_pages/_contact_sheet.png`.

### Skipped

- `.DS_Store` from the Drive folder (Mac junk).
- Nothing was over GitHub's 100 MB limit (the biggest file is `originals/ASSETS/Copy of America-MediaPlayer.psd`, 25.7 MB). No video files exist, so the video size cap did not come into play.

## Still missing (must come from &SONS)

1. Audio: track files (or streaming embeds/links), track titles, order. Needed for the MUSIC head's track list and play/stop controls.
2. Video: the list of videos (YouTube/Vimeo links or files) plus any archive of older videos.
3. Merch: product photos, categories, prices, and the store / "Pleasure portal" URL.
4. Tour: dates, cities, venues, ticket links, and any add-on merch links.
5. A standalone WLZR.TV logo file (vector), if they want it sharper than the extract.
6. Which file is "the new Major Lazer lockup" (stacked globe lockup vs. the MAJOR LAZER + SHOCK lockups), if the deck placement doesn't settle it.

Until these arrive the site should use clearly marked placeholder content in each head's control panel.

## Full file list

| File | Size |
|---|---|
| `deck_pages/_contact_sheet.png` | 0.75 MB |
| `deck_pages/deck_p-01.png` | 0.19 MB |
| `deck_pages/deck_p-02.png` | 0.75 MB |
| `deck_pages/deck_p-03.png` | 1.18 MB |
| `deck_pages/deck_p-04.png` | 1.18 MB |
| `deck_pages/deck_p-05.png` | 1.69 MB |
| `deck_pages/deck_p-06.png` | 0.93 MB |
| `deck_pages/deck_p-07.png` | 1.63 MB |
| `deck_pages/deck_p-08.png` | 0.25 MB |
| `deck_pages/deck_p-09.png` | 0.47 MB |
| `deck_pages/deck_p-10.png` | 0.72 MB |
| `deck_pages/deck_p-11.png` | 0.62 MB |
| `heads/america_1600.png` | 2.30 MB |
| `heads/america_1600.webp` | 0.40 MB |
| `heads/america_800.png` | 0.69 MB |
| `heads/america_800.webp` | 0.13 MB |
| `heads/america_full.png` | 6.27 MB |
| `heads/ape_1600.png` | 2.17 MB |
| `heads/ape_1600.webp` | 0.35 MB |
| `heads/ape_800.png` | 1.68 MB |
| `heads/ape_800.webp` | 0.29 MB |
| `heads/ape_full.png` | 2.17 MB |
| `heads/diplo_1600.png` | 3.14 MB |
| `heads/diplo_1600.webp` | 0.50 MB |
| `heads/diplo_800.png` | 0.94 MB |
| `heads/diplo_800.webp` | 0.18 MB |
| `heads/diplo_full.png` | 5.51 MB |
| `heads/walshy_1600.png` | 1.59 MB |
| `heads/walshy_1600.webp` | 0.26 MB |
| `heads/walshy_800.png` | 1.18 MB |
| `heads/walshy_800.webp` | 0.20 MB |
| `heads/walshy_full.png` | 1.59 MB |
| `logos/_contact_sheet_elements.png` | 1.01 MB |
| `logos/_contact_sheet_pages.png` | 0.50 MB |
| `logos/elements/globe_1_left_black.png` | 0.05 MB |
| `logos/elements/globe_1_left_white.png` | 0.06 MB |
| `logos/elements/globe_2_middle_black.png` | 0.07 MB |
| `logos/elements/globe_2_middle_white.png` | 0.09 MB |
| `logos/elements/globe_3_right_drips_black.png` | 0.08 MB |
| `logos/elements/globe_3_right_drips_white.png` | 0.09 MB |
| `logos/elements/majorlazer_lockup_stacked_globe_black.png` | 0.14 MB |
| `logos/elements/majorlazer_lockup_stacked_globe_white.png` | 0.15 MB |
| `logos/elements/majorlazer_wordmark_italic_black.png` | 0.07 MB |
| `logos/elements/majorlazer_wordmark_italic_white.png` | 0.08 MB |
| `logos/elements/majorlazer_wordmark_plain_black.png` | 0.06 MB |
| `logos/elements/majorlazer_wordmark_plain_white.png` | 0.07 MB |
| `logos/elements/shock_p-02_1_black.png` | 0.73 MB |
| `logos/elements/shock_p-02_1_white.png` | 0.79 MB |
| `logos/elements/shock_p-03_1_black.png` | 0.13 MB |
| `logos/elements/shock_p-03_1_white.png` | 0.14 MB |
| `logos/elements/shock_p-03_2_black.png` | 0.13 MB |
| `logos/elements/shock_p-03_2_white.png` | 0.14 MB |
| `logos/elements/shock_p-04_1_black.png` | 0.09 MB |
| `logos/elements/shock_p-04_1_white.png` | 0.10 MB |
| `logos/elements/shock_p-04_2_black.png` | 0.09 MB |
| `logos/elements/shock_p-04_2_white.png` | 0.09 MB |
| `logos/elements/shock_p-05_1_black.png` | 0.12 MB |
| `logos/elements/shock_p-05_1_white.png` | 0.13 MB |
| `logos/elements/shock_p-06_1_black.png` | 0.14 MB |
| `logos/elements/shock_p-06_1_white.png` | 0.15 MB |
| `logos/elements/shock_p-06_2_black.png` | 0.14 MB |
| `logos/elements/shock_p-06_2_white.png` | 0.15 MB |
| `logos/elements/shock_p-07_1_black.png` | 0.09 MB |
| `logos/elements/shock_p-07_1_white.png` | 0.10 MB |
| `logos/elements/shock_p-07_2_black.png` | 0.09 MB |
| `logos/elements/shock_p-07_2_white.png` | 0.10 MB |
| `logos/elements/shock_p-08_1_black.png` | 0.12 MB |
| `logos/elements/shock_p-08_1_white.png` | 0.14 MB |
| `logos/elements/shock_p-08_2_black.png` | 0.12 MB |
| `logos/elements/shock_p-08_2_white.png` | 0.14 MB |
| `logos/elements/shock_p-09_1_black.png` | 0.08 MB |
| `logos/elements/shock_p-09_1_white.png` | 0.09 MB |
| `logos/elements/shock_p-09_2_black.png` | 0.08 MB |
| `logos/elements/shock_p-09_2_white.png` | 0.09 MB |
| `logos/elements/shock_p-10_1_black.png` | 0.07 MB |
| `logos/elements/shock_p-10_1_white.png` | 0.08 MB |
| `logos/elements/shock_p-10_3_black.png` | 0.07 MB |
| `logos/elements/shock_p-10_3_white.png` | 0.08 MB |
| `logos/elements/shock_p-10_5_black.png` | 0.06 MB |
| `logos/elements/shock_p-10_5_white.png` | 0.07 MB |
| `logos/elements/shock_p-11_1_black.png` | 0.03 MB |
| `logos/elements/shock_p-11_1_white.png` | 0.04 MB |
| `logos/elements/shock_p-11_2_black.png` | 0.04 MB |
| `logos/elements/shock_p-11_2_white.png` | 0.04 MB |
| `logos/elements/shock_p-11_3_black.png` | 0.03 MB |
| `logos/elements/shock_p-11_3_white.png` | 0.04 MB |
| `logos/elements/shock_p-11_4_black.png` | 0.04 MB |
| `logos/elements/shock_p-11_4_white.png` | 0.05 MB |
| `logos/elements/shock_p-11_5_black.png` | 0.04 MB |
| `logos/elements/shock_p-11_5_white.png` | 0.05 MB |
| `logos/elements/shock_p-11_6_black.png` | 0.04 MB |
| `logos/elements/shock_p-11_6_white.png` | 0.05 MB |
| `logos/elements/shock_p-11_7_black.png` | 0.05 MB |
| `logos/elements/shock_p-11_7_white.png` | 0.05 MB |
| `logos/elements/shock_p-11_8_black.png` | 0.03 MB |
| `logos/elements/shock_p-11_8_white.png` | 0.04 MB |
| `logos/elements/shock_p-11_9_black.png` | 0.02 MB |
| `logos/elements/shock_p-11_9_white.png` | 0.02 MB |
| `logos/pages/globes_p-1.png` | 0.10 MB |
| `logos/pages/globes_p-2.png` | 0.13 MB |
| `logos/pages/globes_p-3.png` | 0.18 MB |
| `logos/pages/globes_p1.svg` | 0.01 MB |
| `logos/pages/globes_p2.svg` | 0.97 MB |
| `logos/pages/globes_p3.svg` | 1.27 MB |
| `logos/pages/shock_p-01.png` | 0.10 MB |
| `logos/pages/shock_p-02.png` | 0.54 MB |
| `logos/pages/shock_p-03.png` | 0.26 MB |
| `logos/pages/shock_p-04.png` | 0.17 MB |
| `logos/pages/shock_p-05.png` | 0.13 MB |
| `logos/pages/shock_p-06.png` | 0.27 MB |
| `logos/pages/shock_p-07.png` | 0.18 MB |
| `logos/pages/shock_p-08.png` | 0.24 MB |
| `logos/pages/shock_p-09.png` | 0.16 MB |
| `logos/pages/shock_p-10.png` | 0.19 MB |
| `logos/pages/shock_p-11.png` | 0.27 MB |
| `logos/pages/shock_p1.svg` | 0.01 MB |
| `logos/pages/shock_p10.svg` | 1.53 MB |
| `logos/pages/shock_p11.svg` | 7.07 MB |
| `logos/pages/shock_p2.svg` | 1.12 MB |
| `logos/pages/shock_p3.svg` | 2.01 MB |
| `logos/pages/shock_p4.svg` | 1.49 MB |
| `logos/pages/shock_p5.svg` | 1.00 MB |
| `logos/pages/shock_p6.svg` | 2.02 MB |
| `logos/pages/shock_p7.svg` | 1.49 MB |
| `logos/pages/shock_p8.svg` | 2.02 MB |
| `logos/pages/shock_p9.svg` | 1.49 MB |
| `mockup_extracts/footer_shock_bar.png` | 0.05 MB |
| `mockup_extracts/icon_merch.png` | 0.00 MB |
| `mockup_extracts/icon_music.png` | 0.01 MB |
| `mockup_extracts/icon_tour.png` | 0.01 MB |
| `mockup_extracts/icon_videos.png` | 0.01 MB |
| `mockup_extracts/majorlazer_wordmark_blue_mockup.png` | 0.12 MB |
| `mockup_extracts/wlzr_tv_logo_red.png` | 0.03 MB |
| `mockup_extracts/wlzr_tv_logo_white.png` | 0.03 MB |
| `mockup_pages/mockup_p-1.png` | 0.18 MB |
| `mockup_pages/mockup_p-2.png` | 0.27 MB |
| `originals/ASSETS/Copy of America-MediaPlayer.psd` | 25.66 MB |
| `originals/ASSETS/Copy of Ape_MediaPLayer.psd` | 7.04 MB |
| `originals/ASSETS/Copy of Diplo-MediaPlayer.psd` | 19.35 MB |
| `originals/ASSETS/Copy of MajorLazer_WLZR_Ver02.pdf` | 1.98 MB |
| `originals/ASSETS/Copy of WLZR_Homepage_Mockups.ai` | 3.87 MB |
| `originals/ASSETS/Copy of Walshy-MediaPlayer.psd` | 5.91 MB |
| `originals/LOGOS/Copy of MAJOR_LAZER+GLOBES_Updated.ai` | 3.10 MB |
| `originals/LOGOS/Copy of MAJOR_LAZER+GLOBES_Updated.pdf` | 3.09 MB |
| `originals/LOGOS/Copy of SHOCK_NewType_FinalLockup_Ver01.ai` | 25.53 MB |
| `originals/LOGOS/Copy of SHOCK_NewType_FinalLockup_Ver01.pdf` | 25.51 MB |
| `originals/MajorLazer_WLZR_Ver02_2026-10-27.pdf` | 1.98 MB |
| `vanessa_feedback_2026-11-19.txt` | 0.00 MB |
