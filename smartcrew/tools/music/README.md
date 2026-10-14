# The ride's music

One Day's ride ("Enjoy the ride", desktop) plays one music file, `public/audio/ride.mp3`, on the
film's own clock (`src/site/player/soundtrack.ts`, wired up in `src/site/day/Day.tsx`). The music
plays only while the ride plays:

- It starts where the ride is and stops with a short fade when the ride pauses. That covers the
  visitor pausing, the popup opening, a scroll up out of the ride, Skip, and the tab going to the
  background.
- It dips out and back in with a chapter jump.
- It rings out at the end.

Browsers only allow sound after a tap, click or key press, and scrolling doesn't count. So a
visitor who only scrolled sees "Turn on sound" over the control bar; anyone who clicked something
earlier just hears it. The bar has a sound on / off button, and the choice is remembered
(`localStorage` key `sc-sound`). There is no music with reduced motion or on phones.

## The marks (the file must line up with these)

| time    | the ride                                              | the music                        |
|---------|-------------------------------------------------------|----------------------------------|
| 0:00    | "Enjoy the ride"                                      | intro (no full beat yet)         |
| 0:02.50 | 6:42 AM: the first shot has settled                   | **drop**                         |
| 0:33.53 | 5 PM is coming                                        | build-up (no 808)                |
| 0:35.25 | the profit card takes over the screen                 | **the big drop**                 |
| 0:47.32 | nightfall (Friday)                                    | the drums go dark                |
| 0:55.50 | "That's SmartCrew."                                   | **the final hit**, then ring out |
| 0:58.85 | the end of the ride                                   | silence                          |

The file is 58.85 s long. Grid: 139.24 BPM, so the bar lines fall on these marks.

## The placeholder (now)

`./beat.js` is a hard trap beat in F minor, built from synthesis alone, so there is nothing to
license. `node tools/music/render.mjs` renders it in a headless browser and writes the MP3 (about
1.2 MB, peak −1 dB, about −14 LUFS).

## Swapping in a licensed track

What to get:

- A dark, hard trap instrumental, no vocals, 130–150 BPM, at least 60 s.
- It needs an intro, a drop, a stripped-back part and a clean ending or final hit.
- It must be licensed for commercial and ad use (Epidemic Sound, Artlist, Musicbed, Soundstripe,
  or a BeatStars lease that covers ads).
- WAV or MP3 at 320 kbps, plus stems if available.

Cut it to the marks above with ffmpeg: pick the intro, the first drop, the build and the big drop
from the track, and join them with short crossfades. Write it to `public/audio/ride.mp3` at
58.85 s, peak −1 dB. Nothing in the code changes.
