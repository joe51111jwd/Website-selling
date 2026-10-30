#!/usr/bin/env python3
"""Build susd-options/preview/: one self-contained HTML per option plus an index page
that shows each option's first screen (desktop + phone) and links to it.

Usage: python3 tools/gallery.py the-title waterline count-yourself corrected-edition
"""
import base64, io, shutil, sys, html
from pathlib import Path
from PIL import Image

W = Path(__file__).resolve().parent.parent
OUT = W / 'preview'

INFO = {
    'the-title': ('The Title',
        'The book’s title is the whole picture: UP-SIDE-DOWN in the cover’s three colours, with Michael’s meaning under each word. It opens on the trap (“upside down”, no hyphens), the hyphens drop in, and holding UP shows what happens when a founder only pushes growth.'),
    'waterline': ('Waterline',
        '“Every hire compounds complexity before it compounds capacity.” is set huge, and live water rises toward it as you scroll, one hire at a time. Dry up to twelve, under past fifteen. Then Up, Side and Down drain it.'),
    'count-yourself': ('Count Yourself',
        'The headline is the book’s own first question, “How many people are on your team?”. You dial your number, the page answers in Michael’s words, and the whole screen turns green, ochre or oxblood. You know in one move if the book is for you.'),
    'corrected-edition': ('Corrected Edition',
        'A lit proof sheet on a dark desk. The founder’s own thought (“I should be further by now”) is struck through in red pencil and Michael’s correction is set huge in its place. At the end you strike out the whole inherited playbook and the Bootloader is underneath.'),
}


def shot(slug, name, width):
    p = W / slug / '.shots' / 'final' / f'{name}-01-first-3s.png'
    im = Image.open(p).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=84, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


def main(slugs):
    OUT.mkdir(exist_ok=True)
    rows = []
    for i, slug in enumerate(slugs, 1):
        src = W / slug / 'dist-single' / 'index.html'
        shutil.copyfile(src, OUT / f'{slug}.html')
        name, idea = INFO[slug]
        rows.append(f'''
  <article class="opt">
    <header>
      <span class="n">0{i}</span>
      <h2>{html.escape(name)}</h2>
      <p>{html.escape(idea)}</p>
      <a class="go" href="{slug}.html">Open {html.escape(name)} &rarr;</a>
    </header>
    <a class="shots" href="{slug}.html" aria-label="Open {html.escape(name)}">
      <img class="d" src="{shot(slug, 'desktop', 1440)}" alt="{html.escape(name)}, first screen on desktop" width="1440" height="900">
      <img class="p" src="{shot(slug, 'phone', 390)}" alt="{html.escape(name)}, first screen on phone" width="390" height="844">
    </a>
  </article>''')

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SUSD Homepage Options</title>
<style>
:root {{ --paper:#EDE6DA; --ink:#16130F; --mute:#5E574D; --up:#2B5A37; --side:#D49B2C; --down:#B2322A; --rule:rgb(22 19 15 / .14); }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --paper:#16130F; --ink:#EDE6DA; --mute:#A39A8C; --rule:rgb(237 230 218 / .14); }} }}
:root[data-theme="dark"] {{ --paper:#16130F; --ink:#EDE6DA; --mute:#A39A8C; --rule:rgb(237 230 218 / .14); }}
* {{ box-sizing:border-box; }}
html, body {{ margin:0; background:var(--paper); color:var(--ink); }}
body {{ font:17px/1.5 ui-sans-serif, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; }}
.wrap {{ max-width:1320px; margin:0 auto; padding:56px 40px 96px; }}
.top h1 {{ font:700 clamp(30px, 4.4vw, 56px)/1.04 Georgia, "Iowan Old Style", serif; letter-spacing:-.01em; margin:0 0 14px; }}
.top h1 b:nth-of-type(1) {{ color:var(--up); }} .top h1 b:nth-of-type(2) {{ color:var(--side); }} .top h1 b:nth-of-type(3) {{ color:var(--down); }}
.top p {{ color:var(--mute); max-width:760px; margin:0; }}
.opt {{ display:grid; grid-template-columns:minmax(260px, 1fr) 2.6fr; gap:40px; padding:56px 0; border-top:1px solid var(--rule); }}
.opt:first-of-type {{ margin-top:48px; }}
.n {{ font:600 13px/1 ui-monospace, Menlo, monospace; letter-spacing:.14em; color:var(--mute); }}
.opt h2 {{ font:700 32px/1.1 Georgia, "Iowan Old Style", serif; margin:10px 0 12px; }}
.opt p {{ margin:0 0 22px; color:var(--mute); }}
.go {{ display:inline-block; background:var(--ink); color:var(--paper); text-decoration:none; font-weight:600; padding:13px 22px; border-radius:999px; }}
.go:hover, .go:focus-visible {{ background:var(--down); color:#fff; }}
.shots {{ display:grid; grid-template-columns:1fr .289fr; gap:18px; align-items:start; }}
.shots img {{ display:block; height:auto; border-radius:8px; box-shadow:0 1px 2px rgb(0 0 0 / .12), 0 18px 48px -18px rgb(0 0 0 / .35); }}
.shots img {{ width:100%; }}
.shots .p {{ border-radius:14px; }}
.foot {{ margin-top:72px; color:var(--mute); font-size:14px; }}
@media (max-width: 860px) {{
  .wrap {{ padding:32px 16px 64px; }}
  .opt {{ grid-template-columns:1fr; gap:22px; padding:40px 0 56px; }}
  .shots {{ gap:10px; }}
}}
</style>
</head>
<body>
<main class="wrap">
  <section class="top">
    <h1>Scaling <b>Up</b>-<b>Side</b>-<b>Down</b>: {len(slugs)} homepage options</h1>
    <p>Four new directions, each built to answer one thing in five seconds: what the book says and who it is for. Every sentence on every page is Michael’s, word for word. Open one, scroll to the end, then try it on your phone.</p>
  </section>
{''.join(rows)}
  <p class="foot">Each option is a single self-contained file in this folder. No sign-ups are sent anywhere; the email field opens the live Appendix page.</p>
</main>
</body>
</html>
'''
    (OUT / 'index.html').write_text(page)
    print('wrote', OUT / 'index.html', round((OUT / 'index.html').stat().st_size / 1024), 'KB')


if __name__ == '__main__':
    main(sys.argv[1:])
