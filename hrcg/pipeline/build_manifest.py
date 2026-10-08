# Builds src/media/manifest.json from the id spec below + the files actually on disk in public/media
# (byte sizes and codec strings are MEASURED from the files) + pipeline/out/*.json (seams, rects, lines).
# usage: python -I build_manifest.py [--mock]
# Fails (exit 1) if any listed file is missing, unless --allow-missing.
import os, sys, json, subprocess, datetime

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(R, 'public')
OUT = os.path.join(R, 'pipeline', 'out')
MOCK = '--mock' in sys.argv
ALLOW_MISSING = '--allow-missing' in sys.argv

def jload(name, default):
    p = os.path.join(OUT, name)
    return json.load(open(p)) if os.path.exists(p) else default

seams = jload('seams.json', {})          # id -> {in, out} | null      (D11 measure.py)
rects = jload('rects.json', {})          # plan id -> [x0,y0,x1,y1] normalised (D7)
lines = jload('lines-summary.json', {})  # {'fresh': [[x,y],[x,y]]} (D5)
heroinfo = jload('hero.json', {})        # optional overrides (D1/D2: freeze frame etc.)

A = 'AI-generated concept film'
ALT = {
    'hero-film': A + ': robot 07 crouches as a blue chalk line snaps and dust billows toward the camera.',
    'hero-still': A + ' still: robot 07 crouches as a blue chalk line snaps and dust billows toward the camera.',
    'plan-b44-260': A + ' still, seen from above: a freshly snapped blue chalk line in bay 05, with robot 07 crouched beside it.',
    'arena': A + ', seen from above: five work bays in a row. In each one, robot 07, a concept design, works on one challenge: bricklaying, drywall installation, bolted assembly, pipe assembly, and layout and marking.',
    'arena-poster': A + ' still, seen from above: five work bays in a row.',
    'b40': A + ', seen from above: robot 07 spreads mortar and lays a course of brick between two line posts.',
    'b41': A + ', seen from above: robot 07 holds a drywall sheet against a stud frame, steps back, and returns.',
    'b42': A + ', seen from above: robot 07 fastens a bolted splice plate.',
    'b43': A + ', seen from above: robot 07 joins copper pipe and fittings beside a task drawing taped to the floor.',
    'b44': A + ', seen from above: robot 07 snaps a blue chalk line inside a marked-out bay and moves to the bay’s edge.',
    'c30': A + ': robot 07 lays a brick on a mortar bed along a stringline, with lights hanging in the dark behind.',
    'c31': A + ', close on robot 07’s hands pressing a sheet of drywall flat against a steel stud frame; dust hangs in the light.',
    'c32': A + ': robot 07 drives a bolt with an impact wrench and reaches into a tray of bolts.',
    'c33': A + ', close on robot 07’s hands joining copper pipe at an elbow under a warm work light.',
    'v0': A + ', close up: a robot hand presses a brick into a mortar bed beside a stringline.',
    'n03': A + ', close up: a robot hand runs an impact wrench on a nut until it seats.',
    'n04': A + ', close up from above: robot fingers pinch a blue chalk line, lift it and let it snap onto concrete.',
    'section': 'Depth drawing of one frame from an AI-generated concept film: robot 07 crouches, holding a taut chalk line that runs toward the camera. In front of the section plane the frame is drawn as depth contour lines; behind it the film shows.',
    'sec-near': 'Depth drawing of one frame from an AI-generated concept film, with the section plane near the camera.',
    'sec-mid': 'Depth drawing of one frame from an AI-generated concept film, with the section plane in the middle.',
    'sec-far': 'Depth drawing of one frame from an AI-generated concept film, with the section plane near the robot.',
    'ref21': 'Concept illustration: portrait of robot 07, an original concept robot with graphite armor, orange shoulder panels and a stenciled 07 on its chest.',
    'bay-empty': 'Concept illustration, seen from above: an empty work bay with yellow tape and a chalked plan, with YOUR ROBOT stenciled on the floor.',
    'mat-1': 'Concept illustration from above: a pallet of brick and a tub of mortar with a trowel on concrete. Not a sponsor product.',
    'mat-2': 'Concept illustration from above: stacked drywall sheets, a box of screws and a drill. Not a sponsor product.',
    'mat-3': 'Concept illustration from above: a tray of bolts and nuts and a wrench. Not a sponsor product.',
    'mat-4': 'Concept illustration from above: copper fittings in a box and a pipe cutter. Not a sponsor product.',
    'mat-5': 'Concept illustration from above: a chalk line reel, a tape measure and an orange marking can. Not a sponsor product.',
    't7': 'Control target T7: a square panel of dark and light bricks in stack bond, two bricks to each cell, that forms AprilTag tag36h11, ID 7.',
    't7-proof': 'Our digital test renders of the target, flat, warped and blurred, and small, each outlined where the detector found the tag.',
    'the-set': 'The Set, a 30-second concept film',
    'the-set-poster': 'Concept film poster: the HRCG drawing set, a screen capture of this site with AI-generated concept footage.',
}
VT = {
    'hero-film': {'view': 'PERSPECTIVE 05-A · LAYOUT AND MARKING', 'kind': 'film', 'id': 'hero-film', 'hasntHappened': True},
    'hero-still': {'view': 'PERSPECTIVE 05-A · LAYOUT AND MARKING', 'kind': 'frame', 'id': 'hero-still', 'hasntHappened': True},
    'hero-3d': {'view': '3D VIEW 05-A', 'kind': 'depth', 'id': 'hero-3d', 'oneFrame': True},
    'plan-cut': {'view': 'PLAN 05', 'kind': 'frame', 'id': 'plan-cut'},
    'a100': {'view': 'PLAN VIEWS 01–05', 'kind': 'film', 'id': 'a100-plans'},
    'a200-poster': {'view': 'PLAN VIEWS 01–05', 'kind': 'frame', 'id': 'a200-poster'},
    'plan1': {'view': 'PLAN 01', 'kind': 'film', 'id': 'a101-plan'},
    'plan2': {'view': 'PLAN 02', 'kind': 'film', 'id': 'a102-plan'},
    'plan3': {'view': 'PLAN 03', 'kind': 'film', 'id': 'a103-plan'},
    'plan4': {'view': 'PLAN 04', 'kind': 'film', 'id': 'a104-plan'},
    'plan5': {'view': 'PLAN 05', 'kind': 'film', 'id': 'a105-plan'},
    'p01': {'view': 'PERSPECTIVE 01-A', 'kind': 'film', 'id': 'a101-perspective'},
    'p02': {'view': 'PERSPECTIVE 02-A', 'kind': 'film', 'id': 'a102-perspective'},
    'p03': {'view': 'PERSPECTIVE 03-A', 'kind': 'film', 'id': 'a103-perspective'},
    'p04': {'view': 'PERSPECTIVE 04-A', 'kind': 'film', 'id': 'a104-perspective'},
    'd1': {'view': 'DETAIL 1 / A-101', 'kind': 'film', 'id': 'a101-detail'},
    'd3': {'view': 'DETAIL 3 / A-103', 'kind': 'film', 'id': 'a103-detail'},
    'd5': {'view': 'DETAIL 5 / A-105', 'kind': 'film', 'id': 'a105-detail'},
    'sec': {'view': 'SECTION A–A', 'kind': 'depth', 'suffix': 'ILLUSTRATIVE: PLAN AND SECTION ARE DIFFERENT SHOTS', 'id': 'a105-section'},
    'trace5': {'view': 'LINES TRACED FROM CONCEPT FOOTAGE', 'kind': 'drawing', 'id': 'a105-trace'},
    'trace4': {'view': 'TASK DRAWING TRACED FROM CONCEPT FOOTAGE', 'kind': 'drawing', 'id': 'a104-trace'},
    'd07': {'view': 'DETAIL 07', 'kind': 'still', 'suffix': 'ROBOT 07 IS A CONCEPT DESIGN, NOT A REAL ROBOT OR A COMPETITOR', 'id': 'a300-detail07'},
    'bay': {'view': 'PLAN · AN EMPTY BAY', 'kind': 'still', 'suffix': 'NOT A VENUE PLAN', 'id': 'a300-empty-bay'},
    'mat': {'view': 'MATERIALS', 'kind': 'still', 'suffix': 'NOT SPONSOR PRODUCTS', 'id': 'a301-materials'},
    't7': {'view': 'CONTROL TARGET T7', 'kind': 'drawing'},
    'set': {'view': 'THE SET', 'kind': 'film'},
    'ground': {'view': 'A-000 GROUND', 'kind': 'still'},
}

