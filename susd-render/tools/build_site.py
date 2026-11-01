#!/usr/bin/env python3
"""Write site/index.html: the reviewed mock beats (mock/build_pages.py) joined into one scrolling page.

    python3 tools/build_site.py          # then serve site/ as plain static files

Every word comes from mock/build_pages.py (its PAGES table and its block functions), so the copy, the `// label`
marks and Michael's source refs are the ones that already passed copycheck and review. This script only adds:
  - the beat table (STORY below): where each frame is fully on screen (s, in vh of scroll), where each caption
    fades in and out, and the readout's n along the story; it is written into the page as JSON (#story-config)
    and onto each section as data-* attributes, so one clock (assets/js/stage.js) drives frames and words;
  - per-section CSS placing the HTML from each still's anchors (the same rules as build_pages.page());
  - the live instrument and legend (one element each, updated by the clock), and the finale as a real form.
No build step is needed to serve the site: this writes plain HTML next to hand-written CSS and JS.
See docs/08-SITE-BUILD.md.
"""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'mock'))
import build_pages as bp  # noqa: E402

SITE = os.path.join(ROOT, 'site')
pct = bp.pct
P = {pg['file']: pg for pg in bp.PAGES}

# ---- the beat table -------------------------------------------------------------------------------------------
# id, mock page (or a frame-only dict), fs = s where the frame is fully on screen (None: holds the previous frame),
# cut = no crossfade into this frame (camera change), cin/cout = caption window (fades FC vh at each end),
# phone = the portrait frame shown on a phone for this section (its own, or the neighbour that reads best).
FRAME_ONLY = {
    'up2': dict(still='d09_up2_K10', tags=['complexity', 'capacity', 'margin'], readout=None,
                alt='The water has come up again to the load line under the words, standing on their first new strake.'),
    'fin': dict(still='d13_finale_K16F', tags=[], readout=None,
                alt='The words stand high on the ship above calm clear water; the newest strake is stencilled with the Bootloader mark.'),
}
STORY_LEN = 1260          # vh of scroll in the story; the finale section scrolls in after it
F = 30                    # frame crossfade, vh
FC = 10                   # caption fade, vh
SECTIONS = [
    # id        page                 fs    cut  cin   cout  phone
    ('hero',    'index.html',        0,    0,   None, 45,   'p01_hero_K1'),
    ('hire',    'beat-hire.html',    80,   0,   55,   128,  'p01_hero_K1'),
    ('twelve',  'beat-twelve.html',  160,  0,   138,  205,  'p03_twelve_K2'),
    ('touch',   'beat-touch.html',   240,  0,   215,  312,  'p04_touch_K3'),
    ('under',   'beat-under.html',   330,  1,   325,  425,  'p02_under_K5'),
    ('redline', 'beat-redline.html', 450,  0,   440,  540,  'p05_redline_K6'),
    ('turn',    'beat-turn.html',    560,  0,   550,  632,  'p06_turn_K7'),
    ('side',    'beat-side.html',    650,  1,   642,  725,  'p07_down1_K9'),
    ('down',    'beat-down.html',    750,  0,   735,  820,  'p07_down1_K9'),
    ('offer',   'beat-offer.html',   None, 0,   830,  905,  'p07_down1_K9'),
    ('up2',     'up2',               920,  0,   None, None, 'p07_down1_K9'),
    ('cycle2',  'beat-cycle2.html',  990,  0,   915,  1025, 'p07_down1_K9'),
    ('repeat',  'beat-repeat.html',  1060, 0,   1035, 1120, 'p07_down1_K9'),
    ('oxygen',  'beat-oxygen.html',  1150, 0,   1135, 1225, 'p08_oxygen_K16'),
    ('fin',     'fin',               1230, 0,   None, None, 'p09_finale_K16F'),
]
CONFIG = {
    'len': STORY_LEN, 'F': F, 'fc': FC,
    # the readout's n along the story (s, n): it counts with scroll and lands on each frame's n as that frame lands
    # (13 holds while "Past twelve, something breaks." is read; 14 at the cut under; 19 as the top line goes under)
    'n': [[0, 8], [20, 8], [80, 10], [160, 12], [240, 13], [280, 13], [310, 14], [390, 19], [450, 39]],
    'readout': [0, 545], 'hero': [0, 40], 'q3': [215, 312], 'delta': [20, 312],
    'legend': [[640, 826], [908, 1125]],
    # the lit phase follows the frame on screen (it switches at the middle of each crossfade): s, phase, cycle, cell
    'phases': [[0, 'side', 1, 1], [735, 'down', 1, 0], [905, 'up', 2, 1], [975, 'side', 2, 1], [1045, 'up', 3, 1]],
}
PHONE_OWN = {pg.get('phone') for pg in bp.PAGES if pg.get('phone')}


