"""Scroll-scrubbed films for the site, plus anchors (where each labelled part sits on screen per
frame) so the page can pin labels to the render.

    blender -b -P james-taylor/blender/films.py -- --film burger [--w 1000 --h 1250 --samples 48]
    blender -b -P james-taylor/blender/films.py -- --film steak  [--w 1600 --h 1000 --samples 48]
    (--anchors-only writes the JSON without rendering; --only N renders frame N to test_N.png)

Frames go to blender/out/film/<film>/####.png, anchors to blender/out/film/<film>/anchors.json.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402
from mathutils import Vector  # noqa: E402

import dishes  # noqa: E402
import kit  # noqa: E402

a = kit.argv()
film = a.get("film", "burger")
out = os.path.join(kit.OUT, "film", film)
os.makedirs(out, exist_ok=True)


def keyframes(obj, path, values, frames, index=-1):
    for v, f in zip(values, frames):
        if index >= 0:
            getattr(obj, path)[index] = v
            obj.keyframe_insert(path, index=index, frame=f)
        else:
            setattr(obj, path, v)
            obj.keyframe_insert(path, frame=f)


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


if film == "burger":
    N = 90
    dishes.set_up(samples=int(a.get("samples", 48)), w=int(a.get("w", 1000)), h=int(a.get("h", 1250)))
    import burger

    root, _ = dishes.stage("burger", board=False)
    layers = [(k, bpy.data.objects[n]) for k, n in zip(burger.LAYERS, ("Heel", "SauceLow", "PattyLow", "CheeseLow",
                                                                     "PattyHigh", "CheeseHigh", "SauceHigh", "Crown"))]
    base_z = {k: o.location.z for k, o in layers}
    gaps = {"heel": 0.0, "sauce_low": 0.0, "patty_low": 0.036, "cheese_low": 0.062,
            "patty_high": 0.094, "cheese_high": 0.12, "sauce_high": 0.16, "crown": 0.16}
    # assembled for the first 10 frames, opens over 10..70, held open to the end
    for f in range(1, N + 1):
        t = smooth((f - 10) / 60)
        for k, o in layers:
            o.location.z = base_z[k] + gaps[k] * t
            o.keyframe_insert("location", index=2, frame=f)
        # a slow quarter turn while it opens
        root.rotation_euler.z = math.radians(-25 + 70 * smooth((f - 1) / (N - 1)))
        root.keyframe_insert("rotation_euler", index=2, frame=f)
    top = root.location.z
    cam = kit.camera((0.0, -0.62, 0.2), (0.0, 0.0, top + 0.1), lens=70, fstop=11.0)
    # the camera rises and pulls back a touch as the stack grows
    for f in range(1, N + 1):
        t = smooth((f - 5) / 70)
        cam.location = (0.0, -0.42 - 0.2 * t, 0.1 + 0.11 * t)
        aim_at = Vector((0.0, 0.0, top + 0.035 + 0.085 * t))
        kit.aim(cam, aim_at)
        cam.data.dof.focus_distance = (cam.location - aim_at).length
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        cam.data.dof.keyframe_insert("focus_distance", frame=f)
    # a label anchor per layer: the point on its rim facing the camera's right
    probes = {}
    for k, o in layers:
        probes[k] = o
elif film == "steak":
    N = 80
    dishes.set_up(samples=int(a.get("samples", 48)), w=int(a.get("w", 1600)), h=int(a.get("h", 1000)),
                  key_pos=(-0.9, -0.1, 0.8))
    import steak

    root, _ = dishes.stage("ribeye", split=True)
    root.rotation_euler.z = math.radians(-20)
    far = bpy.data.objects["Ribeye_far"]
    near = bpy.data.objects["Ribeye_near"]
    for f in range(1, N + 1):
        t = smooth((f - 8) / 55)
        far.location = (0.07 * t, 0.012 * t, steak.H / 2)
        far.rotation_euler = (0.0, 0.0, math.radians(-38 * t))
        far.keyframe_insert("location", frame=f)
        far.keyframe_insert("rotation_euler", frame=f)
    top = root.location.z
    cam = kit.camera((0.2, -0.36, 0.26), (0.02, 0.0, top + 0.02), lens=50, fstop=5.6)
    for f in range(1, N + 1):
        t = smooth((f - 1) / (N - 1))
        cam.location = (0.22 * t + 0.02 * (1 - t), -0.42 + 0.1 * t, 0.3 - 0.14 * t)
        kit.aim(cam, (0.035 * t, 0.0, top + 0.012 + 0.008 * t))
        cam.data.dof.focus_distance = (cam.location - Vector((0.035 * t, 0.0, top + 0.015))).length
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        cam.data.dof.keyframe_insert("focus_distance", frame=f)
    probes = {"near": near, "far": far}
else:
    raise SystemExit(f"unknown film {film}")

sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, N


def anchor(o):
    """Screen position (0..1, y down) of the part's right-most visible rim point and its centre."""
    deps = bpy.context.evaluated_depsgraph_get()
    ev = o.evaluated_get(deps)
    me = ev.to_mesh()
    mw = o.matrix_world
    pts = [mw @ v.co for v in me.vertices]
    ev.to_mesh_clear()
    proj = [world_to_camera_view(sc, sc.camera, p) for p in pts]
    xs = [p.x for p in proj]
    ys = [p.y for p in proj]
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    return {"x": round(max(xs), 4), "cx": round(cx, 4), "y": round(1 - cy, 4)}


if a.get("only"):
    sc.frame_set(int(a["only"]))
    kit.render_still(os.path.join(out, "test_%04d.png" % int(a["only"])))
    raise SystemExit

anchors = {"frames": N, "parts": {k: [] for k in probes}}
for f in range(1, N + 1):
    sc.frame_set(f)
    for k, o in probes.items():
        anchors["parts"][k].append(anchor(o))
with open(os.path.join(out, "anchors.json"), "w") as fh:
    json.dump(anchors, fh, separators=(",", ":"))
print("anchors written", os.path.join(out, "anchors.json"))

if not a.get("anchors-only"):
    kit.render_anim(out, 1, N)
