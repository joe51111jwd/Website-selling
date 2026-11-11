"""kit/closed.png — the closed rigid box, 3/4, foil wordmark, seal no. 01/48.
   --close : tight detail camera on the lid corner (preview QA only)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

CLOSE = "--close" in argv_flags()
def _flag(name, default):
    a = argv_flags()
    return float(a[a.index(name) + 1]) if name in a else default
SEAL_SPEC = _flag("--seal-spec", 0.22)
FRONT_BOUNCE = _flag("--front-bounce", 11.0)
_a = argv_flags()
FLAG = tuple(_a[_a.index("--flag") + 1].split(",")) if "--flag" in _a else ("Rim",)
FLAG = tuple(f for f in FLAG if f)
reset()
setup_render(1600, 1600, samples=256)
kit.kit_render_budget(samples=256, threshold=0.01)
kit.kit_lighting(scale=1.5, target=(0, 0, 0.08), key=0.8, fill=0.5, hdri_strength=0.2, top=0.8, foil=0.0)
shadow_catcher()
box = kit.closed_box(number=1, edition=48)
# seal print: matte uncoated sticker stock -> a low, broad specular so the key light's
# reflection does not wash the cobalt toward violet/periwinkle (lit face ~ #2B3BFF)
sm = bpy.data.materials.get("seal_01_48")
if sm:
    bs = sm.node_tree.nodes["Principled BSDF"]
    bs.inputs["Specular IOR Level"].default_value = SEAL_SPEC
    bs.inputs["Roughness"].default_value = 0.75

el, az = math.radians(31), math.radians(34)
if CLOSE:
    tgt, dist, lens = (0.12, -0.08, 0.13), 0.75, 100
else:
    tgt, dist, lens = (0.0, 0.0, 0.05), 1.80, 85
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
kit.foil_glint(loc, (0.0, 0.0, kit.CLOSED_H), dist=1.2, size=(0.5, 0.3), strength=2.4)
kit.wrap_sheen(loc, (0.0, 0.0, kit.CLOSED_H), dist=3.0, size=(2.6, 1.4), energy=26)
# the bone floor in front of the box (key-lit) is what the soft-touch front face mirrors in a
# real shot; the catcher is not glossy-visible, so a soft card on that mirror path (front-left,
# below the floor plane, wraps only, blocked by nothing else) stands in for it. Keeps the
# key-side front face reading lighter than the rim-side +X face, and the lid/base seam crisp.
wraps = [o for o in kit._descendants(box) if o.name.startswith(("KitLid_shell", "KitBase_shell"))]
if FRONT_BOUNCE > 0:
    wc = kit._collection("kit_closed_wrap", wraps, "INCLUDE")
    fb = area_light("FrontBounce", (-0.72, -1.43, -0.62), (0.0, -0.18, 0.08), size=1.6, size_y=0.7,
                    energy=FRONT_BOUNCE, color=(0.98, 0.99, 1.0))
    fb.visible_camera = False
    fb.light_linking.receiver_collection = wc
    fb.light_linking.blocker_collection = wc
# photographic flag: the grazing back-right rim adds nothing to the flat seal but extra
# irradiance, which pushes the cobalt print into the view transform's highlight
# compression (reads violet). Flag it off the seal only.
kit.link_kit_lights(flag_seals=FLAG)
if not CLOSE:
    kit.cutout_edge_fade()
render_to("kit/closed_close.png" if CLOSE else "kit/closed.png")