# spec rows: (id, kind, dir, w, h, extra)
V = []  # videos
def vid(id, d, w, h, dur, alt, vt, **kw): V.append(dict(id=id, kind='video', dir=d, w=w, h=h, dur=dur, fps=24, alt=alt, vt=vt, **kw))
I = []  # images (avif + jpg)
def img(id, d, w, h, alt, vt, kind='image', ext=('avif', 'jpg'), **kw): I.append(dict(id=id, kind=kind, dir=d, w=w, h=h, alt=alt, vt=vt, ext=ext, **kw))
F = []  # single files
def one(id, kind, path, mime, w, h, alt, vt, **kw): F.append(dict(id=id, kind=kind, path=path, mime=mime, w=w, h=h, alt=alt, vt=vt, **kw))

FILM = 25 / 24
vid('hero-snap-169', 'hero', 1920, 1076, FILM, ALT['hero-film'], VT['hero-film'], stills=('hero/hero-still-169-av1.avif', 'hero/hero-still-169-h264.avif'), freezeFrame=84, meta='media/hero/hero-meta-169.json', noloop=True)
vid('hero-snap-916', 'hero', 1076, 1912, FILM, ALT['hero-film'], VT['hero-film'], stills=('hero/hero-still-916-av1.avif', 'hero/hero-still-916-h264.avif'), freezeFrame=100, meta='media/hero/hero-meta-916.json', noloop=True)
for c in ('av1', 'h264'):
    img(f'hero-still-169-{c}', 'hero', 1920, 1076, ALT['hero-still'], VT['hero-still'])
    img(f'hero-still-916-{c}', 'hero', 1076, 1912, ALT['hero-still'], VT['hero-still'])
