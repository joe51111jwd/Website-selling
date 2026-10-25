# Export per-frame screen positions of key blocks so the website can pin labels to them.
import bpy, json, sys
from bpy_extras.object_utils import world_to_camera_view
scene = bpy.context.scene
cam = scene.camera
names = ["down", "side", "up", "hire6", "slack", "hire9", "crm", "agency", "ops", "apps", "hire12", "sops", "ai", "burn", "sku", "hire15", "meet", "retention", "profit", "content", "spire_3"]
out = {"frames": [], "names": names}
for f in range(1, scene.frame_end + 1):
    scene.frame_set(f)
    row = {}
    for n in names:
        v = world_to_camera_view(scene, cam, bpy.data.objects[n].matrix_world.translation)
        row[n] = [round(v.x, 3), round(1 - v.y, 3)]  # fractions of the frame, y down
    out["frames"].append(row)
json.dump(out, open(sys.argv[-1], "w"), separators=(",", ":"))
print("anchors", len(out["frames"]))
