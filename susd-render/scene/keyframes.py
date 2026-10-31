#!/usr/bin/env python3
"""The sequence frame table and its renderer (brief 7.3-7.5; review round 1: the scene script could only
render the 18 K states, so no sequence could be made).

    python3 scene/keyframes.py --write                       # scene/keyframes.json (desktop, phone, drains)
    python3 scene/keyframes.py --render desktop 0:3          # frames d00..d03 at 1440x900, 24 samples
    python3 scene/keyframes.py --render phone 0:63 --w 600 --h 1300
    python3 scene/keyframes.py --render ddrain 0:11 --w 720 --h 450 --samples 16
    python3 scene/keyframes.py --render desktop holds        # the brief 7.5 step-1 frames (cuts and holds) first

Every frame is one call of scene/waterline.py with `--between A,B,t` (state A blended toward state B), `--n`
(the tide is even in n: the water follows the pathways map) and `--frame i` (Ocean time +0.04 s, the ripple and
caustic phase and the grain shift with it, so scrubbing reads as motion, not boil). Resumable: frames whose PNG
exists are skipped; each frame waits for a free CPU (tools/render_idle.py) and is logged in out/renders.jsonl
with its argv. One Blender process per frame costs ~10 s of scene build per frame (about 0.4 h over the 156
story frames); a persistent one-session loop is the next optimisation (06-HERO-BUILD, Round 1 fixes, item S3).
"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
from story import frames, drain_frames  # noqa: E402

KF = os.path.join(HERE, 'keyframes.json')
SIZES = {'desktop': (1440, 900), 'phone': (600, 1300), 'ddrain': (720, 450), 'pdrain': (300, 650)}
# brief 7.5 step 1 (cuts and holds), by n or state, re-mapped onto this table's ids at write time
HOLD_N = [1, 8, 12, 13, 14.5, 18.7, 19, 39]   # 18.7 is rendered on both cameras (the cut)


def table():
    return {'desktop': frames('desktop'), 'phone': frames('phone'),
            'ddrain': drain_frames('desktop'), 'pdrain': drain_frames('phone')}


def holds(fr):
    ids = []
    for f in fr:
        n = f.get('n')
        if n is not None and any(abs(n - h) < 1e-6 for h in HOLD_N):
            ids.append(f['id'])
        elif n is None and abs(f['t'] - 1.0) < 1e-6:      # the end of every cycle phase
            ids.append(f['id'])
    return ids


def main():
    a = sys.argv[1:]
    if '--write' in a or not os.path.exists(KF):
        t = table()
        t['holds'] = {k: holds(v) for k, v in t.items() if k in ('desktop', 'phone')}
        json.dump(t, open(KF, 'w'), indent=1)
        print('wrote', os.path.relpath(KF, ROOT), {k: len(v) for k, v in t.items() if k != 'holds'})
    if '--render' not in a:
        return
    t = json.load(open(KF))
    seq = a[a.index('--render') + 1]
    rng = a[a.index('--render') + 2]
    opt = dict(w=SIZES[seq][0], h=SIZES[seq][1], samples=24, outdir=os.path.join('out', 'seq', seq))
    for k in ('w', 'h', 'samples', 'outdir'):
        if '--' + k in a:
            opt[k] = a[a.index('--' + k) + 1]
    fr = t[seq]
    if rng == 'holds':
        want = set(t['holds'][seq])
        todo = [(i, f) for i, f in enumerate(fr) if f['id'] in want]
    else:
        lo, hi = (int(x) for x in rng.split(':'))
        todo = [(i, f) for i, f in enumerate(fr) if lo <= i <= hi]
    layout = 'phone' if seq in ('phone', 'pdrain') else 'desktop'
    os.makedirs(os.path.join(ROOT, opt['outdir']), exist_ok=True)
    for i, f in todo:
        out = os.path.join(opt['outdir'], f['id'] + '.png')
        if os.path.exists(os.path.join(ROOT, out)):
            print('skip', out)
            continue
        cmd = ['python3', 'tools/render_idle.py', 'blender', '-b', '-P', 'scene/waterline.py', '--',
               '--between', f"{f['a']},{f['b']},{f['t']}", '--frame', str(i), '--camera', layout,
               '--w', str(opt['w']), '--h', str(opt['h']), '--samples', str(opt['samples']), '--label', f['id'], '--out', out]
        if f.get('n') is not None:
            cmd += ['--n', str(f['n'])]
        if f.get('cam'):          # round 2: a frame that names its camera never blends cameras (hard cuts)
            cmd += ['--cam', f['cam']]
        print(' '.join(cmd), flush=True)
        subprocess.run(cmd, cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