img('hero-ground-169', 'hero', 1920, 1076, '', VT['ground'])
img('hero-ground-916', 'hero', 1076, 1912, '', VT['ground'])
img('hero-plate-169', 'hero', 960, 538, '', VT['hero-3d'])
img('hero-plate-916', 'hero', 538, 956, '', VT['hero-3d'])
one('hero-matte-169', 'matte', 'media/hero/hero-matte-169.webp', 'image/webp', 1920, 1076, '', VT['hero-still'])
one('hero-matte-916', 'matte', 'media/hero/hero-matte-916.webp', 'image/webp', 1076, 1912, '', VT['hero-still'])
one('hero-depth-169', 'bin', 'media/hero/hero-depth-169.bin', 'application/octet-stream', 257, 145, '', VT['hero-3d'], meta='media/hero/hero-meta-169.json')
one('hero-depth-916', 'bin', 'media/hero/hero-depth-916.bin', 'application/octet-stream', 145, 257, '', VT['hero-3d'], meta='media/hero/hero-meta-916.json')
one('hero-meta-169', 'json', 'media/hero/hero-meta-169.json', 'application/json', 1920, 1076, '', VT['hero-3d'])
one('hero-meta-916', 'json', 'media/hero/hero-meta-916.json', 'application/json', 1076, 1912, '', VT['hero-3d'])
img('tex-slab', 'tex', 1024, 1024, '', VT['ground'])

img('plan-b44-260', 'plans', 1440, 1440, ALT['plan-b44-260'], VT['plan-cut'], plan='plan-b44')
for n, (k, t) in enumerate([('b40', 'plan1'), ('b41', 'plan2'), ('b42', 'plan3'), ('b43', 'plan4'), ('b44', 'plan5')]):
    vid(f'plan-{k}', 'plans', 1080, 1080, 121 / 24, ALT[k], VT[t], plan=f'plan-{k}', noloop=(k == 'b44'), seamOf=f'reg-{k}')
    vid(f'plan-{k}-m', 'plans', 720, 720, 121 / 24, ALT[k], VT[t], plan=f'plan-{k}', noloop=(k == 'b44'), seamOf=f'reg-{k}')
vid('arena-0104', 'arena', 1890, 350, 121 / 24, ALT['arena'], VT['a100'])
vid('arena-0104-m', 'arena', 1080, 200, 121 / 24, ALT['arena'], VT['a100'], seamOf='arena-0104')
img('arena-poster', 'arena', 1890, 350, ALT['arena-poster'], VT['a200-poster'])

vid('el-c30', 'perspectives', 1920, 804, 121 / 24, ALT['c30'], VT['p01'], seamOf='n09r')
vid('el-c30-m', 'perspectives', 1080, 1350, 121 / 24, ALT['c30'], VT['p01'], seamOf='n09r')
vid('el-c31', 'perspectives', 1080, 1350, 121 / 24, ALT['c31'], VT['p02'], seamOf='c31')
vid('el-c32', 'perspectives', 1920, 1076, 121 / 24, ALT['c32'], VT['p03'], seamOf='c32')
vid('el-c33', 'perspectives', 1920, 804, 121 / 24, ALT['c33'], VT['p04'], seamOf='c33')
vid('det-v0', 'details', 1076, 1076, 3.5, ALT['v0'], VT['d1'])
vid('det-n03', 'details', 1076, 1076, 121 / 24, ALT['n03'], VT['d3'], seamOf='n03')
vid('det-n04', 'details', 1076, 1076, 121 / 24, ALT['n04'], VT['d5'], seamOf='n04')

