# WLZR.TV: brief vs. live site (checked Nov 19 2026, 3:05 PM ET)

Live: https://wlzr-tv.vercel.app (https://sons-wlzr.vercel.app serves byte-identical HTML/build)
Source: https://github.com/joe51111jwd/Website-selling , folder `wlzr/`, branch `claude/sweet-cori-5scgax` (commit 81668c1a, Nov 10). Vercel project `wlzr-tv` (prj_1kUMlcIzJtbKsyfamouzSkDOokxl, team atwbusinessjames-8923s-projects, Vite). Not on `main`. Project root directory is `wlzr`. The Nov 19 12:49 AM ET ERROR deploy was an unrelated preview from branch `claude/susd-cover` (no `wlzr` folder there), not a WLZR break; production is still the Nov 10 build.
Screenshots of the live site: live_shots/ . Brief files: brief/ (see brief/README.txt).

## Sources of truth
- Vanessa, Nov 9: "Bring the Major Lazer pirate-radio site to life using the creative direction provided, with interactive players for music, videos, merch and tour dates."
- Ferzan, Nov 19: "You guys didn't follow the brief here at all. These are supposed to be winamp players."
- Deck: `MajorLazer_WLZR_Ver02_2026-10-27.pdf` (11 pages, images only; pages 1-7 desktop, 8-11 mobile).
- Supplied art: 4 player-head PSDs (Diplo = video, America = music, Walshy = merch, Ape = tour), homepage mockup .ai, Major Lazer + globe logos, SHOCK THE SYSTEM lockups.

Legend: MET / PARTIAL / MISSING / WRONG

