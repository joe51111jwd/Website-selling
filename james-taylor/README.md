# James Taylor, Chef

Personal site for James Taylor, executive chef and partner at The Joyce (448 Española Way, Miami Beach),
formerly of Alinea, Roister and Bavette's in Chicago. The whole page is built around how he cooks:
Chicago style, under a broiler at about 900°.

Vite + React + motion + Lenis. Every dish on the page is modelled, lit and rendered in Blender
(`blender/`); the fire is live WebGL.

## Run

```
npm install
npm run dev
npm run build      # typecheck + production build into dist/
```

## What's on the page

| Section | File | What it does |
| --- | --- | --- |
| Preloader | `src/ui/Preloader.tsx` | The broiler preheats: a dial climbs from 72° to 900°F while the element glows white-hot, then the cover lifts. |
| Hero | `src/sections/Hero.tsx`, `src/ui/BroilerFire.tsx` | A ceiling of live WebGL fire under a steel hood (the nav sits on it); moving the pointer fans the flames. The five signatures wait on the pass below (one Blender render). |
| Creed | `src/sections/Creed.tsx` | His own line about his food; each word catches fire as it scrolls past. |
| Story | `src/sections/Rail.tsx` | His career as order tickets on a pass rail: TGI Fridays at 5, Le Cordon Bleu, Bavette's, Roister, Alinea, Miami, The Window, The Joyce. Scroll slides the rail; each ticket gets stamped FIRED. |
| Signatures | `src/sections/Menu.tsx`, `src/ui/Turntable.tsx` | Five dishes as Blender turntables: they idle round on the pass, drag (or arrow keys) to turn them. |
| Burgerability | `src/sections/Burgerability.tsx` | The Joyce Burger comes apart layer by layer as you scroll (a rendered film); labels ride the layers using positions exported from the Blender camera. |
| 900° | `src/sections/NineHundred.tsx` | The ribeye splits open to medium-rare while the copy walks through the broiler and the 45-minute rest; then hold a button to fire the broiler yourself. |
| Press, The Joyce, Book | `src/sections/*.tsx` | Critics' lines, the restaurant behind a green velvet curtain that parts on scroll, private events. |

All copy is in `src/content.ts`. Every quote is verbatim from the source named beside it, and the
sources are listed in the footer.

## The renders

Plain bpy, no add-ons, Cycles on CPU, Blender 4.5 LTS. Assets are CC0 from Poly Haven (see
`blender/CREDITS.md`); fetch them once with `python3 blender/assets.py`.

| File | What |
| --- | --- |
| `blender/kit.py` | Render settings, node helpers, lights, camera |
| `blender/studio.py` | The dark food-photography set: lights, boards, plates |
| `blender/steak.py` | Chicago Cut Ribeye with a frenched bone. A baked map holds the distance to the edge and the fat, so any cut face shows a true medium-rare gradient |
| `blender/burger.py` | Brioche, two 75:25 smash patties, melted American cheese, Joyce sauce, as separate layers |
| `blender/latkes.py` | Latkes made of fried potato shreds draped over a body, a packed mound of Ossetra pearls, crème fraîche, chives |
| `blender/chicken.py` | Glazed chicken dropped into a bowl with rigid-body physics, dried chiles laid on top, sesame, scallion |
| `blender/pie.py` | A slice of sour orange pie with a piped chantilly rosette |
| `blender/turntable.py` | 48-frame turn of a dish, framed automatically |
| `blender/films.py` | The burger teardown and the ribeye split, plus per-frame label anchors |
| `blender/lineup.py` | All five on the pass, for the hero |
| `blender/look.py` | Quick look-dev still of one dish (`--dish burger --explode 1`, `--dish ribeye --split`) |

Render everything (each job resumes where it stopped), then pack it for the site:

```
scripts/render_queue.sh burger-film burger latkes chicken pie ribeye steak-film lineup
scripts/pack_all.sh   # WebP frames + manifests into public/seq/, lineup.webp and og.jpg into public/
```

On a 4-core CPU a turntable frame takes about 10 s and a film frame 15 to 25 s.