img('sec-c34-color', 'section', 1920, 1076, ALT['section'], VT['sec'], meta='media/section/sec-c34-meta.json')
one('sec-c34-depth', 'depth', 'media/section/sec-c34-depth.png', 'image/png', 960, 540, '', VT['sec'], meta='media/section/sec-c34-meta.json')
one('sec-c34-meta', 'json', 'media/section/sec-c34-meta.json', 'application/json', 960, 540, '', VT['sec'])
for k in ('near', 'mid', 'far'):
    img(f'sec-{k}', 'section', 1920, 1076, ALT[f'sec-{k}'], VT['sec'])
one('lines-b44', 'json', 'media/data/lines-b44.json', 'application/json', 1440, 1440, '', VT['trace5'])
one('trace-t43', 'svg', 'media/data/trace-t43.svg', 'image/svg+xml', 1000, 1000, '', VT['trace4'])

img('ref21-portrait', 'stills', 800, 800, ALT['ref21'], VT['d07'])
img('bay-empty', 'stills', 1080, 1080, ALT['bay-empty'], VT['bay'])
for k in range(1, 6):
    img(f'mat-{k}', 'stills', 1080, 1080, ALT[f'mat-{k}'], VT['mat'])
one('t7-brick', 'svg', 'media/data/t7-brick.svg', 'image/svg+xml', 200, 200, ALT['t7'], VT['t7'])
img('t7-proof', 'stills', 1200, 400, ALT['t7-proof'], VT['t7'], meta='media/data/t7-proof.json')
one('t7-proof-json', 'json', 'media/data/t7-proof.json', 'application/json', 0, 0, '', VT['t7'])
one('kit-t7-letter', 'pdf', 'kit/hrcg-t7-letter.pdf', 'application/pdf', 612, 792, 'Download T7 (US Letter PDF)', VT['t7'])
one('kit-t7-a4', 'pdf', 'kit/hrcg-t7-a4.pdf', 'application/pdf', 595, 842, 'Download T7 (A4 PDF)', VT['t7'])
one('kit-t7-svg', 'svg', 'kit/hrcg-t7.svg', 'image/svg+xml', 200, 200, 'Download T7 (SVG)', VT['t7'])
# THE SET (A7 renders; A5 encodes into media/film). Listed only when its files exist (or in the mock).
SET = dict(id='the-set-169', dir='film', w=1920, h=1080, dur=30.0, alt=ALT['the-set'], vt=VT['set'], noloop=True, optional=True, posterAlt=ALT['the-set-poster'])

PRIORITY = {
    'A-000': ['hero-snap-169'],
    'A-100': ['arena-0104', 'plan-b44'],
    'A-101': ['el-c30', 'plan-b40', 'det-v0'],
    'A-102': ['el-c31', 'plan-b41'],
    'A-103': ['det-n03', 'el-c32', 'plan-b42'],
    'A-104': ['el-c33', 'plan-b43'],
    'A-105': ['plan-b44', 'det-n04'],
    'A-200': [],
    'A-300': [],
    'A-301': [],
    'A-900': [],
}

missing = []
def size(rel):
    p = os.path.join(PUB, rel)
    if not os.path.exists(p):
        missing.append(rel); return 0
    return os.path.getsize(p)

def probe(rel):
    p = os.path.join(PUB, rel)
    if not os.path.exists(p): return {}
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                        'stream=codec_name,profile,level,width,height,pix_fmt,nb_frames,r_frame_rate:format=duration',
                        '-of', 'json', p], capture_output=True, text=True)
    j = json.loads(r.stdout or '{}'); s = (j.get('streams') or [{}])[0]; s['duration'] = float(j.get('format', {}).get('duration', 0) or 0)
    return s

def codec_type(rel, fallback):
    s = probe(rel)
    if not s: return fallback
    if s.get('codec_name') == 'av1':
        lvl = int(s.get('level', 8)) if str(s.get('level', '')).lstrip('-').isdigit() and int(s.get('level')) >= 0 else 8
        return f'video/mp4; codecs="av01.0.{lvl:02d}M.08"'
    if s.get('codec_name') == 'h264':
        prof = {'Baseline': '42', 'Constrained Baseline': '42', 'Main': '4D', 'High': '64'}.get(s.get('profile'), '64')
        lvl = int(s.get('level', 40))
        return f'video/mp4; codecs="avc1.{prof}00{lvl:02X}"'
    return fallback

