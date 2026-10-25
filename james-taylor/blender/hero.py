"""The hero still: the Chicago Cut Ribeye lit the way it cooks, from above, by a broiler at about
900 degrees. Transparent background: on the site, live WebGL flames roll across the top of the
screen and this steak sits under them.

    blender -b -P james-taylor/blender/hero.py -- [--w 1800 --h 1100 --samples 128 --out path.png]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402,F401

import kit  # noqa: E402
import steak  # noqa: E402

a = kit.argv()
kit.reset(samples=int(a.get("samples", 128)), transparent=True)
kit.resolution(int(a.get("w", 1800)), int(a.get("h", 1100)))
kit.world("studio_small_09", strength=0.06)
kit.shadow_catcher(size=2.0)

# cut through, the far half eased away so the medium-rare inside faces the camera
root, objs = steak.build(split=True)
root.rotation_euler.z = math.radians(-8)
far = objs["far"]
far.location.x += 0.045
far.location.y -= 0.006
far.rotation_euler.z = math.radians(-32)

# the broiler: a big hot panel straight overhead
kit.area("Broiler", (0.0, 0.03, 0.42), (0, 0, 0), size=0.5, size_y=0.32, power=14, color=(1.0, 0.8, 0.6))
# rims from behind pick out the crust's edge and the fat
kit.area("RimL", (-0.42, 0.42, 0.14), (0, 0, 0.02), size=0.25, power=5, color=(1.0, 0.78, 0.55))
kit.area("RimR", (0.45, 0.38, 0.1), (0, 0, 0.02), size=0.2, power=4, color=(1.0, 0.55, 0.25))
# a little cool fill so the shadow side isn't dead
kit.area("Fill", (0.1, -0.7, 0.2), (0, 0, 0.02), size=0.8, power=0.8, color=(0.75, 0.82, 1.0))
kit.area("Face", (0.5, -0.25, 0.16), (0.02, 0, 0.015), size=0.3, power=3.5, color=(1.0, 0.9, 0.8))
kit.camera((0.16, -0.44, 0.2), (0.025, 0.0, 0.014), lens=60, fstop=5.6)

out = a.get("out", os.path.join(kit.OUT, "hero", "ribeye.png"))
kit.render_still(out)