def page_of(name):
    if name in FRAME_ONLY:
        return dict(FRAME_ONLY[name], file=None, column='none', dock='file')
    return P[name]


def eff_water(an):
    words = an.get('words') or [0, 0, 0, 0]
    return max(an.get('waterY', 0.55), words[3] + 0.02)


def owns(pg, phone):
    """True when the phone frame shows the same render state as the desktop still (same K number)."""
    return phone.split('_')[-1] == pg['still'].split('_')[-1]


def section_data(pg, an, pan, own_phone):
    """What the clock needs from the anchors (fractions of the frame box)."""
    wy = eff_water(an)
    it = [[round(wy, 4), 24]]
    if 'twelve' in pg.get('tags', []) and an.get('mark12'):
        it.append([an['mark12'][1], 34])
    a = {'wy': an.get('waterY'), 'wb': (an.get('words') or [0, 0, 0, 0])[3], 'it': it, 'gx': an.get('gaugeX', 1.0),
         'cx': 1 if 'complexity' in pg.get('tags', []) else 0, 'ro': 1 if pg.get('readout') else 0}
    if pan:
        pwy = max(pan.get('waterY', 0.58), pan['words'][3] + 0.02)
        a['p'] = {'wy': pan.get('waterY'), 'wb': pan['words'][3], 'it': [[round(pwy, 4), 22]],
                  'cx': a['cx'] if own_phone else 0}
        # the rendered load-line mark, when it shows (above the water, or seen from under it): a caption that has to
        # move up to clear the bar stops under it (stage.js fitLayers)
        m = pan.get('mark12Left')
        if m and m[0] < 1 and (pan.get('cam') == 'UNDER' or m[1] <= pan.get('waterY', 1) + 0.01):
            a['p']['m'] = [m[0], m[1]]
    return a


def section_css(sid, pg, an, pan, own_phone):
    sel = f'#b-{sid}'
    wy = eff_water(an)
    words = an.get('words') or [0, 0, 0, 0]
    top_inst = f'calc({pct(wy)} + 24px)'
    if 'twelve' in pg.get('tags', []) and an.get('mark12'):
        top_inst = f'max(calc({pct(wy)} + 24px), calc({pct(an["mark12"][1])} + 34px))'
    gx = an.get('gaugeX', 1.0)
    css = [f'{sel} .static {{ top: {top_inst}; left: min(calc({pct(gx)} - 356px), calc(100cqw - var(--bx) - 354px)); }}',
           f'{sel} .caption {{ top: max(calc({pct(wy)} + 70px), 58%); width: {pg.get("capw", 640)}px; }}',
           f'{sel} .offer {{ top: calc({pct(wy)} + 34px); }}']
    if pg.get('hero'):
        css.append(f'{sel} .audience {{ top: calc({pct(wy)} + 40px); }}')
    if pan:
        pw = pan['words']
        pwy = max(pan.get('waterY', 0.58), pw[3] + 0.02)
        ph = [f'{sel} .tag-water {{ top: {pct(pwy)} !important; }}', f'{sel} .caption {{ top: calc({pct(pwy)} + 40px); }}',
              f'{sel} .offer {{ top: calc({pct(pw[3])} + 28px); }}']
        if pg.get('hero'):
            ph.append(f'{sel} .audience {{ top: calc({pct(pwy)} + 34px); }}')
            ph.append(f'{sel} .static {{ top: calc({pct(pwy)} + 128px); }}')
            # with the stage: the audience and the scroll cue stand on the dark hull under the words, so the
            # instrument fits between the water and the bar on a short phone (390 x 664)
            # ... and it stops 12 px short of the rendered load-line mark at its right
            ph.append(f'html.js {sel} .audience {{ top: calc({pct(pw[3])} + 14px); width: calc({pct(pan["mark12Left"][0] - 0.03)} - 32px); '
                      f'font-size: 17px; }}')
        if not own_phone or pg.get('offer'):
            ph.append(f'{sel} .tag {{ display: none; }}')      # the held phone frame is not this beat's water
        # the rendered draught marks stand at the right edge of the phone frames from Down on (p07-p09): the words
        # stop 14 px short of them; the load-line mark sits in the offer's file lines on p07, so those stop short of it
        pgx = pan.get('gaugeX', 1.1)
        if pgx < 1:
            ph.append(f'{sel} .caption, {sel} .offer {{ max-width: min(calc(100cqw - 40px), calc({pct(pgx)} - 34px)); }}')
        if pg.get('offer') and pan.get('mark12Left'):
            ph.append(f'{sel} .offer .what, {sel} .offer .filehead {{ max-width: calc({pct(pan["mark12Left"][0])} - 34px); }}')
        css.append('@media (max-aspect-ratio: 3/4) { ' + ' '.join(ph) + ' }')
    return css


