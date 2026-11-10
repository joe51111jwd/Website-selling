"""kit/stack.png — the edition: 12 closed, numbered boxes in three slightly imperfect towers."""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

reset()
setup_render(1800, 1800, samples=256, exposure=0.25)
kit.kit_render_budget(samples=112, threshold=0.015)
kit.kit_lighting(scale=2.6, target=(0, 0, 0.45), key=0.85, fill=0.7, hdri_strength=0.2)
shadow_catcher(size=40)
rnd = random.Random(48)
towers = [  # (x, y, base rotation deg, count)
    (-0.262, 0.06, 1.5, 6),
    (0.262, 0.02, -2.5, 5),
    (0.05, -0.50, 14.0, 1),      # one box pulled forward: its seal + foil read up close
]
n = 0
for tx, ty, trot, count in towers:
    z = 0.0
    for k in range(count):
        n += 1
        b = kit.closed_box(number=n, edition=48)
        b.location = (tx + rnd.uniform(-0.007, 0.007), ty + rnd.uniform(-0.006, 0.006), z)
        b.rotation_euler = (0, 0, math.radians(trot + rnd.uniform(-1.8, 1.8)))
        z += kit.CLOSED_H
el, az = math.radians(24), math.radians(32)
tgt, dist, lens = (0.0, -0.12, 0.44), 4.1, 85
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
render_to("kit/stack.png")
