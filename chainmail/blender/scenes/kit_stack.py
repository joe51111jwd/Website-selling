"""kit/stack.png — the edition: 12 closed, numbered boxes in two slightly imperfect
towers plus one box pulled forward so its seal and chrome foil read up close."""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
from mathutils import Vector
import kit

reset()
setup_render(1800, 1800, samples=256)
kit.kit_render_budget(samples=256, threshold=0.01)
kit.kit_lighting(scale=2.6, target=(0, 0, 0.45), key=0.85, fill=1.4, hdri_strength=0.2, foil=0.0, top=0.8)
cat = shadow_catcher(size=40)
# the bone floor must not mirror in the soft-touch faces: box 12 would print a dark
# wedge-shaped reflection onto the left tower's front faces
cat.visible_glossy = False
rnd = random.Random(48)
towers = [  # (x, y, base rotation deg, count)
    (-0.275, 0.06, 1.5, 6),
    (0.275, 0.02, -2.5, 5),
    (0.05, -0.50, 14.0, 1),      # one box pulled forward: its seal + foil read up close
]
JIT_XY, JIT_ROT = 0.006, 1.0
boxes = []   # (number, x, y, rot_deg, z0)
n = 0
for tx, ty, trot, count in towers:
    z = 0.0
    for k in range(count):
        n += 1
        x, y = tx + rnd.uniform(-JIT_XY, JIT_XY), ty + rnd.uniform(-JIT_XY, JIT_XY)
        r = trot + rnd.uniform(-JIT_ROT, JIT_ROT)
        b = kit.closed_box(number=n, edition=48)
        if count == 1:
            front_box = b
        b.location = (x, y, z)
        b.rotation_euler = (0, 0, math.radians(r))
        boxes.append((n, x, y, r, z))
        z += kit.CLOSED_H

# ---- separating-axis check: no lid/base footprint overlap between boxes at the same height
def rect(x, y, rdeg, w=kit.LID_W + 0.001, d=kit.LID_D + 0.001):
    a = math.radians(rdeg); c, s = math.cos(a), math.sin(a)
    return [(x + c * px - s * py, y + s * px + c * py) for px, py in
            ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2))]
def overlap(p, q):
    for poly in (p, q):
        for i in range(4):
            x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % 4]
            ax, ay = y1 - y2, x2 - x1
            pa = [ax * vx + ay * vy for vx, vy in p]; qa = [ax * vx + ay * vy for vx, vy in q]
            if max(pa) < min(qa) or max(qa) < min(pa):
                return False
    return True
for i in range(len(boxes)):
    for j in range(i + 1, len(boxes)):
        a, b_ = boxes[i], boxes[j]
        if abs(a[4] - b_[4]) < kit.CLOSED_H - 1e-6:     # vertically overlapping
            assert not overlap(rect(*a[1:4]), rect(*b_[1:4])), f"boxes {a[0]} and {b_[0]} intersect"
print("[kit_stack] footprint check passed:", len(boxes), "boxes")

el, az = math.radians(24), math.radians(32)
tgt, dist, lens = (0.061, -0.082, 0.393), 4.1, 85
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
# foil glints (camera-invisible, foil-only) on the mirror path of every visible lid top,
# and a soft-touch sheen card for the tops (wrap shells only)
tops = {}
for num, x, y, r, z in boxes:
    tops[(round(x, 1), round(y, 1))] = (num, x, y, z)
for i, (num, x, y, z) in enumerate(tops.values()):
    p = (x, y, z + kit.CLOSED_H)
    kit.foil_glint(loc, p, dist=0.3 if num == 12 else 1.0, size=(0.9, 0.3) if num == 12 else (0.6, 0.3),
                   strength=2.6, name=f"FoilGlint_{num:02d}")
kit.wrap_sheen(loc, (0.0, 0.0, 0.5), dist=6.0, size=(4.0, 2.4), energy=110)
# stand-in for the bone floor's glossy bounce (the real one is off, see above): a big soft
# card on the mirror path of the towers' front faces, wraps only, shadowless
# (swung out to the left so box 12 never sits between it and the towers' front faces)
area_light("WrapSheen_floor", (-2.6, -1.7, 0.15), (-0.27, -0.15, 0.45), size=3.0,
           size_y=2.0, energy=260, color=(1.0, 0.98, 0.95))
# the right tower's +X faces mirror the (glossy-invisible) floor back-right: a low soft card there
# (a floor-level, upward-facing emitter: it reads like the bone floor's own bounce, brighter low)
area_light("WrapSheen_right", (1.55, 1.25, 0.005), (1.55, 1.25, 1.0), size=2.2, size_y=2.2, energy=35,
           color=(1.0, 0.98, 0.95))
# box 12's walls mirror the floor (front) and the right tower's dark base (+X side); the
# catcher is glossy-invisible (see above), so give them their own soft bounce cards, linked
# to box 12's wrap only and blocked by nothing else -> lid skirt / base seam read on both faces
fb_shells = [o for o in kit._descendants(front_box) if o.name.startswith(("KitLid_shell", "KitBase_shell"))]
fb_col = kit._collection("kit_front_box_wrap", fb_shells, "INCLUDE")
fx, fy = front_box.location.x, front_box.location.y
for nm, l_loc, energy in (("FrontBounce", (fx + 0.05, fy - 1.6, 0.12), 28.0),
                          ("SideBounce", (fx + 0.45, fy + 1.4, 0.12), 22.0)):
    lb = area_light(nm, l_loc, (fx, fy, 0.08), size=1.4, size_y=0.5, energy=energy, color=(1.0, 0.98, 0.96))
    lb.visible_camera = False
    lb.light_linking.receiver_collection = fb_col
    lb.light_linking.blocker_collection = fb_col
kit.link_kit_lights(shadowless=("Fill", "WrapSheen_floor", "WrapSheen_right"))
kit.cutout_edge_fade()
render_to("kit/stack.png")