## A. The players (the core complaint)
| # | Brief requirement (quote / deck page) | Live site | Status |
|---|---|---|---|
| A1 | Players are the supplied "MediaPlayer" head art: Diplo-MediaPlayer.psd, America-MediaPlayer.psd, Walshy-MediaPlayer.psd, Ape_MediaPLayer.psd (deck p2-p7) | Uses generic bald mannequin heads rendered in Blender from a CC BY scan (Lee Perry-Smith), wearing devices we invented (tools/heads.py). None of the band members' faces, none of the supplied PSDs. PITCH.md itself lists "the deck's own head art" as a placeholder to swap. | WRONG (biggest gap) |
| A2 | "These are supposed to be winamp players": each head is a skinned media player (Winamp skin feel: chrome bezel, LCD readout, transport, spectrum, side menu buttons) | Devices are flat, plain shapes; screens are tiny HTML overlays. Reads as "3D heads with VR goggles", not Winamp skins. | WRONG |
| A3 | VIDEO player (p2, p3, p10, p11): blue Diplo head, tongue out, wraparound visor screen playing video, left menu FILES / VIEW / OPTIONS, right orange D-pad with play button, orange progress bar "00:52 / 03:21" | Blue mannequin head, closed eyes, flat visor. FILES / VIEW / OPTIONS exist; D-pad missing; footage is Mixkit stock. | PARTIAL / WRONG art |
| A4 | Classic "Video Player" window opens from the video head (p3): Win98/Winamp-style title bar with _ [] X, big screen, seek bar with "2:36 ... 43:04", transport buttons (first, rew, play/pause, ff, last, playlist), volume slider | Exists (src/apps.ts openVideo, win.ts). Closest-to-brief piece on the site. Title uses an em dash ("Video Player — ..."). | MET (verify styling vs p3) |
| A5 | MUSIC player (p4, p5, p7, p9): green America head screaming, speaker-cone helmet, round red LCD dome at top showing "00:27 / Rotate / Shock The System / Major Lazer", red spectrum bars, transport (repeat, prev, play, next, shuffle), min/close buttons on top | Green mannequin head (eyes closed, mouth shut) with two green ear cups; small round LCD with clock/title/spectrum/transport. | PARTIAL / WRONG art |
| A6 | Music player side buttons on left cheek panel: PLAYLIST, EQUALIZER, VISUALS, OPTIONS (Winamp's PL / EQ / vis) (p4) | Not present in code (grep finds no playlist/equalizer/visuals on music head). No playlist window, no EQ window, no visualizer mode. | MISSING |
| A7 | Music right cheek panel text "SOUND BEYOND THE SELF" + globe icon (p4) | Not present. | MISSING |
| A8 | Real music: the record "Shock The System", track "Rotate" (p4) | Track list placeholder (Rotate, Shock The System, Pirate Signal, Sound Boy); audio is a synthesized placeholder loop (src/radio.ts), no real masters. | PARTIAL (needs client audio) |
| A9 | MERCH player (p5, p6, p7): red Walshy head, spiky bleached hair, mustache, red LED goggles; left lens = MERCH menu (T-Shirts, Hats, Sweats, Accessories) with arrows, right lens = product carousel with < > and dots, cart icon, "EA7"/price tag | Red mannequin head with flat goggles; left-lens menu and right-lens carousel exist. | PARTIAL / WRONG art |
| A10 | Merch product window (p6): classic window with blue gradient title bar, _ [] X, scrollbar, large product photo (camo long sleeve with red anarchy globe) | Product window exists with sizes + Add to cart; product art is SVG flat-lay drawings, not the deck's camo shirt photo. | PARTIAL |
| A11 | TOUR player (p7): orange Ape head, sunglasses, chrome orange visor screen reading "TOUR" with list: Dec. 30, 2026 Kabupaten Badung, Indonesia, Finns Beach Club; Dec. 31, 2026 Melbourne, Australia, New Years at the Bowl 2026; Jan. 1, 2027 Sydney, Australia, Field Day 2027; Feb. 27, 2027 Christchurch, New Zealand, Electric Avenue Music Festival 2027; TICKETS button; transport row | Orange mannequin head with flat visor showing the four dates and TICKETS. Dates correct (venue names drop "2026"/"2027" suffix on two lines). Ticket links are "#". | PARTIAL / WRONG art |
| A12 | Players stack/overlap freely on the desktop, partly over the WLZR.TV wordmark, several open at once (p4, p5, p7) | Yes: open one at a time or all (globe / A key), draggable, overlap. | MET |
| A13 | Heads are cut-out photos with expressions (tongue out, screaming, smirk) in duotone tints (blue, green, red, orange) | Expressionless mannequin, eyes closed. | WRONG |

## B. Desktop layout / creative direction (deck p1, mockup .ai)
| # | Requirement | Live | Status |
|---|---|---|---|
| B1 | White page | White | MET |
| B2 | "MAJOR LAZER" top center, blue italic heavy wordmark with blue offset/extrude shadow, from LOGOS/MAJOR_LAZER+GLOBES (p1) | Present, set in Archivo (font recreation), not the supplied logo file. Close visually. | PARTIAL (use supplied vector) |
| B3 | Big red pixel "WLZR.TV" with the hand-drawn red lightning bolt / feather slashing through the "L/Z" (p1) | Red pixel wordmark present but the slash is a short blocky red bolt, not the deck's long jagged lightning shape. Live version adds blue glitch ghosting and row-slip. | PARTIAL / WRONG detail |
| B4 | Four pixel icons stacked on the right: Tour (31 calendar), Videos (film frame with play), Music (green speaker with sound waves), Merch (orange/yellow folder), pixel font labels (p1) | Present, redrawn; Tour icon has an extra pencil mark; colours slightly off vs mockup. | MET / minor |
| B5 | Green full-width footer bar with the SHOCK THE SYSTEM lockup (distressed "SHOCK" with globe O, "THE SYSTEM" below) from LOGOS/SHOCK_NewType_FinalLockup | Green bar present but "SHOCK" is typeset in Archivo with a clean globe; not the supplied distressed lockup. | WRONG (use supplied lockup) |
| B6 | Nothing else on the page (deck is minimal) | Live adds: "ON AIR" box, "WLZR.TV 103.3 3:02 PM" clock top-left, black scrolling news ticker above the green bar ("NOW BROADCASTING ON WLZR.TV ... PIRATE SIGNAL 103.3 ... DON'T TOUCH THAT DIAL"), hint text "Click an icon. Drag the heads around.", green-on-black boot "SCANNING 103.3 MHz" screen. | EXTRA (not in brief; confirm or cut) |
| B7 | Globe icon top right (mobile p8; distressed globe from logo file) | Clean globe icon top right (opens all heads). | PARTIAL (use supplied globe) |
| B8 | "Pirate radio" direction: conveyed through the deck look (desktop OS, media players), not through added radio chrome | We invented pirate-radio copy and UI (ticker, frequency, ON AIR, boot). | EXTRA / interpretive |

## C. Mobile (deck p8-p11)
| # | Requirement | Live | Status |
|---|---|---|---|
| C1 | Globe top right, MAJOR LAZER, WLZR.TV with bolt, icons 2x2 (Tour, Videos / Music, Merch), green SHOCK THE SYSTEM bar (p8) | Present in that order. | MET (same art gaps as B2/B3/B5) |
| C2 | Music head opens centered over the wordmark (p9) | Heads land in middle. | MET (wrong art) |
| C3 | Video goes full-screen in a "Video Player" titled window with the music player docked at the bottom, cropped green head with red LCD (p10) | Not implemented that way (no full-screen mobile video with docked music player). | MISSING |
| C4 | Multiple heads stack on mobile (green top, blue bottom) (p11) | Possible by opening several. | MET (wrong art) |

## D. Copy and content
| # | Requirement | Live | Status |
|---|---|---|---|
| D1 | Record name "Shock The System", artist Major Lazer | Yes | MET |
| D2 | Real videos (deck shows the Rotate live performance footage) | Mixkit stock clips | MISSING (need client footage or YouTube ids) |
| D3 | Real merch photos (camo long sleeve with red anarchy globe) | SVG drawings, invented product names/prices ($65, $40, $90, $35) | MISSING / invented |
| D4 | Tour ticket links | "#" | MISSING (need links) |
| D5 | Page title / meta | "WLZR.TV — Major Lazer, Shock The System" (em dash). Meta robots noindex. | Fix dash; noindex fine for draft |
| D6 | Invented copy not in brief: ticker lines, "Pirate Signal Hoodie", "Lazer Dad Hat", "Live From The Boat", "Tour Diary 01", track names "Pirate Signal", "Sound Boy" | Present | REMOVE or replace with client copy |

## E. Supplied assets usage
| Asset | Used on live site? |
|---|---|
| Diplo-MediaPlayer.psd (video head, 3000x2742) | NO |
| America-MediaPlayer.psd (music head, 3000x2742) | NO |
| Walshy-MediaPlayer.psd (merch head, 1166x1349) | NO |
| Ape_MediaPLayer.psd (tour head, 993x1584) | NO |
| WLZR_Homepage_Mockups.ai (desktop + mobile mock, window and icon assets) | NO (recreated by hand) |
| MAJOR_LAZER+GLOBES_Updated (wordmark, distressed globes) | NO (font recreation) |
| SHOCK_NewType_FinalLockup (distressed SHOCK lockups) | NO (font recreation) |

Note on the PSDs: each is a flattened 2-layer file (cut-out head + Hue/Saturation adjustment) with the screen content baked in (video still, LCD text, merch shirt). To make them live players, mask the screen areas and lay live HTML/video into them (the existing quad/projective system in src/quad.ts + public/heads/heads.json already supports this), and hotspot the baked-in buttons (D-pad, transport, PLAYLIST/EQUALIZER/VISUALS/OPTIONS, merch menu, TICKETS).

## Fix priority
1. Replace all four mannequin heads with the supplied PSD heads (Diplo video, America music, Walshy merch, Ape tour), screens masked and made live, every visible button wired up. This is the "winamp players" complaint.
2. Make them behave like Winamp: music head gets PLAYLIST, EQUALIZER (working EQ sliders window), VISUALS (visualizer), OPTIONS; LCD with time/title/spectrum; classic skinned pop-out windows matching deck p3/p6.
3. Use the supplied logo files: MAJOR LAZER wordmark, the WLZR.TV lightning bolt shape, SHOCK THE SYSTEM distressed lockup, distressed globe.
4. Match deck layout exactly; cut or confirm extras (ticker, ON AIR/clock, boot screen, hint text).
5. Mobile p10: full-screen Video Player window with docked music head.
6. Remove invented copy/products; mark real-content slots (audio, video, merch photos, ticket links) for the client.
7. Remove em dashes from title strings. (Nov 19 failed deploy is an unrelated branch preview; ignore.)
