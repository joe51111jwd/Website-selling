"""Look-dev stills for one dish.

    blender -b -P james-taylor/blender/look.py -- --dish steak --out /tmp/steak.png [--w 900 --h 700 --samples 48]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402

import kit  # noqa: E402
import studio  # noqa: E402

a = kit.argv()
dish = a.get("dish", "steak")
kit.reset(samples=int(a.get("samples", 48)), transparent=not a.get("opaque"))
kit.resolution(int(a.get("w", 900)), int(a.get("h", 700)))
kit.world("studio_small_09", strength=float(a.get("world", 0.25)))
studio.lights(fire=float(a.get("fire", 0.5)), key=float(a.get("key", 1.0)),
              key_pos=tuple(float(v) for v in a.get("keypos", "-0.85,0.45,0.75").split(",")))
kit.shadow_catcher()

if dish == "steak":
    import steak
    b, top = studio.board(rot=math.radians(-8))
    root, objs = steak.build(split=bool(a.get("split")))
    root.location.z = top
    root.rotation_euler.z = math.radians(float(a.get("rot", 15)))
    if "far" in objs:
        f = objs["far"]
        f.location.x += float(a.get("pull", 0.035))
        f.rotation_euler.z = math.radians(float(a.get("twist", -28)))
    kit.camera((float(a.get("camx", 0.05)), float(a.get("camy", -0.5)), float(a.get("camz", 0.2))), (0.0, 0.0, top + 0.012), lens=float(a.get("lens", 75)), fstop=5.6)

if dish == "burger":
    import burger
    b, top = studio.board(rot=math.radians(-8))
    root, layers = burger.build()
    root.location.z = top
    root.rotation_euler.z = math.radians(float(a.get("rot", 0)))
    burger.explode(layers, float(a.get("explode", 0)))
    tz = top + 0.04 + 0.08 * float(a.get("explode", 0))
    kit.camera((float(a.get("camx", 0.0)), float(a.get("camy", -0.42)), float(a.get("camz", 0.12))),
               (0.0, 0.0, tz), lens=float(a.get("lens", 85)), fstop=5.6)

if dish == "latkes":
    import latkes
    root, objs = latkes.build(studio.stoneware() if a.get("darkplate") else None)
    root.rotation_euler.z = math.radians(float(a.get("rot", 0)))
    kit.camera((float(a.get("camx", 0.0)), float(a.get("camy", -0.3)), float(a.get("camz", 0.2))),
               (0.0, 0.0, 0.02), lens=float(a.get("lens", 70)), fstop=5.6)

if dish == "chicken":
    import chicken
    root, objs = chicken.build()
    root.rotation_euler.z = math.radians(float(a.get("rot", 0)))
    kit.camera((float(a.get("camx", 0.0)), float(a.get("camy", -0.3)), float(a.get("camz", 0.24))),
               (0.0, 0.0, 0.035), lens=float(a.get("lens", 70)), fstop=5.6)

if dish == "pie":
    import pie
    root, objs = pie.build(studio.stoneware() if a.get("darkplate") else None)
    root.rotation_euler.z = math.radians(float(a.get("rot", -35)))
    kit.camera((float(a.get("camx", 0.0)), float(a.get("camy", -0.3)), float(a.get("camz", 0.18))),
               (0.0, 0.0, 0.025), lens=float(a.get("lens", 70)), fstop=5.6)

az = math.radians(float(a.get("az", 0)))
if az:
    cam = bpy.context.scene.camera
    from mathutils import Matrix
    cam.matrix_world = Matrix.Rotation(az, 4, "Z") @ cam.matrix_world

if a.get("blend"):
    bpy.ops.wm.save_as_mainfile(filepath=a["blend"])
kit.render_still(a.get("out", "/tmp/look.png"))