def margin_bracket(t):
    """The margin bracket ends 12 px above the water: its foot would otherwise sit on the "complexity" label."""
    if 'tag-margin' not in t:
        return t
    return re.sub(r'height:([\d.]+)%', r'height:calc(\1% - 12px)', t)


def section_html(i, sid, name, fs, cut, cin, cout, phone):
    pg = page_of(name)
    an = bp.anchors(pg['still'])
    pan = bp.anchors(phone)
    own_phone = owns(pg, phone)
    a = section_data(pg, an, pan, own_phone)
    attrs = [f'id="b-{sid}"']
    cls = ['beat']
    if fs is None:
        cls.append('noframe')
    if pg.get('file') is None:
        cls.append('frameonly')
    if sid == 'hero':
        cls.append('ld')
    if pg.get('offer'):
        cls.append('offerbeat')
    attrs.insert(0, f'class="{" ".join(cls)}"')
    if fs is not None:
        attrs.append(f'data-fs="{fs}"')
    if cut:
        attrs.append('data-cut="1"')
    if cin is not None:
        attrs.append(f'data-cin="{cin}"')
    if cout is not None:
        attrs.append(f'data-cout="{cout}"')
    attrs.append(f"data-a='{json.dumps(a, separators=(',', ':'))}'")
    style = ' style="--fo:1;--lo:1"' if sid == 'hero' else ''
    out = [f'<section {" ".join(attrs)}{style}>']
    out.append('  <div class="fbox">')
    if fs is not None or pg.get('file'):
        hi = sid == 'hero'
        load = 'fetchpriority="high"' if hi else 'loading="lazy" fetchpriority="low"'
        out.append(f'    <picture class="frame"><source media="(max-aspect-ratio: 3/4)" srcset="assets/img/{phone}.jpg">'
                   f'<img src="assets/img/{pg["still"]}.jpg" width="1600" height="1000" alt="{pg["alt"]}" {load} decoding="async"></picture> <!-- // label -->')
    tags = bp.tags(pg, an)
    if tags:
        out.append('    <div class="tags">')
        out += ['      ' + margin_bracket(t) for t in tags]
        out.append('    </div>')
    layer = []
    if pg.get('hero'):
        layer.append('<p class="audience">For bootstrapped, self-funded founders with teams of 1&#x2013;12'
                     '<span class="pcue" aria-hidden="true">Scroll to hire. Each step is one more person.</span></p> '
                     '<!-- // label (fit table, BL 4773, BL 4775; the cue is a label) -->')
    if pg.get('column') == 'instrument':
        inst = bp.instrument(pg, an)
        inst[0] = inst[0].replace('class="instrument"', 'class="instrument static"')
        inst = [x.replace(' aria-live="polite"', '') for x in inst]
        layer += inst
    elif pg.get('column') == 'legend':
        leg = bp.legend(pg)
        leg[0] = leg[0].replace('class="legend"', 'class="legend static"')
        layer += leg
    if pg.get('caption'):
        layer += bp.caption(pg)
    if pg.get('offer'):
        layer += bp.offer()
    if layer:
        out.append('    <div class="layer">')
        out += ['      ' + x for x in layer]
        out.append('    </div>')
    out.append('  </div>')
    out.append('</section>')
    return out, section_css(sid, pg, an, pan, own_phone)


