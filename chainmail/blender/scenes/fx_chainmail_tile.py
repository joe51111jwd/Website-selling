"""
fx_chainmail_tile — bakes the hero's chainmail as a seamless tile for the WebGL shader.

The site's hero field (site/src/fx/shaders/chrome.js) is real European 4-in-1 mail: rows of leaning
torus links, alternate rows leaning the other way and offset half a pitch, so each link threads two
links above and two below. Here that weave is built as actual tori (parameters from tools/solve_weave.py; site/src/fx/effects/
chrome.js TILE.size must match the tile extent printed below), then three orthographic top-down passes
are rendered over exactly one period of it:

  normal    world-space shading normal, encoded n*0.5+0.5      -> R, G (z is rebuilt in the shader)
  ao        ambient occlusion of links + the floor under them  -> B
  coverage  1 on wire, 0 on the floor seen through the gaps    -> A

tools/pack_chainmail_tile.py packs them into site/public/fx/chainmail-tile.webp (lossless RGBA).
The shader keeps its own studio environment, BRDF, cloth folds and cursor ripples, and just reads
this tile for the micro-geometry, so every ring is drawn closed, with true over/under occlusion.

    blender -b --factory-startup --python-exit-code 1 -P chainmail/blender/scenes/fx_chainmail_tile.py
    blender ... -- --beauty     # also a perspective chrome preview of the weave (out/fx/beauty.png)
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *

# weave (link units): defaults solved by tools/solve_weave.py; override with -- --weave TH PSI SX SY
RR, RW = 1.0, 0.18
TH, PSI, SX, SY = 0.457, 0.0, 1.273, 1.349
flags = argv_flags()
if "--weave" in flags:
    i = flags.index("--weave")
    TH, PSI, SX, SY = (float(v) for v in flags[i + 1:i + 5])


def opt(name, default):
    return type(default)(flags[flags.index(name) + 1]) if name in flags else default


RES_X = opt("--res", 1024)
PASSES = opt("--passes", "normal,coverage,ao").split(",")
AO_SPP = opt("--ao-spp", 96)
OUT = opt("--out", "fx")
# tile = whole periods (x period SX, y period 2*SY), as close to square as possible
KX = max(1, round(4.4 / SX))
KY = max(1, round(KX * SX / (2 * SY)))
TW, TH_ = KX * SX, KY * 2 * SY
RES_Y = round(RES_X * TH_ / TW)          # square pixels
FLOOR_Z = -RR * math.sin(TH) - RW - 0.35
print(f"[tile] weave TH={TH} PSI={PSI} SX={SX} SY={SY}  tile {TW:.4f} x {TH_:.4f}  {RES_X}x{RES_Y}")

reset()
s = setup_render(RES_X, RES_Y, samples=64, transparent=False, preview=False)

# ---------------------------------------------------------------- geometry
bpy.ops.mesh.primitive_torus_add(major_radius=RR, minor_radius=RW, major_segments=160, minor_segments=32)
proto = bpy.context.active_object
proto.name = "link_proto"
bpy.ops.object.shade_smooth()
mesh = proto.data
bpy.data.objects.remove(proto)

links = bpy.data.collections.new("links")
s.collection.children.link(links)
for r in range(-4, 2 * KY + 5):
    odd = r % 2
    sgn = -1.0 if odd else 1.0
    ox = odd * 0.5 * SX
    for c in range(-4, KX + 5):
        o = bpy.data.objects.new(f"link_{r}_{c}", mesh)
        o.location = (c * SX + ox, r * SY, 0.0)
        # local frame: ring in XY, lean about Y so x -> x cos(TH), z -> s * x sin(TH); then yaw by s * PSI
        o.rotation_euler = Euler((0.0, -sgn * TH, sgn * PSI), "XYZ")
        links.objects.link(o)

bpy.ops.mesh.primitive_plane_add(size=60, location=(TW / 2, TH_ / 2, FLOOR_Z))
floor_obj = bpy.context.active_object
floor_obj.name = "floor"


# ---------------------------------------------------------------- pass materials
def emit_mat(name, build):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.0
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    build(nt, em.inputs["Color"])
    return m


def build_normal(nt, sock):
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    ma = nt.nodes.new("ShaderNodeVectorMath"); ma.operation = "MULTIPLY_ADD"
    ma.inputs[1].default_value = (0.5, 0.5, 0.5)
    ma.inputs[2].default_value = (0.5, 0.5, 0.5)
    nt.links.new(geo.outputs["Normal"], ma.inputs[0])
    nt.links.new(ma.outputs[0], sock)


def build_ao(nt, sock):
    ao = nt.nodes.new("ShaderNodeAmbientOcclusion")
    ao.samples = 8
    ao.inputs["Distance"].default_value = 0.9
    nt.links.new(ao.outputs["AO"], sock)


def const(v):
    def b(nt, sock):
        sock.default_value = (v, v, v, 1.0)
    return b


M_NORMAL = emit_mat("p_normal", build_normal)
M_AO = emit_mat("p_ao", build_ao)
M_ONE = emit_mat("p_one", const(1.0))
M_ZERO = emit_mat("p_zero", const(0.0))


def set_mats(link_mat, floor_mat):
    mesh.materials.clear(); mesh.materials.append(link_mat)
    floor_obj.data.materials.clear(); floor_obj.data.materials.append(floor_mat)


# ---------------------------------------------------------------- data passes: ortho, raw, no denoise
c = s.cycles
c.use_denoising = False
c.use_adaptive_sampling = False
c.max_bounces = 1
c.diffuse_bounces = 0
c.glossy_bounces = 0
s.render.filter_size = 1.0
s.view_settings.view_transform = "Raw"
s.render.image_settings.file_format = "PNG"
s.render.image_settings.color_mode = "RGB"
s.render.image_settings.color_depth = "16"
s.world = bpy.data.worlds.new("black")
s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0

camera(loc=(TW / 2, TH_ / 2, 12.0), target=(TW / 2, TH_ / 2, 0.0), ortho_scale=max(TW, TH_))
s.camera.rotation_euler = (0.0, 0.0, 0.0)   # exact top-down, image x = world x, image up = world y

for name, lm, fm, spp in (("normal", M_NORMAL, M_NORMAL, 32),
                          ("coverage", M_ONE, M_ZERO, 32),
                          ("ao", M_AO, M_AO, AO_SPP)):
    if name not in PASSES:
        continue
    set_mats(lm, fm)
    c.samples = spp
    render_to(f"{OUT}/chainmail_{name}.png", also_preview=False)

# ---------------------------------------------------------------- optional beauty check
if "--beauty" in flags:
    s2 = setup_render(1200, 800, samples=96, transparent=False, preview=False)
    set_mats(mat_chrome(rough=0.12), mat_matte("ink", 0.8, name="floorink"))
    cam = camera(loc=(TW / 2, TH_ / 2 - 6.5, 9.0), target=(TW / 2, TH_ / 2 + 1.0, 0.0), lens=50)
    studio("contrast", key=1.0, hdri_strength=0.5, target=(TW / 2, TH_ / 2, 0.0), scale=3.0)
    render_to(f"{OUT}/beauty.png", also_preview=False)
