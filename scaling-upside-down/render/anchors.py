# Export per-frame screen positions of key blocks so the website can pin labels to them.
import bpy, json, sys
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
scene = bpy.context.scene
cam = scene.camera
names = ["down", "side", "up", "hire6", "slack", "hire9", "crm", "agency", "ops", "apps", "hire12", "sops", "ai", "burn", "sku", "hire15", "meet", "systems"]
out = {"frames": [], "names": names}
for f in range(1, scene.frame_end + 1):
    scene.frame_set(f)
    row = {}
    stack_top = 0.0
    for n in names:
        ob = bpy.data.objects[n]
        p = ob.matrix_world.translation.copy()
        v = world_to_camera_view(scene, cam, p)
        row[n] = [round(v.x, 4), round(1 - v.y, 4), round(p.z, 3)]
        if abs(p.x) < 1.2 and abs(p.y) < 1.2 and p.z < 40:
            stack_top = max(stack_top, p.z + 0.5)
    t = world_to_camera_view(scene, cam, Vector((0, 0, stack_top)))
    b = world_to_camera_view(scene, cam, Vector((0, 0, 0)))
    row["top"] = [round(t.x, 4), round(1 - t.y, 4), round(stack_top, 3)]
    row["base"] = [round(b.x, 4), round(1 - b.y, 4), 0]
    out["frames"].append(row)
json.dump(out, open(sys.argv[-1], "w"))
print("anchors", len(out["frames"]))