def live_html():
    """One instrument, one legend and the water tag, moved and counted by the clock (JS only)."""
    bl = {k: v for k, v in bp.BANDS.items()}
    out = ['<div class="fbox livebox" aria-hidden="false">',
           '  <div class="tag wtag" aria-hidden="true"><span class="rule-h"></span><span class="wtext">complexity: 28 pathways</span></div> <!-- // label -->',
           '  <div class="instrument live hero">',
           '    <p class="question"><span class="asks">The Bootloader asks</span> How many people are on your team?</p> <!-- BL 310 (label: "The Bootloader asks") -->',
           '    <div class="readout" aria-hidden="true">',
           '      <span><span class="fig ro-n">8</span><span class="unit">people</span></span> <!-- // label -->',
           '      <span><span class="fig ro-p">28</span><span class="unit">coordination pathways<span class="ro-d"></span></span></span> <!-- // label (+n-1: BL 2339) -->',
           '    </div>']
    for k in ('team', 'threshold', 'graveyard'):
        tag, line, ref, _ = bl[k]
        hid = '' if k == 'team' else ' hidden'
        out.append(f'    <p class="band" data-band="{k}"{hid}><span class="btag">{tag}</span></p> <!-- // label -->')
        out.append(f'    <p class="bandline" data-band="{k}"{hid}>{line}</p> <!-- {ref} -->')
    out += [f'    <p class="sell">{bp.SELL}</p> <!-- BL 314 -->',
            '    <p class="cue">Scroll to hire. Each step is one more person.</p> <!-- // label -->',
            '    <div class="q3">',
            '      <p class="qlabel">The Bootloader starts with three questions</p> <!-- // label (BL 3748, "The Three Questions") -->',
            '      <p class="q">Where am I now?</p> <!-- BL 3748 -->',
            '      <p class="q">Where does my vehicle top out?</p> <!-- BL 3748 -->',
            '      <p class="gloss">your vehicle: bicycle, car, limousine or airplane</p> <!-- // label (BL 3564) -->',
            '      <p class="q">Where do I actually want to be?</p> <!-- BL 3748 -->',
            '    </div>',
            '  </div>',
            '  <div class="legend live">',
            '    <p class="llead">Real scaling is cyclical.</p> <!-- BL 795 -->',
            '    <p class="lap" data-lap="2" hidden>Cycle 2 of 3</p> <!-- // label -->',
            '    <p class="lap" data-lap="3" hidden>Cycle 3 of 3</p> <!-- // label -->']
    rows = [('up', 'Up', 'Up for growth.', 'Revenue expands, reach grows, capacity stretches', 'BL 861'),
            ('side', 'Side', 'Side for stability.', 'Systems absorb the growth, structure stabilizes', 'BL 862'),
            ('down', 'Down', 'Down for pruning.', 'Complexity pruned, margin recaptured, efficiency locked', 'BL 863')]
    for key, nm, line, cell, ref in rows:
        out += [f'    <div class="phase" data-ph="{key}">',
                f'      <p class="pname">{nm}</p> <p class="pline">{line}</p> <!-- BL 795 -->',
                f'      <p class="cell">{cell}</p> <!-- {ref} -->',
                '    </div>']
    out += ['  </div>',
            '  <p class="sr-only ro-live" aria-live="polite"></p>',
            '</div>']
    return out


def finale_html():
    an = bp.anchors('d13_finale_K16F')
    pan = bp.anchors('p09_finale_K16F')
    below = (an.get('stencil') or an['words'])[3]
    pbelow = (pan.get('stencil') or pan['words'])[3]
    fin = bp.finale()
    fixed = []
    for x in fin:
        x = x.replace(' name="email"', '')       # nothing is sent: the field is for the visitor, the page opens /appendix#get
        if 'class="note"' in x:      # the status line sits right under the field, where the eye is
            fixed += ['        <div class="fmsg" role="status">',
                      '          <p class="msg-bad" hidden>Enter your email address.</p> <!-- // label -->',
                      '          <p class="msg-go" hidden>Taking you to the Bootloader page&#x2026;</p> <!-- // label -->',
                      '        </div>']
        fixed.append(x)
    out = ['<section class="finale" aria-label="The SUSD Bootloader">  <!-- // label -->',
           '  <div class="fbox">',
           '    <picture class="frame"><source media="(max-aspect-ratio: 3/4)" srcset="assets/img/p09_finale_K16F.jpg">'
           f'<img src="assets/img/d13_finale_K16F.jpg" width="1600" height="1000" alt="{FRAME_ONLY["fin"]["alt"]}" loading="lazy" decoding="async"></picture> <!-- // label -->',
           '  </div>']
    out += ['  ' + x for x in fixed]
    out.append('</section>')
    # the cluster stops 20 px short of the rendered load-line mark (at 1280 wide the get-back line ran onto it);
    # on the phone the get-back line stops short of the draught marks at the frame's right edge
    m12 = an['mark12Left'][0]
    css = [f'.finale .cluster {{ padding-top: calc(var(--by) + {below:.4f} * var(--bh) + 34px); }}',
           f'@media not all and (max-aspect-ratio: 3/4) {{ .finale .cluster {{ width: min(900px, calc(var(--bx) + {m12:.4f} * var(--bw) - var(--L) - 20px)); }} }}',
           f'@media (max-aspect-ratio: 3/4) {{ .finale .cluster {{ padding-top: calc(var(--by) + {pbelow:.4f} * var(--bh) + 20px); }} '
           f'.finale .getback {{ max-width: calc({pan["gaugeX"]:.4f} * var(--bw) - 34px); }} }}']
    return out, css


HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Scaling Up-Side-Down</title>
<meta name="description" content="Every hire compounds complexity before it compounds capacity."> <!-- M 696, copy.ts:60 -->
<meta name="theme-color" content="#0B1112">
<script>(function(){var c=document.documentElement;c.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]reduced=1/.test(location.search))c.classList.add('rm')}catch(e){}})();</script>
<link rel="preload" href="assets/fonts/Plimsoll-Heavy.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/B612-Regular-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<!-- Generated by tools/build_site.py from mock/build_pages.py (copy) and out/stills/*.anchors.json (positions). -->
<style>
{style}
</style>
</head>
<body>
'''


def main():
    body, css = [], []
    for i, row in enumerate(SECTIONS):
        h, c = section_html(i, *row)
        body += ['    ' + x for x in h]
        css += c
    fin, fcss = finale_html()
    css += fcss
    chrome = bp.chrome({})
    lockup, dock = chrome[:5], chrome[5:]
    out = [HEAD.replace('{style}', '\n'.join(css))]
    out.append('<a class="skip" href="#get">Skip to the Bootloader</a> <!-- // label -->')
    out.append('<header class="top">')
    out += ['  ' + x for x in lockup]
    out += ['  ' + x for x in dock]
    out.append('</header>')
    out.append('<main id="story">')
    out.append('  <div class="stage" role="region" aria-label="The story, told by the water"> <!-- // label -->')
    out.append('    <h1 class="sr-only">Every hire compounds complexity before it compounds capacity.</h1> <!-- M 696, copy.ts:60 -->')
    out += body
    out.append('    <div class="fbox drainbox" aria-hidden="true"><picture class="frame drain"><source media="(max-aspect-ratio: 3/4)" srcset="assets/img/p09_finale_K16F.jpg">'
               '<img src="assets/img/d14_drain_K17.jpg" width="1600" height="1000" alt="" loading="lazy" decoding="async"></picture></div>')
    out += ['    ' + x for x in live_html()]
    out.append('  </div>')
    out.append('  <div class="runway" aria-hidden="true"></div>')
    out += ['  ' + x for x in fin]
    out.append('</main>')
    out += ['<div class="bar">',
            '  <span class="mark" aria-hidden="true">&#x29B5;</span>',
            '  <span class="dtext"><span class="name">SUSD Bootloader</span><span class="meta">Free AI file: find where your team stands</span> <!-- // label (BL 314) -->',
            '    <span class="meta dim">Works with Claude, ChatGPT, Gemini</span></span> <!-- // label -->',
            '  <a class="btn" href="#get" data-cta="bar" aria-label="Get the free SUSD Bootloader file">Get it free</a> <!-- // label -->',
            '</div>']
    out.append(f'<script type="application/json" id="story-config">{json.dumps(CONFIG, separators=(",", ":"))}</script>')
    out.append('<script src="assets/js/stage.js" defer></script>')
    out.append('</body>')
    out.append('</html>')
    html = '\n'.join(out) + '\n'
    html = html.replace('class="mark" aria-hidden="true">&#x29B5;</span>\n    <span class="dtext">', 'class="mark" aria-hidden="true">&#x29B5;</span>\n    <span class="dtext">')
    open(os.path.join(SITE, 'index.html'), 'w').write(html)
    # the rendered sentence's box per section, for tools/shoot_site.cjs (nothing may sit on it), and the rendered
    # load-line mark and draught marks (no words may sit on them either):
    # [gaugeX, mark12Left x, mark12 y, waterY, 1 if the camera is under the water]
    def marks(a):
        return [a.get('gaugeX', 1.1), (a.get('mark12Left') or [1.1, 0])[0], (a.get('mark12Left') or [0, -1])[1],
                a.get('waterY', 1), 1 if a.get('cam') == 'UNDER' else 0]
    words = {}
    for sid, name, fs, cut, cin, cout, phone in SECTIONS:
        pg = page_of(name)
        da, pa = bp.anchors(pg['still']), bp.anchors(phone)
        words['b-' + sid] = {'d': da.get('words'), 'p': pa.get('words'), 'dm': marks(da), 'pm': marks(pa)}
    os.makedirs(os.path.join(ROOT, 'out', 'site-shots'), exist_ok=True)
    json.dump(words, open(os.path.join(ROOT, 'out', 'site-shots', '.words.json'), 'w'))
    print('wrote site/index.html', len(html), 'bytes,', len(SECTIONS), 'sections')


if __name__ == '__main__':
    main()
