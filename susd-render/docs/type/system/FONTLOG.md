# Fonts shipped with the Waterline: where they come from and what the licence allows

All four families are under the **SIL Open Font License 1.1** (full text: `OFL-1.1.txt` in this
folder). OFL allows commercial use, self-hosting as webfonts, embedding in renders and images,
and subsetting. It forbids selling the font files on their own, and a modified font may not use a
Reserved Font Name. Keep this file and `OFL-1.1.txt` next to the font files in the site repo.

| File(s) | Family | Copyright (from the font's name table) | Version | Source |
|---|---|---|---|---|
| `Plimsoll-Heavy.otf`, `Plimsoll-Heavy.woff2`, `web/Plimsoll-Heavy.woff2` | Plimsoll Heavy | Copyright 2026 the Scaling Up-Side-Down homepage project. | 1.000 | Ours. Drawn in code: `tools/type/build_plimsoll.py`. OFL, no Reserved Font Name. |
| `Ortica-AngularBold.otf/.woff2`, `web/Ortica-AngularBold-latin.woff2` | Ortica Angular Bold | © 2021, Benedetta Bovani & Colllettivo | 2.000 | Collletttivo (Italy), https://www.collletttivo.it |
| `Ortica-LinearBold.otf/.woff2`, `web/Ortica-LinearBold-latin.woff2` | Ortica Linear Bold | © 2021, Benedetta Bovani & Colllettivo | 2.000 | same |
| `Ortica-LinearRegular.otf/.woff2`, `web/Ortica-LinearRegular-latin.woff2` | Ortica Linear Regular | © 2021, Benedetta Bovani & Colllettivo | 2.000 | same |
| `B612-Regular.ttf/.woff2`, `web/B612-Regular-latin.woff2` | B612 Regular | Copyright 2012 The B612 Project Authors (https://github.com/polarsys/b612) | 1.008 | Airbus, Intactile Design, ENAC (Polarsys B612) |
| `B612-Bold.ttf/.woff2`, `web/B612-Bold-latin.woff2` | B612 Bold | same | 1.008 | same |

`web/*-latin.woff2` are subsets (pyftsubset, kept: Basic Latin, Latin-1, general punctuation,
arrows, a few math signs, `kern liga calt case tnum lnum pnum`) made for the site. A subset is a
Modified Version under the OFL, which is allowed; a Modified Version may not use a Reserved Font
Name. Neither family declares one (checked: the copyright lines above, the name-table licence
strings, and B612's own `OFL.txt` copyright header name no Reserved Font Name), so the subsets may
keep their names. If a later release of either font adds a Reserved Font Name, rename the subsets.

`*.kern.json` are the fonts' pair-kerning tables exported for Blender (`tools/type/blender_kern.py`);
they are data derived from the fonts, under the same licence.
