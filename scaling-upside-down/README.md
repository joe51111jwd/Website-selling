# Preview of the SUSD homepage options (this branch only)

This folder exists only on `claude/gifted-faraday-0j01ib` so the Vercel project
"scaling-up-side-down" (root directory `scaling-upside-down/`) builds a **preview**
of the four homepage options for James to look at. It does not touch the live site,
which deploys from `claude/beautiful-cori-a7cq5v`.

- `site/index.html`: the comparison page (first screens on desktop and phone).
- `site/<option>.html`: each option as one self-contained file.

The sources are in `susd-options/`; regenerate with
`python3 susd-options/tools/gallery.py the-title count-yourself waterline corrected-edition`
and copy `susd-options/preview/*.html` here.
