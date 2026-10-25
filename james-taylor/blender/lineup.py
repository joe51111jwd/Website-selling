"""The pass: all five signatures in a row, as they'd sit under the heat lamps before going out.
One transparent still for the top of the site.

    blender -b -P james-taylor/blender/lineup.py -- [--w 2400 --h 1000 --samples 64 --out path.png]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402,F401

import dishes  # noqa: E402
import kit  # noqa: E402
import studio  # noqa: E402

a = kit.argv()
kit.reset(samples=int(a.get("samples", 64)), transparent=True)
kit.resolution(int(a.get("w", 2400)), int(a.get("h", 1000)))
kit.world("studio_small_09", strength=0.2)
kit.shadow_catcher(size=6.0)

# left to right; the chicken goes first because it drops into its bowl and ray-casts the scene
ORDER = [("chicken", 0.66, 0.02, 0), ("pie", -0.64, 0.0, -20), ("latkes", -0.33, 0.03, 15),
         ("ribeye", 0.0, -0.02, 8), ("burger", 0.34, 0.0, 30)]
for name, x, y, rot in ORDER:
    root, _ = dishes.stage(name, round=True)
    root.location.x += x
    root.location.y += y
    root.rotation_euler.z += math.radians(rot)

# heat lamps along the pass, warm key behind, low warm kicker
for i, x in enumerate((-0.6, -0.2, 0.2, 0.6)):
    kit.area(f"Lamp{i}", (x, 0.15, 0.75), (x, 0.0, 0.0), size=0.35, power=7, color=(1.0, 0.8, 0.58))
kit.area("Back", (0.0, 0.9, 0.5), (0, 0, 0.03), size=1.6, size_y=0.4, power=14, color=(1.0, 0.88, 0.75))
kit.area("Front", (0.0, -1.6, 0.35), (0, 0, 0.04), size=2.0, size_y=0.5, power=4, color=(0.95, 0.9, 0.86))
kit.area("Kick", (-1.2, -0.4, 0.1), (0, 0, 0.04), size=0.6, power=3, color=(1.0, 0.6, 0.3))
kit.camera((0.0, -1.7, 0.6), (0.0, 0.0, 0.03), lens=36, fstop=11.0)

out = a.get("out", os.path.join(kit.OUT, "lineup", "lineup.png"))
kit.render_still(out)
