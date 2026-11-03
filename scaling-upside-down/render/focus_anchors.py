# The focus film's screen geometry, for the page (src/focusfilm.json):
#   x      for every film frame from 28: where the subject is across the picture (0-1), so the page can
#          keep it on the screen's centre line
#   y      for every film frame from 28: the subject's [top, bottom] (0-1 down the picture), so on a screen
#          wider than the picture the page can enlarge it to the full width wherever the subject still fits
#   lines  for each held moment: the outline [left, top, right, bottom] (0-1 of the picture) of the
#          blocks its line is about, so the page can set the line right beside them
# Run: blender -b focus.blend -P focus_anchors.py -- ../src/focusfilm.json
import bpy, json, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

scene = bpy.context.scene
cam = scene.camera
O = bpy.data.objects
FIRST, LAST = 28, 332
base = [O["down"], O["side"], O["up"]]
planks = [O[n] for n in ("launching", "hiring", "adding")]
labeled = [O[n] for n in ("launching", "hiring", "adding", "crm", "agency", "ops", "apps", "hire12", "sops", "ai", "burn", "sku", "hire15", "meet")]
systems = [O[n] for n in ("profit", "risk", "efficiency", "quality", "roles", "systematize", "tech", "fulfillment", "content", "leads", "conversion", "retention")]
built = [o for o in O if o.name.startswith(("grow_", "spire_"))] + [O[n] for n in ("crm", "ops", "hire12", "sops", "ai", "sku")]


def corners(ob):
    return [ob.matrix_world @ Vector(c) for c in ob.bound_box]


def here(ob):
    return ob.matrix_world.translation.z < 50 and not ob.hide_render


def box(obs, clamp=False):
    pts = []
    for ob in obs:
        for c in corners(ob):
            v = world_to_camera_view(scene, cam, c)
            if v.z <= 0:
                continue
            x, y = v.x, 1 - v.y
            if clamp:
                x, y = min(1, max(0, x)), min(1, max(0, y))
            pts.append((x, y))
    if not pts:
        return None
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return [round(min(xs), 4), round(min(ys), 4), round(max(xs), 4), round(max(ys), 4)]


def subject(f):
    if f <= 106:  # the column as it is piled on
        obs = base + [o for o in labeled if here(o)]
        clamp = False
    elif f <= 146:  # the fall: what is in the picture
        obs = base + labeled
        clamp = True
    else:  # the cover's stack, then the foundation and what is built on it
        obs = base + [o for o in systems if here(o)] + [o for o in built if here(o) and o.matrix_world.translation.z > 2.9]  # the team once it is on the systems
        clamp = False
    return box(obs, clamp)


xs, ys = [], []
for f in range(FIRST, LAST + 1):
    scene.frame_set(f)
    b = subject(f)
    xs.append((b[0] + b[2]) / 2)
    ys.append((b[1], b[3]))
# smooth the hand-offs (a block arriving from the side, the fall) so the picture never jumps
sm, sy = [], []
for i in range(len(xs)):
    w = xs[max(0, i - 6) : i + 7]
    sm.append(round(min(0.72, max(0.28, sum(w) / len(w))), 4))
# the vertical extent: the widest of its neighbours (so the picture is never enlarged past a subject about
# to grow), then eased so the zoom it allows changes gently
env = []
for i in range(len(ys)):
    wy = ys[max(0, i - 6) : i + 7]
    env.append((min(t for t, _ in wy), max(b for _, b in wy)))
for i in range(len(env)):
    we = env[max(0, i - 4) : i + 5]
    sy.append([round(sum(t for t, _ in we) / len(we), 4), round(sum(b for _, b in we) / len(we), 4)])

LINES = {  # line id: (Blender frame of its hold, the blocks it is about, clamp to the picture)
    "grow": (55, planks, False),
    "redline": (106, base + labeled, False),
    "isnt": (147, base, False),
    "upside": (163, base, False),
    "side": (223, base + systems, False),
    "down": (245, base + systems, False),
    "up": (332, base + systems + built, False),
}
lines = {}
for k, (f, obs, cl) in LINES.items():
    scene.frame_set(f)
    lines[k] = {"frame": f, "box": box(obs, cl)}
json.dump({"first": FIRST, "x": sm, "y": sy, "lines": lines}, open(sys.argv[-1], "w"), separators=(",", ":"))
print("focus anchors", len(sm), lines)
for i in range(0, len(sy), 8):
    print(FIRST + i, sy[i])
