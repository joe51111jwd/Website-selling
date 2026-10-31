#!/usr/bin/env python3
"""Write the mock pages (first screen, every story beat the review asked to see, the finale) from one table,
placing the HTML from each still's anchors.json. Review round 1 (docs/06-HERO-BUILD.md, "Round 1 fixes").

    python3 mock/build_img.py && python3 mock/build_pages.py && node mock/shoot.cjs

Copy rules: every sentence is Michael's, verbatim, with its reference in a comment on the same line; labels
carry `// label` on their line (node susd-options/tools/copycheck.mjs mock/*.html must print 0 not found).
Positions are percentages of the 16:10 frame (desktop) or the 9:19.5 frame (phone), so they hold at any size.
"""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STILLS = os.environ.get('MOCK_STILLS', os.path.join(ROOT, 'out', 'stills'))   # override to preview on test frames
MOCK = os.environ.get('MOCK_DIR', os.path.join(ROOT, 'mock'))


def anchors(name):
    p = os.path.join(STILLS, name + '.anchors.json')
    return json.load(open(p)) if os.path.exists(p) else {}


def pct(v):
    return f'{v * 100:.2f}%'


BANDS = [  # tag (label), line (Michael), ref
    ('teamOfTeams', 'Team of Teams 40+', 'At 40+, Team of Teams physics apply. Different constraints, different playbook.', 'BL 4253'),
    ('graveyard', 'Graveyard 15&#x2013;39', "The Graveyard is not a temporary problem. It's a structural trap.", 'BL 3451'),
    ('threshold', 'Threshold 13&#x2013;14', 'At 13-14 employees, next hire is a phase change, not incremental growth.', 'BL 3450'),
    ('team', 'Team 8&#x2013;12', "Leader + team. Still know everyone's name.", 'BL 1250'),
    ('valley', 'Valley 4&#x2013;7', 'Transition zone between Small Team and Team.', 'BL 1249'),
    ('smallTeam', 'Small Team 2&#x2013;3', 'Leader + helpers. Coordination manageable.', 'BL 1248'),
    ('solopreneur', 'Solopreneur 1', 'Founder only. No coordination overhead.', 'BL 1247'),
]

