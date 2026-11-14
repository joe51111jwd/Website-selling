# The words film's screen geometry, for the home page (src/wordsfilm.json):
#   first  the first film frame the page uses (29: frame 28 is the hero, which the page already has)
#   t      the film's timeline (words_film.py's T), so the page's scroll keys follow the film
#   x      for every film frame from `first`: where the subject is across the picture (0-1), so a narrow
#          screen keeps it in view
#   w, y   the subject's width (0-1 of the picture) and its [top, bottom] (0-1 down it), so an upright screen
#          can step the picture back until the subject fits (a slab being read, the whole building)
# The subject is the one thing each moment is about: the cover's stack and what lands on it, the fall, SCALING
# and the stack as they turn over, each slab while it arrives and is read, the foundation, then the building.
# Run: blender -b words.blend -P words_anchors.py -- ../src/wordsfilm.json
import bpy, json, os, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
scene = bpy.context.scene
cam = scene.camera
O = bpy.data.objects
tl = json.load(open(os.path.join(HERE, "out", "words_timeline.json")))
T, END = tl["timeline"], tl["end"]
FIRST = 29
base = [O["down"], O["side"], O["up"]]
scaling = O["scaling"]
planks = [O[n] for n in ("adding", "hiring", "launching")]
labeled = planks + [O[n] for n in ("crm", "agency", "ops", "apps", "hire12", "sops", "ai", "burn", "sku", "hire15", "meet")]
systems = [O[n] for n in ("profit", "risk", "efficiency", "quality", "roles", "systematize", "tech", "fulfillment", "content", "leads", "conversion", "retention")]
built = [o for o in O if o.name.startswith(("grow_", "spire_"))] + [O[n] for n in ("crm", "ops", "hire12", "sops", "ai", "sku")]
slab = {k: O[f"slab_{k}"] for k in ("side", "down", "up")}


def here(ob):
    return abs(ob.matrix_world.translation.z) < 50 and not ob.hide_render


def box(obs, clamp=False):
    pts = []
    for ob in obs:
        for c in ob.bound_box:
            v = world_to_camera_view(scene, cam, ob.matrix_world @ Vector(c))
            if v.z <= 0:
                continue
            x, y = v.x, 1 - v.y
            if clamp:
                x, y = min(1, max(0, x)), min(1, max(0, y))
            pts.append((x, y))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return [min(xs), min(ys), max(xs), max(ys)]


def at_rest(ob, f_rest):
    """ob as it stands at f_rest, seen from the camera now (a slab's spot while it is still on its way there)"""
    f = scene.frame_current
    scene.frame_set(f_rest)
    mw = ob.matrix_world.copy()
    scene.frame_set(f)
    return [mw @ Vector(c) for c in ob.bound_box]


def box_pts(world_pts):
    pts = []
    for p in world_pts:
        v = world_to_camera_view(scene, cam, p)
        if v.z > 0:
            pts.append((min(1, max(0, v.x)), min(1, max(0, 1 - v.y))))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return [min(xs), min(ys), max(xs), max(ys)]


def subject(f):
    if f <= 106:  # the stack, SCALING and what is piled on
        return box(base + [scaling] + [o for o in labeled if here(o)], True)
    if f <= 146:  # the fall: what is in the picture
        return box(base + labeled, True)
    if f < T["side_slab"]:  # SCALING and the stack (the wreckage is being cleared)
        return box(base + [scaling], True)
    if f < T["systems"]:  # the yellow slab arrives (the picture waits where it will stop) and is read
        return box_pts(at_rest(slab["side"], T["side_read"]))
    if f < T["down_slab"]:  # the foundation
        return box(base + [o for o in systems if here(o)], True)
    if f < T["junk"]:  # the red slab
        return box_pts(at_rest(slab["down"], T["down_read"]))
    if f < T["up_slab"]:  # the foundation, as the dead weight leaves
        return box(base + systems, True)
    if f < T["team"]:  # the green slab
        return box_pts(at_rest(slab["up"], T["up_read"]))
    if f < T["end"] - 12:  # the building
        return box(base + systems + [o for o in built if here(o) and o.matrix_world.translation.z > 2.9], True)
    return box(base + systems + [o for o in built if here(o)] + [scaling] + list(slab.values()), True)  # the last picture, all of it


raw = []
for f in range(FIRST, END + 1):
    scene.frame_set(f)
    raw.append(subject(f))
# the hand-offs between subjects are eased over a few frames either side, so the picture never jumps
n = len(raw)
x, w, y = [], [], []
for i in range(n):
    win = raw[max(0, i - 6) : i + 7]
    cx = sum((b[0] + b[2]) / 2 for b in win) / len(win)
    x.append(round(min(0.8, max(0.2, cx)), 4))
    # the width and height a narrow screen must hold: the largest of its neighbours (never enlarged past a
    # subject about to grow), a little margin round it
    w.append(round(min(1.0, max(b[2] - b[0] for b in win) + 0.03), 4))
    y.append([round(max(0.0, min(b[1] for b in win) - 0.02), 4), round(min(1.0, max(b[3] for b in win) + 0.02), 4)])
json.dump({"first": FIRST, "t": T, "x": x, "w": w, "y": y}, open(sys.argv[-1], "w"), separators=(",", ":"))
print("words anchors", n, "frames", flush=True)
for i in range(0, n, 10):
    print(FIRST + i, x[i], w[i], y[i])
