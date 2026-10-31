#!/usr/bin/env python3
"""Run one Blender render only when the CPU is free, and record whether it stayed free.

  python3 tools/render_idle.py blender -b -P lookdev/stage_c_lock.py -- --w 1440 --h 900 ... --out X.png

Waits until no other `blender` process has run for three checks two seconds apart (up to 30 min),
runs the command, polls every 2 s for any OTHER blender process during the render, and then adds
`cpu_shared_s` (seconds another render overlapped ours) and `load1_before` to the matching row of
lookdev/renders.jsonl. Timings with cpu_shared_s > 0 are not clean and are not quoted in the docs.
"""
import json, os, subprocess, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LOG = os.path.join(ROOT, 'lookdev', 'renders.jsonl')


def blenders(exclude=()):
    out = subprocess.run(['pgrep', '-x', 'blender'], capture_output=True, text=True).stdout.split()
    return [int(p) for p in out if int(p) not in exclude]


def main():
    cmd = sys.argv[1:]
    out = cmd[cmd.index('--out') + 1] if '--out' in cmd else None
    t0 = time.time(); quiet = 0
    while quiet < 3:
        quiet = quiet + 1 if not blenders() else 0
        if time.time() - t0 > 1800:
            print('render_idle: gave up waiting for a free CPU'); break
        time.sleep(2)
    waited = round(time.time() - t0, 1)
    load1 = os.getloadavg()[0]
    p = subprocess.Popen(cmd, cwd=ROOT)
    shared = 0.0
    while p.poll() is None:
        time.sleep(2)
        if blenders(exclude=(p.pid,)):
            shared += 2.0
    print(f'render_idle: waited {waited}s, cpu shared {shared}s, load before {load1:.2f}')
    if out and os.path.exists(LOG):
        rows = open(LOG).read().splitlines()
        target = os.path.relpath(os.path.abspath(os.path.join(ROOT, out)), ROOT)
        for i in range(len(rows) - 1, -1, -1):
            r = json.loads(rows[i])
            if r.get('out') == target:
                r['cpu_shared_s'] = shared; r['load1_before'] = round(load1, 2)
                rows[i] = json.dumps(r); break
        open(LOG, 'w').write('\n'.join(rows) + '\n')
    sys.exit(p.returncode)


if __name__ == '__main__':
    main()