# Each page: still (desktop), phone still (optional), the readout (n, p, band, tone), the column (instrument |
# legend | none), the caption, the anchored tags, and the dock's meta (file | cycle | hidden).
PAGES = [
    dict(file='index.html', title='first screen', still='d01_hero_K1', phone='p01_hero_K1', s=0,
         readout=(8, 28, 'team', ''), column='instrument', hero=True, tags=['complexity', 'twelve'], dock='file',
         alt='Heavy capital letters standing on a concrete lock wall spell the sentence above; dark water sits just below them.'),
    dict(file='beat-twelve.html', title='beat 2, twelve (s 160)', still='d02_twelve_K2', s=160,
         readout=(12, 66, 'team', 'mark'), column='instrument', tags=['twelve'], dock='file',
         caption=[('big', "12 isn't where you're trying to get. It's the line you don't cross.", 'BL 544')],
         alt='The water has risen to the painted load line under the words.'),
    dict(file='beat-touch.html', title='beat 3, thirteen (s 240)', still='d03_touch_K3', s=240,
         readout=(13, 78, 'threshold', 'red'), column='instrument', tags=[], dock='file',
         caption=[('big1', 'Past twelve, something breaks.', 'M 3509, copy.ts:88')],
         alt='The water touches the foot of every letter; the lock signal shows red.'),
    dict(file='beat-under.html', title='beat 4, going under (s 360)', still='d04_under_K5', phone='p02_under_K5', s=360,
         readout=(19, 171, 'graveyard', 'red'), column='instrument', tags=[], dock='file',
         caption=[('big', 'Complexity that accumulated faster than the structure could hold.', 'M 2021, copy.ts:96')],
         alt='Seen through a gallery window in the lock, the words are under green water.'),
    dict(file='beat-redline.html', title='beat 5, Redline (s 480)', still='d05_redline_K6', s=480,
         readout=(39, 741, 'graveyard', 'red'), column='instrument', tags=[], dock='file',
         caption=[('eqred', 'Complexity > Capacity = Redline.', 'M 2997, copy.ts:80'),
                  ('support', 'The business is drowning. Every addition makes it worse.', 'BL 717')],
         alt='Under a cloud the drowned words are deep in green water; the red lamp is the only warm light.'),
    dict(file='beat-turn.html', title='beat 6, the turn (s 560)', still='d06_turn_K7', s=560,
         readout=None, column='none', tags=[], dock='cycle',
         caption=[('big', 'You were never the problem. The model you inherited was.', 'M 216, copy.ts:196')],
         alt='The sun is back on the flooded lock; the words wait under the surface.'),
    dict(file='beat-side.html', title='beat 6, Side (s 640)', still='d07_side1_K8', s=640,
         readout=None, column='legend', phase='side', tags=['capacity'], dock='cycle',
         caption=[('big', 'Systems were what actually held the weight.', 'M 2408, copy.ts:103')],
         alt='A new course of concrete lifts the words; their top line breaks the surface.'),
    dict(file='beat-down.html', title='beat 7, Down (s 740)', still='d08_down1_K9', s=740,
         readout=None, column='legend', phase='down', tags=['complexity', 'margin'], dock='cycle',
         caption=[('big', 'Something needs to be cut.', 'M 2564, copy.ts:111'),
                  ('support', 'The business stops asking for more and starts asking what to keep.', 'M 2564, copy.ts:112')],
         alt='The lock has drained below the load line; the words stand dry on their first new course; the signal is green.'),
    dict(file='beat-offer.html', title='beat 7, the offer (s 860)', still='d08_down1_K9', s=860,
         readout=None, column='legend', phase='down', tags=['complexity', 'margin'], dock='cycle', offer=True,
         alt='The lock has drained below the load line; the words stand dry on their first new course; the signal is green.'),
    dict(file='beat-repeat.html', title='beat 8, Repeat (s 1020)', still='d11_up3_K13', s=1020,
         readout=None, column='legend', phase='up', lap=3, tags=['complexity', 'margin', 'twelve'], dock='cycle',
         caption=[('big', 'Nothing moves forward until the cycle completes. But when it does, the next cycle starts higher.', 'BL 870')],
         alt='Two courses under the words; the water has come up again and stopped at the load line.'),
    dict(file='beat-oxygen.html', title='beat 9, Oxygen (s 1150)', still='d12_oxygen_K16', s=1150, capoff=18, capwide=True,
         readout=None, column='none', tags=['highwater'], dock='file',
         caption=[('eqgreen', 'Capacity > Complexity = Oxygen.', 'M 2999, copy.ts:119'),
                  ('support', 'The business can breathe. Systems carry what the business creates.', 'BL 718')],
         alt='The words stand high and dry in the sun on three new courses, above their own flood line.'),
    dict(file='finale.html', title='beat 9, the finale (s 1240)', still='d13_finale_K16F', s=1240,
         readout=None, column='none', tags=[], dock='hidden', finale=True,
         alt='The words stand high on three courses above calm water; the newest course is stencilled with the Bootloader mark.'),
]

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Scaling Up-Side-Down</title>
<link rel="preload" href="fonts/Plimsoll-Heavy.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="mock.css">
<!-- Mock: {title}. Generated by mock/build_pages.py from out/stills/{still}.anchors.json. -->
<style>{style}</style>
</head>
<body class="{bodycls}">
'''


def chrome(pg):
    out = ['<div class="lockup">',
           '  <p class="title">Scaling Up&#x2011;Side&#x2011;Down</p>',
           '  <p class="byline">A book by Michael Wentz</p> <!-- // label -->',
           '  <a class="booklink" href="#book">The book</a> <!-- // label -->',
           '</div>']
    if pg['dock'] != 'hidden':
        if pg['dock'] == 'cycle':
            meta = ('<span class="meta voice">The file is the operating system.</span> <!-- M 4497, copy.ts:61 (dock line, beats 6-8) -->',)
        else:
            meta = ("<span class=\"meta\">The book's appendix as one file, for your AI</span> <!-- // label -->",)
        out += ['<div class="dock">',
                '  <span class="mark" aria-hidden="true">&#x29B5;</span>',
                '  <span class="dtext">',
                '    <span class="name">SUSD Bootloader</span>',
                '    ' + meta[0],
                '    <span class="meta">Works with Claude, ChatGPT and Gemini</span> <!-- // label (BL 221 names these three) -->',
                '  </span>',
                '  <a class="btn" href="#get" data-cta="dock" aria-label="Get the free SUSD Bootloader file">Get it free</a> <!-- // label -->',
                '</div>']
    return out


def instrument(pg, an):
    n, p, band, tone = pg['readout']
    cls = 'instrument' + (' red' if tone == 'red' else '')
    out = [f'<div class="{cls}">',
           '  <p class="question">How many people are on your team?</p> <!-- BL 310 -->']
    if pg.get('hero'):
        out.append("  <p class=\"tie\"><span class=\"mark\" aria-hidden=\"true\">&#x29B5;</span> The Bootloader's first question. Your AI asks the rest.</p> <!-- // label (BL 310: \"Ask first\") -->")
    figp = f'<span class="fig{" mark66" if tone == "mark" else ""}">{p}</span>'
    out += ['  <div class="readout" aria-live="polite">',
            f'    <span><span class="fig">{n}</span><span class="unit">people</span></span> <!-- // label -->',
            f'    <span>{figp}<span class="unit">coordination pathways</span></span> <!-- // label -->',
            '  </div>']
    if pg.get('hero'):
        out.append('  <p class="cue">Scroll to hire. Each step is one more person.</p> <!-- // label -->')
    out.append('  <ul class="bands">')
    for bid, tag, line, ref in BANDS:
        on = bid == band
        out.append(f'    <li{" class=\"on\"" if on else ""}>{tag}</li>')
        if on:
            out.append(f'    <li class="bandline">{line}</li> <!-- {ref} -->')
    out.append('  </ul>')
    out.append(f'  <p class="phoneband">{dict((b[0], b[1]) for b in BANDS)[band]}</p>')
    out.append('</div>')
    return out


def legend(pg):
    ph = pg['phase']
    rows = [('up', 'Up', 'Up for growth.', 'Revenue expands, reach grows, capacity stretches', 'BL 861'),
            ('side', 'Side', 'Side for stability.', 'Systems absorb the growth, structure stabilizes', 'BL 862'),
            ('down', 'Down', 'Down for pruning.', 'Complexity pruned, margin recaptured, efficiency locked', 'BL 863')]
    out = ['<div class="legend">',
           '  <p class="llead">Real scaling is cyclical.</p> <!-- BL 795 -->']
    if pg.get('lap'):
        out.append(f'  <p class="lap">Cycle {pg["lap"]} of 3</p> <!-- // label -->')
    for key, name, line, cell, ref in rows:
        on = key == ph
        out.append(f'  <div class="phase{" on" if on else ""}">')
        out.append(f'    <p class="pname">{name}</p> <p class="pline">{line}</p> <!-- BL 795 -->')
        if on:
            out.append(f'    <p class="cell">{cell}</p> <!-- {ref} -->')
        out.append('  </div>')
    out.append('</div>')
    return out


def caption(pg, an):
    out = ['<div class="caption">']
    for kind, text, ref in pg['caption']:
        tag = 'p'
        out.append(f'  <{tag} class="{kind}">{text}</{tag}> <!-- {ref} -->')
    out.append('</div>')
    return out


def offer():
    return ['<div class="offer">',
            '  <p class="big">The pages are reference. The file is the operating system.</p> <!-- M 4497, copy.ts:61 -->',
            '  <div class="offerrow">',
            '    <div class="ofile">',
            '      <p class="filehead"><span class="mark" aria-hidden="true">&#x29B5;</span><span class="fname">SUSD Bootloader</span></p>',
            "      <p class=\"what\">The book's appendix as one file, for your AI</p> <!-- // label -->",
            '      <p class="spec">Free<br>Version 16, 35,445 words<br>Works with Claude, ChatGPT and Gemini</p> <!-- // label -->',
            '    </div>',
            '    <div class="oq">',
            '      <p class="qlabel">It starts with three questions</p> <!-- // label (BL 3748, "The Three Questions") -->',
            '      <p class="q">Where am I now?</p> <!-- BL 3748 -->',
            '      <p class="q">Where does my vehicle top out?</p> <!-- BL 3748 -->',
            '      <p class="q">Where do I actually want to be?</p> <!-- BL 3748 -->',
            '    </div>',
            '  </div>',
            '  <a class="btn" href="#get" data-cta="offer">Get the free Bootloader</a> <!-- // label -->',
            '</div>']


def finale(an):
    return ['<div class="lead">',
            '  <p>In an open system, AI accelerates chaos.</p> <!-- M 4523, copy.ts:136 -->',
            '  <p>In a closed system, AI accelerates clarity.</p> <!-- M 4523, copy.ts:140 -->',
            '</div>',
            '<div class="col-book" id="book">',
            '  <p class="head">The book changed how you think.</p> <!-- M 4553, copy.ts:146 -->',
            '  <p class="booktitle">Scaling Up&#x2011;Side&#x2011;Down</p>',
            '  <p class="bookby">Michael Wentz</p> <!-- // label -->',
            '  <p class="soon">Pre-orders open soon</p> <!-- // label (plain text, not a control, until LINKS.preorder exists) -->',
            '  <p class="cred">Wentz spent nearly a decade in institutional finance before building and operating a bootstrapped business that scaled beyond 40 people.</p> <!-- BL 51 -->',
            '</div>',
            '<div class="col-file">',
            '  <p class="head">This SUSD Bootloader changes how you operate.</p> <!-- M 4555, copy.ts:146 -->',
            '  <div class="filegrid">',
            '    <div>',
            '      <p class="filehead"><span class="mark" aria-hidden="true">&#x29B5;</span><span class="fname">SUSD Bootloader</span></p>',
            "      <p class=\"what\">The book's appendix as one file, for your AI</p> <!-- // label -->",
            '      <p class="qlabel">It starts with three questions</p> <!-- // label (BL 3748, "The Three Questions") -->',
            '      <p class="q">Where am I now?</p> <!-- BL 3748 -->',
            '      <p class="q">Where does my vehicle top out?</p> <!-- BL 3748 -->',
            '      <p class="q">Where do I actually want to be?</p> <!-- BL 3748 -->',
            '      <p class="spec">Free<br>Version 16, 35,445 words, Markdown<br>Works with Claude, ChatGPT and Gemini</p> <!-- // label (BL 747, BL 221) -->',
            '    </div>',
            '    <div>',
            '      <form class="form" id="get-form" action="https://scaling-up-side-down.vercel.app/appendix#get" method="get" novalidate>',
            '        <label for="email">Email address</label> <!-- // label -->',
            '        <div class="formrow">',
            '          <input id="email" name="email" type="email" inputmode="email" autocomplete="email" enterkeyhint="send" placeholder="you@company.com" aria-describedby="note">',
            '          <button class="btn" type="submit" data-cta="finale">Get the free Bootloader</button> <!-- // label -->',
            '        </div>',
            '        <p class="note" id="note">Opens the Bootloader page, where the file is sent by email.</p> <!-- // label (handoff mode; post mode: "The file is sent to this address.") -->',
            '      </form>',
            '      <p class="next">Upload the file and use the starting prompt provided with it.</p> <!-- M 4531, copy.ts:150 -->',
            '      <p class="next">Then let the system locate you.</p> <!-- M 4533, copy.ts:151 -->',
            '      <a class="appendix" href="https://scaling-up-side-down.vercel.app/appendix">Read the Appendix</a> <!-- // label -->',
            '    </div>',
            '  </div>',
            '</div>']


def tags(pg, an, layout):
    """Anchored labels: 1 px cream rules and B612 13 px text, never boxed; the text always sits on water."""
    out = []
    if not an:
        return out
    wy = an.get('waterY', 0.5)
    for t in pg.get('tags', []):
        if t == 'complexity':
            out.append(f'<div class="tag tag-water" style="top:{pct(wy)}"><span class="rule-h"></span>complexity</div> <!-- // label -->')
        elif t == 'twelve' and an.get('mark12'):
            mx, my = an['mark12']
            out.append(f'<div class="tag tag-mark" style="left:{pct(mx)};top:{pct(my)};height:calc({pct(wy - my)} + 26px)"><span>12 people: the load line</span></div> <!-- // label -->')
        elif t == 'capacity' and an.get('deckY') is not None:
            dx0 = an['deckX'][0]
            out.append(f'<div class="tag tag-deck" style="right:calc(100% - {pct(dx0)} + 14px);top:{pct(an["deckY"])}">capacity<span class="rule-h"></span></div> <!-- // label -->')
        elif t == 'margin' and an.get('deckY') is not None:
            dx0, dy = an['deckX'][0], an['deckY']
            out.append(f'<div class="tag tag-margin" style="left:calc({pct(dx0)} - 34px);top:{pct(dy)};height:{pct(wy - dy)}"><span>margin</span></div> <!-- // label -->')
        elif t == 'highwater' and an.get('scarY') is not None:
            gx = an.get('gaugeX', 0.9)
            out.append(f'<div class="tag tag-scar" style="left:calc({pct(gx)} - 64px);top:{pct(an["scarY"])};height:calc({pct(wy - an["scarY"])} + 26px)"><span>high water, 39 people</span></div> <!-- // label -->')
    return out


def page(pg):
    an = anchors(pg['still'])
    style = []
    # text goes on the water under the words: the waterline, or (when the water is over the words, as in the
    # window frames) the words' bottom edge
    wy = max(an.get('waterY', 0.55), (an.get('words') or [0, 0, 0, 0])[3] + 0.02)
    # the instrument and captions start just under the waterline (desktop px at 1440x900 = % of the frame)
    style.append(f'.instrument, .legend {{ top: calc({pct(wy)} + {"30px" if "twelve" in pg.get("tags", []) else "22px"}); }}')
    capoff = pg.get('capoff', 64)
    capmin = '58%' if capoff >= 40 else '0%'
    style.append(f'.caption {{ top: max(calc({pct(wy)} + {capoff}px), {capmin}); }} .offer {{ top: calc({pct(wy)} + 18px); }}')
    if pg.get('capwide'):
        style.append('.caption { width: 900px; }')
    if pg.get('hero'):
        style.append(f'.audience {{ top: calc({pct(wy)} + 64px); }}')
    if pg.get('finale'):
        style.append(f'.lead {{ top: calc({pct(wy)} + 18px); }} .col-book, .col-file {{ top: calc({pct(wy)} + 112px); }}')
    pan = anchors(pg['phone']) if pg.get('phone') else {}
    if pan:
        pwy = max(pan.get('waterY', 0.58), (pan.get('words') or [0, 0, 0, 0])[3] + 0.02)
        style.append('@media (max-aspect-ratio: 3/4) { '
                     f'.tag-water {{ top: {pct(pwy)}; }} .audience {{ top: calc({pct(pwy)} + 26px); }} '
                     f'.instrument {{ top: calc({pct(pwy)} + 92px); }} .caption {{ top: calc({pct(pwy)} + 120px); }} }}')
    bodycls = ' '.join(x for x in ['finale' if pg.get('finale') else '', 'hasphone' if pg.get('phone') else ''] if x)
    out = [HEAD.format(title=pg['title'], still=pg['still'], style=' '.join(style), bodycls=bodycls)]
    if pg.get('hero'):
        out.append('<a class="sr-only" href="#get">Skip to the Bootloader</a> <!-- // label -->')
    out.append('<main>')
    out.append(f'<section class="stage"{" id=\"get\"" if pg.get("finale") else ""} aria-label="The story, told by the water"> <!-- // label -->')
    src = f'<source media="(max-aspect-ratio: 3/4)" srcset="img/{pg["phone"]}.jpg">' if pg.get('phone') else ''
    out.append(f'  <picture>{src}<img src="img/{pg["still"]}.jpg" alt="{pg["alt"]}" fetchpriority="high"></picture> <!-- // label -->')
    if pg.get('hero'):
        out.append('  <h1 class="sr-only">Every hire compounds complexity before it compounds capacity.</h1> <!-- M 696, copy.ts:60 -->')
    out += ['  ' + x for x in chrome(pg)]
    if pg.get('hero'):
        out.append('  <p class="audience">For bootstrapped, self-funded founders with teams of 1&#x2013;12</p> <!-- // label (fit table, BL 4773, BL 4775) -->')
    out += ['  ' + x for x in tags(pg, an, 'desktop')]
    if pg['column'] == 'instrument':
        out += ['  ' + x for x in instrument(pg, an)]
    elif pg['column'] == 'legend':
        out += ['  ' + x for x in legend(pg)]
    if pg.get('caption'):
        out += ['  ' + x for x in caption(pg, an)]
    if pg.get('offer'):
        out += ['  ' + x for x in offer()]
    if pg.get('finale'):
        out += ['  ' + x for x in finale(an)]
    out.append('</section>')
    out.append('</main>')
    if pg['dock'] != 'hidden':
        meta = ('<span class="meta voice">The file is the operating system.</span> <!-- M 4497, copy.ts:61 -->' if pg['dock'] == 'cycle'
                else '<span class="meta">Free file for your AI</span> <!-- // label -->')
        out += ['<div class="bar">',
                '  <span class="mark" aria-hidden="true">&#x29B5;</span>',
                f'  <span class="dtext"><span class="name">SUSD Bootloader</span>{meta}',
                '    <span class="meta">Works with Claude, ChatGPT, Gemini</span></span> <!-- // label -->',
                '  <a class="btn" href="#get" data-cta="bar" aria-label="Get the free SUSD Bootloader file">Get it free</a> <!-- // label -->',
                '</div>']
    out.append('</body>')
    out.append('</html>')
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    for pg in PAGES:
        open(os.path.join(MOCK, pg['file']), 'w').write(page(pg))
        print('wrote', 'mock/' + pg['file'], '(no anchors yet)' if not anchors(pg['still']) else '')
