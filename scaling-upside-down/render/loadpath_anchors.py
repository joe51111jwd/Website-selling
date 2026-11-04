# The focus film's screen geometry, for the page (src/lpfilm.json), from loadpath.blend:
#   x  for every frame: where the subject is across the picture (0-1), so the page keeps it on the
#      screen's centre line when the picture is wider than the screen (an upright phone)
#   y  for every frame: the subject's [top, bottom] (0-1 down the picture), so on a screen wider than the
#      picture the page can enlarge it to the full width wherever the subject still fits (a top below 0 is a
#      subject cut by the picture's top, and is only ever below 0 in the frames where it is)
#   w  for every frame: the subject's [left, right], so on an upright screen the page can make the picture
#      smaller where the subject is wide (the rubble), and keep all of it in view (the raft counts only until
#      the core rises: after that it is the ground the tower stands on, and may run off a phone's sides)
# The subject: the pile (and, as it falls, what is in the picture); then the raft, the core and the tower
# (the walls once they are close, the annex while it is on the tower).
# Run: blender -b loadpath.blend -P loadpath_anchors.py -- ../src/lpfilm.json
import bpy, json, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

scene = bpy.context.scene
cam = scene.camera
O = bpy.data.objects
END = scene.frame_end
PT = 0.16


def corners(ob):
    return [ob.matrix_world @ Vector(c) for c in ob.bound_box]


def shown(ob):
    return not ob.hide_render and ob.matrix_world.to_scale().z > 0.02 and max(c.z for c in corners(ob)) > PT + 0.005


def box(obs, clamp):
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
    return [min(xs), min(ys), max(xs), max(ys)]


act1 = [o for o in O if o.name.startswith(("pile", "annex")) and o.type == "MESH"]
tower = [o for o in O if o.name.startswith(("storey", "core", "roof", "raft")) and o.type == "MESH"]
walls = [o for o in O if o.name.startswith("wall") and o.type == "MESH"]
bolts = [o for o in O if o.name.startswith("bolt") and o.type == "MESH"]

raw = []
across = []  # the subject's [left, right] box (the raft leaves it once the core rises: it is the ground, not the work)
for f in range(1, END + 1):
    scene.frame_set(f)
    # (a piece that slid off the board, far out of the picture, is not part of what is seen)
    a = [o for o in act1 if shown(o) and -0.08 < world_to_camera_view(scene, cam, o.matrix_world.translation).x < 1.08]
    if a:
        obs, clamp = a, True
        wide = obs
    else:
        obs = [o for o in tower if shown(o)]
        obs += [w for w in walls if shown(w) and abs(w.matrix_world.translation.x) < 1.6]
        obs += [b for b in bolts if shown(b) and b.matrix_world.translation.z > PT + 0.3]
        clamp = False
        wide = [o for o in obs if not o.name.startswith("raft")] or obs
    b = box(obs, clamp) if obs else None
    raw.append(b)
    across.append(box(wide, clamp) if wide else None)
# frames with nothing standing (the site just cleared) take the nearest frame that has something
for seq in (raw, across):
    for i, b in enumerate(seq):
        if b is None:
            j = next((k for k in range(i + 1, len(seq)) if seq[k]), None)
            seq[i] = seq[j] if j is not None else seq[i - 1]

xs = [(b[0] + b[2]) / 2 for b in across]
ys = [(b[1], b[3]) for b in raw]
ws = [(b[0], b[2]) for b in across]
sx = []
for i in range(len(xs)):
    w = xs[max(0, i - 6): i + 7]
    sx.append(round(min(0.7, max(0.3, sum(w) / len(w))), 4))
env = []
for i in range(len(ys)):
    w = ys[max(0, i - 6): i + 7]
    env.append((min(t for t, _ in w), max(b for _, b in w)))
sy = []
for i in range(len(env)):
    w = env[max(0, i - 4): i + 5]
    sy.append([round(sum(t for t, _ in w) / len(w), 4), round(sum(b for _, b in w) / len(w), 4)])
# a subject cut by the picture's top (a core climbing out of it, t < 0) is cut only in the frames where it is: the
# smoothing above reaches 10 frames either side, so within twice that of a cut every frame still in the picture
# takes its own top (or the page would treat it as cut too, keeping no room for the menu while its top is in plain
# view, or as higher than it is where the smoothing still reaches the frames where it comes back into view)
CUT = [i for i, (t, _) in enumerate(ys) if t < 0]
for i in range(len(sy)):
    if ys[i][0] >= 0 and any(abs(i - j) <= 20 for j in CUT):
        sy[i][0] = round(ys[i][0], 4)
# the subject's [left, right] the same way (so an upright screen can keep all of it in view)
envw = []
for i in range(len(ws)):
    w = ws[max(0, i - 6): i + 7]
    envw.append((min(l for l, _ in w), max(r for _, r in w)))
sw = []
for i in range(len(envw)):
    w = envw[max(0, i - 4): i + 5]
    sw.append([round(sum(l for l, _ in w) / len(w), 4), round(sum(r for _, r in w) / len(w), 4)])
json.dump({"first": 1, "x": sx, "y": sy, "w": sw, "timeline": scene.get("timeline", "")}, open(sys.argv[-1], "w"), separators=(",", ":"))
print("lp anchors", len(sx))
for i in range(0, len(sx), 20):
    print(i + 1, sx[i], sy[i])
