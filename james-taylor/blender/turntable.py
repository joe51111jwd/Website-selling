"""Turntable for one dish: the dish spins a full turn under fixed lights, so the highlights travel
across it like they would under a pass light. The site lets visitors drag through the frames.

    blender -b -P james-taylor/blender/turntable.py -- --dish burger [--frames 48 --w 900 --h 900 --samples 48]
    (--only 1 renders a single frame, for framing checks)

Writes blender/out/turn/<dish>/0001.png ... (transparent PNG; resumable).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402

import dishes  # noqa: E402
import kit  # noqa: E402

a = kit.argv()
dish = a["dish"]
n = int(a.get("frames", 48))
dishes.set_up(samples=int(a.get("samples", 48)), w=int(a.get("w", 900)), h=int(a.get("h", 900)))
root, (cam_loc, target, lens) = dishes.stage(dish, round=True, split=dish == "ribeye")


def fit_camera(root, cam_loc, target, lens, margin=1.06):
    """Frame the whole turn: everything the dish sweeps lies in a cylinder around the spin axis;
    keep the camera's elevation from the stage, and pull in until that cylinder just fits."""
    from mathutils import Vector
    bpy.context.view_layer.update()
    axis = root.matrix_world.translation
    deps = bpy.context.evaluated_depsgraph_get()
    rmax, zmin, zmax = 0.0, 1e9, -1e9
    for o in bpy.context.scene.objects:
        if o.type not in ("MESH", "CURVE") or o.is_shadow_catcher or o.hide_render:
            continue
        ev = o.evaluated_get(deps)
        try:
            me = ev.to_mesh()
        except RuntimeError:
            continue
        mw = o.matrix_world
        for v in me.vertices:
            p = mw @ v.co
            rmax = max(rmax, (Vector((p.x, p.y)) - Vector((axis.x, axis.y))).length)
            zmin, zmax = min(zmin, p.z), max(zmax, p.z)
        ev.to_mesh_clear()
    center = Vector((axis.x, axis.y, (zmin + zmax) / 2))
    view = (Vector(cam_loc) - Vector(target)).normalized()
    elev = math.asin(max(-1.0, min(1.0, view.z)))
    # the cylinder seen from this elevation: width 2R, height h*cos(elev) + 2R*sin(elev)
    h = zmax - zmin
    half_w = rmax
    half_h = (h * math.cos(elev) + 2 * rmax * math.sin(elev)) / 2
    fov = 2 * math.atan(36 / 2 / lens)
    d = max(half_w, half_h) * margin / math.tan(fov / 2) + rmax * math.cos(elev) * 0.5
    return kit.camera(tuple(center + view * d), tuple(center), lens=lens, fstop=float(a.get("fstop", 8.0)))


fit_camera(root, cam_loc, target, float(a.get("lens", lens)), margin=float(a.get("margin", 1.06)))

# one full turn over n frames, linear, so frame n+1 would equal frame 1
z0 = root.rotation_euler.z
root.rotation_euler.z = z0
root.keyframe_insert("rotation_euler", index=2, frame=1)
root.rotation_euler.z = z0 + math.tau
root.keyframe_insert("rotation_euler", index=2, frame=n + 1)
for fc in root.animation_data.action.fcurves:
    for k in fc.keyframe_points:
        k.interpolation = "LINEAR"

out = a.get("out", os.path.join(kit.OUT, "turn", dish))
if a.get("only"):
    bpy.context.scene.frame_set(int(a["only"]))
    kit.render_still(os.path.join(out, "test_%04d.png" % int(a["only"])))
else:
    kit.render_anim(out, 1, n)