def m(rel): return 'media/' + rel

media = {}
for v in V + ([SET] if True else []):
    d, id = v['dir'], v['id']
    a1, h2 = f'{d}/{id}.av1.mp4', f'{d}/{id}.h264.mp4'
    if v.get('optional') and not os.path.exists(os.path.join(PUB, 'media', a1)):
        continue
    if v.get('optional') and not MOCK and not os.path.exists(os.path.join(PUB, 'media', d, id + '.final')):
        continue  # THE SET ships in the real manifest only once A7's final render is encoded (marker file)
    pa, pj = f'{d}/{id}.poster.avif', f'{d}/{id}.poster.jpg'
    files = [a1, h2, pa, pj]
    e = {'id': id, 'kind': 'video',
         'sources': [{'src': m(a1), 'type': codec_type('media/' + a1, 'video/mp4; codecs="av01.0.08M.08"')},
                     {'src': m(h2), 'type': codec_type('media/' + h2, 'video/mp4; codecs="avc1.640028"')}],
         'poster': m(pa), 'posterFallback': m(pj), 'w': v['w'], 'h': v['h'], 'fps': 24,
         'alt': v['alt'], 'viewTitle': v['vt']}
    pr = probe('media/' + a1)
    e['dur'] = round(pr.get('duration') or v['dur'], 3)
    if pr.get('width') and (pr['width'], pr['height']) != (v['w'], v['h']):
        print(f'WARN {id}: file is {pr["width"]}x{pr["height"]}, spec {v["w"]}x{v["h"]}')
    key = v.get('seamOf', id)
    sm = seams.get(key)
    e['loop'] = None if (v.get('noloop') or not sm or not sm.get('accepted')) else {'in': sm['in'], 'out': sm['out']}
    if v.get('stills'):
        e['stills'] = {'av1': m(v['stills'][0]), 'h264': m(v['stills'][1])}; files += list(v['stills'])
        e['freezeFrame'] = heroinfo.get(id, {}).get('freezeFrame', v.get('freezeFrame'))
        if e['freezeFrame'] is None: del e['freezeFrame']
    if v.get('meta'): e['meta'] = v['meta']
    if v.get('plan'):
        r = rects.get(v['plan'], [120 / 1440, 120 / 1440, 1320 / 1440, 1320 / 1440])
        e['borderRect'] = [round(x, 5) for x in r]
        if v['plan'] == 'plan-b44' and lines.get('fresh'): e['lineEndpoints'] = lines['fresh']
    e['bytes'] = {m(f): size('media/' + f) for f in files}
    media[id] = e
for i in I:
    d, id = i['dir'], i['id']
    rels = [f'{d}/{id}.{x}' for x in i['ext']]
    e = {'id': id, 'kind': i['kind'],
         'sources': [{'src': m(r), 'type': {'avif': 'image/avif', 'jpg': 'image/jpeg', 'webp': 'image/webp', 'png': 'image/png'}[r.rsplit('.', 1)[1]]} for r in rels],
         'w': i['w'], 'h': i['h'], 'alt': i['alt'], 'viewTitle': i['vt']}
    if i.get('meta'): e['meta'] = i['meta']
    if i.get('plan'):
        e['borderRect'] = [round(x, 5) for x in rects.get(i['plan'], [120 / 1440, 120 / 1440, 1320 / 1440, 1320 / 1440])]
        if lines.get('fresh'): e['lineEndpoints'] = lines['fresh']
    e['bytes'] = {m(r): size('media/' + r) for r in rels}
    media[id] = e
for f in F:
    e = {'id': f['id'], 'kind': f['kind'], 'sources': [{'src': f['path'], 'type': f['mime']}], 'w': f['w'], 'h': f['h'],
         'alt': f['alt'], 'viewTitle': f['vt'], 'bytes': {f['path']: size(f['path'])}}
    if f.get('meta'): e['meta'] = f['meta']
    media[f['id']] = e

for sheet, ids in PRIORITY.items():
    for x in ids:
        assert x in media, f'priority list {sheet} names unknown id {x}'

if missing and not ALLOW_MISSING:
    print('MISSING files:\n  ' + '\n  '.join(missing)); sys.exit(1)

doc = {'version': 1, 'mock': MOCK, 'generated': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
       'media': media, 'sheetVideoPriority': PRIORITY}
json.dump(doc, open(os.path.join(R, 'src', 'media', 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
tot = sum(sum(e['bytes'].values()) for e in media.values())
print(f'manifest: {len(media)} entries, {tot / 1e6:.2f} MB on disk, mock={MOCK}, missing={len(missing)}')
