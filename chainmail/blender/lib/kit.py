"""
chainmail kit packaging — rigid two-piece box, insert, tissue, note card, seal,
the "your product" stand-in, and the packed-kit assembly.

Conventions (same as every lib in blender/lib):
  * metres, Z up, every builder returns ONE root object whose origin is the base
    centre of the thing, resting on Z=0, front facing -Y. Builders never create
    cameras/lights or render.
  * box-local coordinates (SLOTS, packed_box): origin = centre of the base's
    underside, X across the 0.50 m width, Y across the 0.36 m depth (front = -Y).

Public API
  box_base()                        -> Empty  (ink rigid tray 0.50 x 0.36 x 0.15, cobalt liner)
  lid(number=1, edition=48)         -> Empty  (0.506 x 0.366 x 0.06, foil wordmark; number=None -> no seal)
  insert()                          -> Mesh   (bone molded-pulp insert, sits on the base floor)
  tissue(w, d, depth, seed)         -> Mesh   (crumpled cobalt tissue lining a bay)
  tissue_puff(size, seed)           -> Mesh   (crumpled cobalt tissue wad to fill gaps)
  note_card(text=(...), number=1)   -> Mesh   (5x7 in bone cotton card, letterpress, cobalt painted edge)
  seal(number=1, edition=48)        -> Mesh   (Ø60 mm cobalt sticker, "no. 01/48" in Geist Mono, bone ink)
  your_product()                    -> Empty  (two slim 250 ml cans in a cobalt/bone sleeve, upright)
  closed_box(number=1, edition=48)  -> Empty  (base + seated lid, empty inside — for closed/stack shots)
  SLOTS                             dict name -> (x, y, z, rot_z_deg) in box-local coords
  place(obj, name, parent=None)     put any item builder's root into its slot (handles lying items)
  packed_box(open=True, ...)        -> Empty  (everything assembled; lid leaning behind when open)
"""
import bpy, bmesh, math, os, sys, json, random, shutil, subprocess, hashlib
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
from common import *  # noqa: F401,F403
import common as _c

TEX_DIR = os.path.join(ASSETS, "textures")
os.makedirs(TEX_DIR, exist_ok=True)

# ---------------------------------------------------------------- dimensions (m)
BOX_W, BOX_D, BOX_H = 0.50, 0.36, 0.15         # base outer
LID_W, LID_D, LID_H = 0.506, 0.366, 0.06       # lid outer, slips over the base
BOARD = 0.0025                                  # greyboard + wrap
CORNER_R = 0.0022                               # rigid boxes have tight corners
TURN_IN = 0.011                                 # visible wrap turned over the rim, inside
FLOOR_Z = BOARD + 0.0003                        # top of base floor (board + liner)
CLOSED_H = BOX_H + BOARD                        # lid seated: top surface height
LID_SEAT_Z = CLOSED_H - LID_H                   # lid bottom rim height when closed
INS_W, INS_D, INS_H = 0.4925, 0.3525, 0.065     # insert block
INS_TOP = FLOOR_Z + INS_H

SEAL_D = 0.060
CARD_W, CARD_D, CARD_T = 0.127, 0.178, 0.0008
CAN_R, CAN_H = 0.0265, 0.134                    # 250 ml slim can (Ø53 x 134 mm)
SLEEVE_W, SLEEVE_D, SLEEVE_H, SLEEVE_Z = 0.1102, 0.0572, 0.084, 0.017
PRODUCT_SIZE = (SLEEVE_W, SLEEVE_D, CAN_H)      # footprint of your_product() upright

# ---------------------------------------------------------------- slots (box-local)
# (x, y, z, rot_z_deg): footprint centre x/y and the height the item rests on.
# Lying items (tumbler, bottle) are first rotated -90° about X (top -> +Y / back).
_HOODIE_TOP = FLOOR_Z + 0.001 + 0.055
SLOTS = {
    "hoodie":  (-0.132, 0.000, FLOOR_Z + 0.001, 0.0),       # flat, portrait, in the tissue-lined bay
    "cap":     (-0.132, 0.012, _HOODIE_TOP - 0.008, 0.0),    # nested on the hoodie, brim to the front
    "product": (0.016, -0.060, FLOOR_Z, 90.0),               # upright in its pocket, front faces +X
    "tumbler": (0.100, 0.030, INS_TOP - 0.004 - 0.0415, 0.0),  # lying along Y in a cradle
    "bottle":  (0.197, 0.000, INS_TOP - 0.004 - 0.040, 0.0),   # lying along Y, neck to the back
    "card":    (0.148, -0.040, INS_TOP - 0.004 + 0.0415 + 0.0006, -9.0),  # last in, across tumbler+bottle
}
LYING = {"tumbler", "bottle"}
# bay / pocket rectangles in box-local XY (x0, x1, y0, y1) — used by insert() and tissue
HOODIE_BAY = (-0.237, -0.027, -0.146, 0.146)
PRODUCT_POCKET = (-0.0145, 0.0465, -0.1225, 0.0025)


# ================================================================= helpers
def _link(o):
    bpy.context.scene.collection.objects.link(o)
    return o

def _root(name, children, location=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.05
    _link(e)
    for ch in children:
        ch.parent = e
    e.location = location
    return e

def _mesh_obj(name, bm, mats=()):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    _link(o)
    for m in mats:
        me.materials.append(m)
    return o

def _rrect(w, d, r, seg=4, start_back=False):
    """CCW rounded-rectangle outline [(x, y), ...]."""
    pts = []
    hx, hy = w / 2 - r, d / 2 - r
    for cx, cy, a0 in ((hx, hy, 0), (-hx, hy, 90), (-hx, -hy, 180), (hx, -hy, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def _descendants(o):
    out = [o]
    for ch in o.children:
        out += _descendants(ch)
    return out

def world_bbox(root):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
    for o in _descendants(root):
        if o.type not in {"MESH", "CURVE", "FONT"}:
            continue
        oe = o.evaluated_get(dg)
        for c in oe.bound_box:
            p = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, p)); hi = Vector(map(max, hi, p))
    return lo, hi

def _python3():
    return shutil.which("python3") or "/usr/bin/python3"

def _pil(code, args):
    """Run a Pillow snippet with the system python (Blender's has no PIL)."""
    r = subprocess.run([_python3(), "-c", code, json.dumps(args)], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("PIL texture failed:\n" + r.stderr)

def _img(path, non_color=False):
    im = bpy.data.images.load(path, check_existing=True)
    if non_color:
        im.colorspace_settings.name = "Non-Color"
    return im

def _hex(name, gain=1.0):
    """sRGB hex of a palette colour; gain scales it in linear light (albedo
    compensation so saturated brand colours survive bright studio light + AgX)."""
    h = PALETTE.get(name, name)
    if gain == 1.0:
        return h
    lin = rgb(h)[:3]
    def enc(c):
        c = max(0.0, min(1.0, c * gain))
        return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return "#" + "".join(f"{round(enc(c) * 255):02X}" for c in lin)

COBALT_ALBEDO = 0.62    # printed cobalt reflectance gain used for every cobalt print/paper


# ================================================================= materials
def _noise(nt, coord, scale, detail=2.0, rough=0.5, dist=0.0, name=None):
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = rough
    n.inputs["Distortion"].default_value = dist
    nt.links.new(coord, n.inputs["Vector"])
    return n

def _maprange(nt, src, a, b, c, d):
    m = nt.nodes.new("ShaderNodeMapRange")
    m.inputs["From Min"].default_value = a
    m.inputs["From Max"].default_value = b
    m.inputs["To Min"].default_value = c
    m.inputs["To Max"].default_value = d
    nt.links.new(src, m.inputs["Value"])
    return m

def _bumpnode(nt, height, strength, distance, normal=None, invert=False):
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    b.invert = invert
    nt.links.new(height, b.inputs["Height"])
    if normal is not None:
        nt.links.new(normal, b.inputs["Normal"])
    return b

_MATS = {}

def _cached(key, fn):
    m = _MATS.get(key)
    try:
        ok = m is not None and m.name in bpy.data.materials and bpy.data.materials[m.name] == m
    except ReferenceError:
        ok = False
    if not ok:
        m = fn()
        _MATS[key] = m
    return m

def mat_wrap(color="ink", foil_logo=False, name=None):
    """Soft-touch laminated wrap paper over greyboard: velvety broad sheen, faint
    paper grain, slight glue waviness and roughness variation (fingerprint-ish).
    foil_logo=True adds the chrome hot-foil wordmark, debossed, centred on the lid."""
    def build():
        m, nt, b = _c._new_mat(name or f"wrap_{color}{'_foil' if foil_logo else ''}")
        tc = nt.nodes.new("ShaderNodeTexCoord")
        co = tc.outputs["Object"]
        b.inputs["Base Color"].default_value = rgb(color)
        b.inputs["Sheen Weight"].default_value = 0.06
        b.inputs["Sheen Roughness"].default_value = 0.4
        b.inputs["Sheen Tint"].default_value = (0.8, 0.82, 0.88, 1)
        b.inputs["Specular IOR Level"].default_value = 0.30
        rn = _noise(nt, co, 16.0, 2.0, 0.5)
        rr = _maprange(nt, rn.outputs["Fac"], 0.3, 0.7, 0.54, 0.60)
        nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
        grain = _noise(nt, co, 1100.0, 6.0, 0.55)
        wave = _noise(nt, co, 7.0, 2.0, 0.5)
        b1 = _bumpnode(nt, grain.outputs["Fac"], 0.05, 0.0003)
        b2 = _bumpnode(nt, wave.outputs["Fac"], 0.008, 0.002, b1.outputs["Normal"])
        normal = b2.outputs["Normal"]
        if not foil_logo:
            nt.links.new(normal, b.inputs["Normal"])
            return m
        info = logo_mask()
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.vector_type = "POINT"
        mp.inputs["Scale"].default_value = (1 / info["w_m"], 1 / info["h_m"], 1)
        mp.inputs["Location"].default_value = (0.5, 0.5 - info["y_off"] / info["h_m"], 0)
        nt.links.new(co, mp.inputs["Vector"])
        sharp = nt.nodes.new("ShaderNodeTexImage")
        sharp.image = _img(info["mask"], True)
        sharp.extension = "CLIP"
        sharp.interpolation = "Cubic"
        blur = nt.nodes.new("ShaderNodeTexImage")
        blur.image = _img(info["blur"], True)
        blur.extension = "CLIP"
        blur.interpolation = "Cubic"
        nt.links.new(mp.outputs["Vector"], sharp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], blur.inputs["Vector"])
        # deboss: the board is pressed down where the foil sits
        deb = _bumpnode(nt, blur.outputs["Color"], 0.9, 0.00035, normal, invert=True)
        nt.links.new(deb.outputs["Normal"], b.inputs["Normal"])
        foil = nt.nodes.new("ShaderNodeBsdfPrincipled")
        foil.inputs["Metallic"].default_value = 1.0
        # stamped foil is never a perfect mirror: patchy brightness + roughness drift
        fv = _noise(nt, co, 16.0, 3.0, 0.55, dist=0.4)
        fvc = _maprange(nt, fv.outputs["Fac"], 0.3, 0.72, 0.42, 1.0)
        fcol = nt.nodes.new("ShaderNodeMix"); fcol.data_type = "RGBA"; fcol.blend_type = "MULTIPLY"
        fcol.inputs["Factor"].default_value = 1.0
        fcol.inputs["A"].default_value = rgb("chrome")
        nt.links.new(fvc.outputs["Result"], fcol.inputs["B"])
        nt.links.new(fcol.outputs["Result"], foil.inputs["Base Color"])
        frr = _maprange(nt, fv.outputs["Fac"], 0.3, 0.72, 0.3, 0.14)
        nt.links.new(frr.outputs["Result"], foil.inputs["Roughness"])
        foil.inputs["Anisotropic"].default_value = 0.35
        fz = _noise(nt, co, 2600.0, 3.0, 0.5)
        fb0 = _bumpnode(nt, fz.outputs["Fac"], 0.06, 0.0001, deb.outputs["Normal"])
        # the stamped foil is never dead flat: slow undulation varies the chrome reflection
        fw = _noise(nt, co, 55.0, 2.0, 0.5)
        fb = _bumpnode(nt, fw.outputs["Fac"], 0.5, 0.003, fb0.outputs["Normal"])
        nt.links.new(fb.outputs["Normal"], foil.inputs["Normal"])
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(sharp.outputs["Color"], mix.inputs["Fac"])
        nt.links.new(b.outputs["BSDF"], mix.inputs[1])
        nt.links.new(foil.outputs["BSDF"], mix.inputs[2])
        out = nt.nodes.get("Material Output")
        nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
        return m
    return _cached(("wrap", color, foil_logo), build)

def mat_liner(color="cobalt"):
    """Uncoated coloured liner paper (inside walls)."""
    def build():
        m, nt, b = _c._new_mat(f"liner_{color}")
        tc = nt.nodes.new("ShaderNodeTexCoord")
        b.inputs["Base Color"].default_value = rgb(color)
        b.inputs["Roughness"].default_value = 0.82
        b.inputs["Sheen Weight"].default_value = 0.25
        b.inputs["Sheen Roughness"].default_value = 0.5
        n = _noise(nt, tc.outputs["Object"], 1500.0, 8.0, 0.6)
        _c._bump(nt, b, n.outputs["Fac"], 0.06, 0.0003)
        return m
    return _cached(("liner", color), build)

def mat_pulp(color="bone"):
    """Molded fibre (pulp) insert: very matte, fibrous, gently mottled."""
    def build():
        m, nt, b = _c._new_mat(f"pulp_{color}")
        tc = nt.nodes.new("ShaderNodeTexCoord")
        co = tc.outputs["Object"]
        mott = _noise(nt, co, 18.0, 4.0, 0.6)
        cr = nt.nodes.new("ShaderNodeMix")
        cr.data_type = "RGBA"
        cr.inputs["A"].default_value = rgb(color)
        cr.inputs["B"].default_value = rgb("fog")
        f = _maprange(nt, mott.outputs["Fac"], 0.35, 0.75, 0.0, 0.55)
        nt.links.new(f.outputs["Result"], cr.inputs["Factor"])
        nt.links.new(cr.outputs["Result"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.93
        b.inputs["Sheen Weight"].default_value = 0.35
        b.inputs["Sheen Roughness"].default_value = 0.6
        b.inputs["Subsurface Weight"].default_value = 0.05
        fib = _noise(nt, co, 900.0, 12.0, 0.7, dist=1.5)
        vor = nt.nodes.new("ShaderNodeTexVoronoi")
        vor.inputs["Scale"].default_value = 260.0
        nt.links.new(co, vor.inputs["Vector"])
        b1 = _bumpnode(nt, fib.outputs["Fac"], 0.25, 0.0004)
        b2 = _bumpnode(nt, vor.outputs["Distance"], 0.08, 0.0004, b1.outputs["Normal"])
        nt.links.new(b2.outputs["Normal"], b.inputs["Normal"])
        return m
    return _cached(("pulp", color), build)

def mat_tissue_thin(color="cobalt"):
    """Thin translucent tissue: diffuse + translucency, crinkle bump."""
    def build():
        m, nt, b = _c._new_mat(f"tissue_{color}")
        tc = nt.nodes.new("ShaderNodeTexCoord")
        co = tc.outputs["Object"]
        b.inputs["Base Color"].default_value = rgb(color)
        b.inputs["Roughness"].default_value = 0.6
        b.inputs["Sheen Weight"].default_value = 0.45
        b.inputs["Sheen Roughness"].default_value = 0.4
        v = nt.nodes.new("ShaderNodeTexVoronoi")
        v.feature = "DISTANCE_TO_EDGE"
        v.inputs["Scale"].default_value = 140.0
        nt.links.new(co, v.inputs["Vector"])
        n = _noise(nt, co, 420.0, 6.0, 0.6, dist=1.0)
        b1 = _bumpnode(nt, v.outputs["Distance"], 0.25, 0.0008)
        b2 = _bumpnode(nt, n.outputs["Fac"], 0.12, 0.0003, b1.outputs["Normal"])
        nt.links.new(b2.outputs["Normal"], b.inputs["Normal"])
        tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
        tr.inputs["Color"].default_value = rgb("cobalt")
        nt.links.new(b2.outputs["Normal"], tr.inputs["Normal"])
        mix = nt.nodes.new("ShaderNodeMixShader")
        mix.inputs["Fac"].default_value = 0.22
        nt.links.new(b.outputs["BSDF"], mix.inputs[1])
        nt.links.new(tr.outputs["BSDF"], mix.inputs[2])
        nt.links.new(mix.outputs["Shader"], nt.nodes.get("Material Output").inputs["Surface"])
        return m
    return _cached(("tissue", color), build)

def mat_alu(rough=0.2, name="aluminium"):
    def build():
        m, nt, b = _c._new_mat(name)
        b.inputs["Base Color"].default_value = (0.80, 0.81, 0.83, 1)
        b.inputs["Metallic"].default_value = 1.0
        b.inputs["Roughness"].default_value = rough
        b.inputs["Anisotropic"].default_value = 0.25
        tc = nt.nodes.new("ShaderNodeTexCoord")
        n = _noise(nt, tc.outputs["Object"], 3000.0, 4.0, 0.5)
        _c._bump(nt, b, n.outputs["Fac"], 0.04, 0.0001)
        return m
    return _cached(("alu", rough, name), build)

def mat_can_paint(color="bone"):
    def build():
        m, nt, b = _c._new_mat(f"canpaint_{color}")
        # a thin printed cobalt ring above the sleeve line
        tco = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tco.outputs["Object"], sep.inputs["Vector"])
        lo_ = nt.nodes.new("ShaderNodeMath"); lo_.operation = "GREATER_THAN"; lo_.inputs[1].default_value = 0.1112
        hi_ = nt.nodes.new("ShaderNodeMath"); hi_.operation = "LESS_THAN"; hi_.inputs[1].default_value = 0.1130
        nt.links.new(sep.outputs["Z"], lo_.inputs[0]); nt.links.new(sep.outputs["Z"], hi_.inputs[0])
        band = nt.nodes.new("ShaderNodeMath"); band.operation = "MULTIPLY"
        nt.links.new(lo_.outputs[0], band.inputs[0]); nt.links.new(hi_.outputs[0], band.inputs[1])
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
        mx.inputs["A"].default_value = rgb(color)
        mx.inputs["B"].default_value = rgb(_hex("cobalt", COBALT_ALBEDO))
        nt.links.new(band.outputs[0], mx.inputs["Factor"])
        nt.links.new(mx.outputs["Result"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.34
        b.inputs["Coat Weight"].default_value = 0.25
        b.inputs["Coat Roughness"].default_value = 0.22
        tc = nt.nodes.new("ShaderNodeTexCoord")
        n = _noise(nt, tc.outputs["Object"], 2200.0, 3.0, 0.5)
        _c._bump(nt, b, n.outputs["Fac"], 0.03, 0.0001)
        return m
    return _cached(("canpaint", color), build)

def _mat_print(image_path, name, rough=0.55, coat=0.0, sheen=0.1, bump_tex=None, spec=0.5, gain=1.0):
    """Printed paper/board: colour from a generated texture, satin/matte finish."""
    def build():
        m, nt, b = _c._new_mat(name)
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = _img(image_path)
        tex.interpolation = "Cubic"
        if gain != 1.0:
            g = nt.nodes.new("ShaderNodeMix"); g.data_type = "RGBA"; g.blend_type = "MULTIPLY"
            g.inputs["Factor"].default_value = 1.0
            g.inputs["B"].default_value = (gain, gain, gain, 1)
            nt.links.new(tex.outputs["Color"], g.inputs["A"])
            nt.links.new(g.outputs["Result"], b.inputs["Base Color"])
        else:
            nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = rough
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.3
        b.inputs["Sheen Weight"].default_value = sheen
        b.inputs["Specular IOR Level"].default_value = spec
        tc = nt.nodes.new("ShaderNodeTexCoord")
        n = _noise(nt, tc.outputs["Object"], 1600.0, 6.0, 0.6)
        _c._bump(nt, b, n.outputs["Fac"], 0.05, 0.0002)
        return m
    return _cached(("print", image_path), build)


# ================================================================= textures (generated, cached)
_LOGO_MASK_CODE = r'''
import sys, json
a = json.loads(sys.argv[-1])
sys.path.insert(0, a["lib"])
from common import *
reset()
lg = logo(size=1.0)
xs = [v.co.x for v in lg.data.vertices]; ys = [v.co.y for v in lg.data.vertices]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
pad = 0.06
W = x1 - x0 + 2 * pad; H = y1 - y0 + 2 * pad
s = bpy.context.scene
s.render.engine = "CYCLES"
s.cycles.device = "CPU"
s.cycles.samples = 24
s.cycles.use_denoising = False
s.cycles.max_bounces = 0
s.render.filter_size = 1.0
s.render.film_transparent = True
s.view_settings.view_transform = "Standard"
px = a["px"]
s.render.resolution_x = px
s.render.resolution_y = int(round(px * H / W))
s.render.resolution_percentage = 100
s.render.image_settings.file_format = "PNG"
s.render.image_settings.color_mode = "RGBA"
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
camera(loc=(cx, cy, 5), target=(cx, cy, 0), ortho_scale=W)
s.render.filepath = a["out"]
bpy.ops.render.render(write_still=True)
json.dump({"W": W, "H": H, "content_w": x1 - x0, "content_h": y1 - y0, "cx": cx, "cy": cy},
          open(a["json"], "w"))
'''

_MASK_POST_CODE = r'''
import sys, json
from PIL import Image, ImageFilter
a = json.loads(sys.argv[1])
im = Image.open(a["src"]).getchannel("A")
im.save(a["mask"])
im.filter(ImageFilter.GaussianBlur(a["blur"])).save(a["blur_out"])
'''

LOGO_FOIL_WIDTH = 0.25        # chainmail wordmark width on the lid (m)
LOGO_FOIL_Y = 0.0             # vertical offset of the wordmark on the lid top

def logo_mask():
    """Render the common.logo() wordmark top-down to a mask (once, cached in
    assets/textures/kit_logo_mask*.png) and return its lid-space mapping."""
    raw = os.path.join(TEX_DIR, "kit_logo_raw.png")
    mask = os.path.join(TEX_DIR, "kit_logo_mask.png")
    blur = os.path.join(TEX_DIR, "kit_logo_mask_blur.png")
    meta = os.path.join(TEX_DIR, "kit_logo_mask.json")
    if not (os.path.exists(mask) and os.path.exists(blur) and os.path.exists(meta)):
        args = {"lib": HERE, "px": 4096, "out": raw, "json": meta}
        r = subprocess.run([bpy.app.binary_path, "-b", "--factory-startup", "--python-expr",
                            _LOGO_MASK_CODE, "--", json.dumps(args)], capture_output=True, text=True)
        if not os.path.exists(raw):
            raise RuntimeError("logo mask render failed\n" + r.stdout[-2000:] + r.stderr[-2000:])
        _pil(_MASK_POST_CODE, {"src": raw, "mask": mask, "blur_out": blur, "blur": 3.5})
        os.remove(raw)
    info = json.load(open(meta))
    k = LOGO_FOIL_WIDTH / info["content_w"]
    return {"mask": mask, "blur": blur, "w_m": info["W"] * k, "h_m": info["H"] * k, "y_off": LOGO_FOIL_Y,
            "scale": k}

_SEAL_CODE = r'''
import sys, json, math
from PIL import Image, ImageDraw, ImageFont
a = json.loads(sys.argv[1])
S = a["px"]; SS = S * 2
img = Image.new("RGB", (SS, SS), a["bg"])
d = ImageDraw.Draw(img)
c = SS / 2
def ring(r, w):
    d.ellipse([c - r, c - r, c + r, c + r], outline=a["fg"], width=int(w))
ring(SS * 0.452, SS * 0.007)
f = ImageFont.truetype(a["mono"], int(SS * 0.108))
d.text((c, c + SS * 0.036), a["text"], font=f, fill=a["fg"], anchor="ms")

def arc(txt, R, top, fs, track=1.18):
    f2 = ImageFont.truetype(a["mono"], int(fs))
    adv = [f2.getlength(ch) * track for ch in txt]
    tot = sum(adv)
    span = tot / R
    th = math.pi / 2 + span / 2 if top else 3 * math.pi / 2 - span / 2
    for ch, w in zip(txt, adv):
        dth = (w / 2) / R
        th_c = th - dth if top else th + dth
        g = Image.new("L", (int(fs * 2), int(fs * 2)), 0)
        ImageDraw.Draw(g).text((fs, fs), ch, font=f2, fill=255, anchor="ms")
        rot = math.degrees(th_c) - 90 if top else math.degrees(th_c) + 90
        g = g.rotate(rot, resample=Image.BICUBIC)
        xh = fs * 0.36   # half x-height: centre the lowercase band on R
        Rb = R - xh if top else R + xh
        x = c + Rb * math.cos(th_c); y = c - Rb * math.sin(th_c)
        img.paste(Image.new("RGB", g.size, a["fg"]), (int(x - g.width / 2), int(y - g.height / 2)), g)
        th = th - 2 * dth if top else th + 2 * dth
arc(a["top"], SS * 0.370, True, SS * 0.066)
arc(a["bottom"], SS * 0.370, False, SS * 0.066)
for ang in (0, 180):
    x = c + SS * 0.372 * math.cos(math.radians(ang)); y = c
    r = SS * 0.011
    d.ellipse([x - r, y - r, x + r, y + r], fill=a["fg"])
img.resize((S, S), Image.LANCZOS).save(a["out"])
'''

def seal_texture(number=1, edition=48):
    out = os.path.join(TEX_DIR, f"kit_seal_{number:03d}_{edition:03d}.png")
    if not os.path.exists(out):
        _pil(_SEAL_CODE, {"px": 1536, "out": out, "bg": _hex("cobalt", COBALT_ALBEDO), "fg": _hex("bone"),
                          "mono": FONT_MONO, "text": f"no. {number:02d}/{edition:02d}",
                          "top": "chainmail", "bottom": f"edition of {edition}"})
    return out

_CARD_CODE = r'''
import sys, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
a = json.loads(sys.argv[1])
W, H = a["w"], a["h"]; mm = a["ppmm"]
img = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(img)
for item in a["items"]:
    f = ImageFont.truetype(item["font"], int(item["size_mm"] * mm))
    x = W / 2 if item.get("align", "c") == "c" else item["x_mm"] * mm
    anchor = "ms" if item.get("align", "c") == "c" else "ls"
    if "tracking" in item:
        # manual letter spacing
        txt = item["text"]; tr = item["tracking"] * item["size_mm"] * mm
        widths = [f.getlength(ch) for ch in txt]
        tot = sum(widths) + tr * (len(txt) - 1)
        cx = W / 2 - tot / 2 if item.get("align", "c") == "c" else x
        for ch, w in zip(txt, widths):
            d.text((cx, item["y_mm"] * mm), ch, font=f, fill=255, anchor="ls")
            cx += w + tr
    else:
        d.text((x, item["y_mm"] * mm), item["text"], font=f, fill=255, anchor=anchor)
for ln in a.get("rules", []):
    x0, x1, y, w = [v * mm for v in ln]
    d.rectangle([W / 2 + x0, y - w / 2, W / 2 + x1, y + w / 2], fill=255)
img.save(a["mask"])
img.filter(ImageFilter.GaussianBlur(a["blur"])).save(a["blur_out"])
'''

def card_textures(lines=("untitled", "(your logo here)"), number=1, edition=48):
    key = hashlib.md5(json.dumps([list(lines), number, edition]).encode()).hexdigest()[:10]
    mask = os.path.join(TEX_DIR, f"kit_card_{key}.png")
    blur = os.path.join(TEX_DIR, f"kit_card_{key}_blur.png")
    if not (os.path.exists(mask) and os.path.exists(blur)):
        ppmm = 14
        title, mark = (list(lines) + ["", ""])[:2]
        items = []
        if mark:
            items.append({"text": mark, "font": FONT_MONO, "size_mm": 2.9, "y_mm": 24.0, "tracking": 0.06})
        if title:
            items.append({"text": title, "font": FONT_DISPLAY, "size_mm": 9.5, "y_mm": 64.0})
        for i, extra in enumerate(list(lines)[2:]):
            items.append({"text": extra, "font": FONT_TEXT, "size_mm": 3.6, "y_mm": 78.0 + i * 6.0})
        if number is not None:
            items.append({"text": f"no. {number:02d}/{edition:02d}", "font": FONT_MONO, "size_mm": 2.3,
                          "y_mm": 166.0, "tracking": 0.08})
        rules = [(-6.0, 6.0, 70.5, 0.35)] if title else []
        _pil(_CARD_CODE, {"w": int(CARD_W * 1000 * ppmm), "h": int(CARD_D * 1000 * ppmm), "ppmm": ppmm,
                          "items": items, "rules": rules, "mask": mask, "blur_out": blur, "blur": 5.0})
    return mask, blur

_SLEEVE_CODE = r'''
import sys, json, random
from PIL import Image, ImageDraw, ImageFont
a = json.loads(sys.argv[1])
W, H = a["w"], a["h"]; mm = a["ppmm"]
img = Image.new("RGB", (W, H), a["bg"])
d = ImageDraw.Draw(img)
fg = a["fg"]
def font(p, s): return ImageFont.truetype(p, max(6, int(s * mm)))
def panel(name): return [v * mm for v in a["panels"][name]]   # (u0, u1) in mm along the perimeter
fx0, fx1 = panel("front")
m = 7.0 * mm
# front: big stacked lowercase wordmark, mono details, hairlines
big = font(a["display"], 13.0)
d.text((fx0 + m, H - 9.0 * mm), "product", font=big, fill=fg, anchor="ls")
d.text((fx0 + m, H - 9.0 * mm - 14.0 * mm), "your", font=big, fill=fg, anchor="ls")
mono = font(a["mono"], 2.5)
d.text((fx0 + m, 8.5 * mm), "2 x 250 ml", font=mono, fill=fg, anchor="ls")
d.text((fx1 - m, 8.5 * mm), "8.4 fl oz each", font=mono, fill=fg, anchor="rs")
d.rectangle([fx0 + m, 11.0 * mm, fx1 - m, 11.0 * mm + 0.32 * mm], fill=fg)
d.rectangle([fx0 + m, H - 5.6 * mm, fx1 - m, H - 5.6 * mm + 0.32 * mm], fill=fg)
d.text((fx1 - m, H - 2.2 * mm), "sample", font=font(a["mono"], 2.0), fill=fg, anchor="rs")
# sides: vertical spine text
for side in ("left", "right"):
    u0, u1 = panel(side)
    t = Image.new("RGBA", (int(H * 0.86), int((u1 - u0) * 0.6)), (0, 0, 0, 0))
    td = ImageDraw.Draw(t)
    td.text((t.width / 2, t.height / 2), "your product", font=font(a["display"], 5.2), fill=fg, anchor="mm")
    t = t.rotate(90, expand=True)
    img.paste(t, (int((u0 + u1) / 2 - t.width / 2), int(H / 2 - t.height / 2)), t)
# back: fake barcode + mono copy
bx0, bx1 = panel("back_a")
bx2, bx3 = panel("back_b")
def back_block(x0, x1):
    cx = (x0 + x1) / 2
    mono2 = font(a["mono"], 2.1)
    lines = ["your product co.", "made with care,", "packed by chainmail", "miami, fl"]
    for i, ln in enumerate(lines):
        d.text((cx, 12.0 * mm + i * 3.6 * mm), ln, font=mono2, fill=fg, anchor="ms")
back_block(bx0, bx1)
rnd = random.Random(7)
x = bx2 + 6.0 * mm; y0 = H - 30.0 * mm; y1 = H - 14.0 * mm
d.rectangle([x - 2.0 * mm, y0 - 2.0 * mm, x + 24.0 * mm, y1 + 6.0 * mm], fill=fg)
xx = x
while xx < x + 22.0 * mm:
    w = rnd.choice([0.25, 0.25, 0.5, 0.75]) * mm
    d.rectangle([xx, y0, xx + w, y1], fill=a["bg"])
    xx += w + rnd.choice([0.25, 0.5, 0.5, 0.75]) * mm
d.text((x + 11.0 * mm, y1 + 4.6 * mm), "0 00000 00000 0", font=font(a["mono"], 1.8), fill=a["bg"], anchor="ms")
img.save(a["out"])
'''


# ================================================================= scene helpers (builders never call these)
def kit_render_budget(samples=None, threshold=0.01):
    """Opaque paper/board scenes need few bounces: keeps 1600-1800 px finals
    inside ~6 min on 4 shared CPU cores. Call after setup_render()."""
    c = bpy.context.scene.cycles
    if samples and not PREVIEW:
        c.samples = samples
    if not PREVIEW:
        c.adaptive_threshold = threshold
    c.max_bounces = 6
    c.diffuse_bounces = 3
    c.glossy_bounces = 3
    c.transmission_bounces = 4
    c.transparent_max_bounces = 8

def kit_lighting(scale=1.5, target=(0, 0, 0.08), key=1.0, foil=1.0, hdri_strength=0.3, fill=1.0):
    """House studio() rig + a big soft 'foil card' high behind-left so the
    chrome hot-foil catches light from 3/4 front views. Same for every kit shot."""
    studio("soft", key=key, hdri_strength=hdri_strength, scale=scale, target=target)
    if fill != 1.0 and "Fill" in bpy.data.objects:
        bpy.data.objects["Fill"].data.energy *= fill
    t = Vector(target)
    s = scale
    if foil > 0:
        area_light("FoilCard", t + Vector((-1.3, 1.9, 2.3)) * s, t, size=1.6 * s, size_y=0.9 * s,
                   energy=70 * foil * s * s, color=(1.0, 0.99, 0.98))


# ================================================================= box shells
def _tray_bm(w, d, h, t, r, seg=4):
    """Closed rigid tray: outer walls, wrapped rim, inner walls, floor, underside.
    material 0 = outer wrap (incl. rim + turn-in), 1 = floor/ceiling liner."""
    bm = bmesh.new()
    outer = _rrect(w, d, r, seg)
    inner = _rrect(w - 2 * t, d - 2 * t, max(r - t * 0.6, 0.0004), seg)
    def ring(pts, z):
        return [bm.verts.new((x, y, z)) for x, y in pts]
    o0, o1 = ring(outer, 0.0), ring(outer, h)
    i1, i0 = ring(inner, h), ring(inner, t)
    n = len(outer)
    def band(a, b_):
        for k in range(n):
            j = (k + 1) % n
            bm.faces.new((a[k], a[j], b_[j], b_[k])).material_index = 0
    band(o0, o1); band(o1, i1); band(i1, i0)
    bm.faces.new(list(reversed(i0))).material_index = 1
    bm.faces.new(o0).material_index = 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def _liner_bm(w, d, h, t, r, z0, z1, seg=4, thick=0.00022):
    """Liner paper glued on the inner walls from z0 to z1, its top edge visible."""
    bm = bmesh.new()
    e0, e1 = 0.00004, 0.00004 + thick
    rr = max(r - t * 0.6, 0.0004)
    a = _rrect(w - 2 * t - 2 * e0, d - 2 * t - 2 * e0, rr, seg)
    b_ = _rrect(w - 2 * t - 2 * e1, d - 2 * t - 2 * e1, max(rr - thick, 0.0002), seg)
    def ring(pts, z):
        return [bm.verts.new((x, y, z)) for x, y in pts]
    a1 = ring(a, z1); b1 = ring(b_, z1); b0 = ring(b_, z0)
    n = len(a)
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((a1[k], a1[j], b1[j], b1[k]))
        bm.faces.new((b1[k], b1[j], b0[j], b0[k]))
    for f in bm.faces:
        f.normal_update()
        # face inward (towards the box centre)
        c = f.calc_center_median()
        if f.normal.dot(Vector((-c.x, -c.y, 0))) < 0 and abs(f.normal.z) < 0.5:
            f.normal_flip()
        if abs(f.normal.z) >= 0.5 and f.normal.z < 0:
            f.normal_flip()
    return bm

def _flip_z(bm, h):
    for v in bm.verts:
        v.co.z = h - v.co.z
    for f in bm.faces:
        f.normal_flip()

def box_base(color="ink", inner="cobalt"):
    """Rigid base tray 0.50 x 0.36 x 0.15, origin at its underside centre."""
    shell = _mesh_obj("KitBase_shell", _tray_bm(BOX_W, BOX_D, BOX_H, BOARD, CORNER_R),
                      (mat_wrap(color), mat_liner(inner)))
    bev = bevel(shell, 0.0012, 4)
    bev.angle_limit = math.radians(40)
    bev.harden_normals = True
    smooth(shell)
    shell.data.shade_smooth()
    liner = _mesh_obj("KitBase_liner", _liner_bm(BOX_W, BOX_D, BOX_H, BOARD, CORNER_R,
                                                 BOARD, BOX_H - TURN_IN), (mat_liner(inner),))
    return _root("KitBase", [shell, liner])

def seal(number=1, edition=48):
    """Ø60 mm cobalt sticker with the edition number. Origin at its centre, z=0 underside."""
    bm = bmesh.new()
    seg = 160
    r = SEAL_D / 2
    th = 0.00012
    uv = bm.loops.layers.uv.new()
    top = [bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), th))
           for i in range(seg)]
    bot = [bm.verts.new((v.co.x, v.co.y, 0.0)) for v in top]
    ft = bm.faces.new(top)
    fb = bm.faces.new(list(reversed(bot)))
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    for f in (ft, fb):
        for l in f.loops:
            l[uv].uv = (l.vert.co.x / SEAL_D + 0.5, l.vert.co.y / SEAL_D + 0.5)
    tex = seal_texture(number, edition)
    o = _mesh_obj(f"Seal_{number:02d}", bm, (_mat_print(tex, f"seal_{number:02d}_{edition}", rough=0.5,
                                                         coat=0.0, sheen=0.0, spec=0.35),))
    bv = bevel(o, 0.00004, 1)
    smooth(o)
    o.data.shade_smooth()
    return o

def lid(number=1, edition=48, color="ink", inner="cobalt", seal_angle=-7.0):
    """Lid 0.506 x 0.366 x 0.06 with chrome hot-foil wordmark (debossed).
    Origin at the centre of its open bottom rim, z=0 = rim, top surface at z=LID_H.
    number=None -> no seal (used for the lid-top tile)."""
    bm = _tray_bm(LID_W, LID_D, LID_H, BOARD, CORNER_R + 0.0003)
    _flip_z(bm, LID_H)
    shell = _mesh_obj("KitLid_shell", bm, (mat_wrap(color, foil_logo=True), mat_liner(inner)))
    bev = bevel(shell, 0.0012, 4)
    bev.angle_limit = math.radians(40)
    bev.harden_normals = True
    smooth(shell)
    shell.data.shade_smooth()
    lb = _liner_bm(LID_W, LID_D, LID_H, BOARD, CORNER_R + 0.0003, BOARD, LID_H - TURN_IN)
    _flip_z(lb, LID_H)
    liner = _mesh_obj("KitLid_liner", lb, (mat_liner(inner),))
    kids = [shell, liner]
    if number is not None:
        s = seal(number, edition)
        s.location = (LID_W / 2 - 0.060, -LID_D / 2 + 0.058, LID_H + 0.00003)
        s.rotation_euler = (0, 0, math.radians(seal_angle))
        kids.append(s)
    return _root("KitLid" + (f"_{number:02d}" if number is not None else ""), kids)

def closed_box(number=1, edition=48, color="ink"):
    """Base with the lid seated (empty inside). Origin at the underside centre."""
    b = box_base(color)
    l = lid(number, edition, color)
    l.location = (0, 0, LID_SEAT_Z)
    return _root(f"KitClosed_{number:02d}" if number is not None else "KitClosed", [b, l])


# ================================================================= insert
def insert(color="bone"):
    """Molded-pulp insert with a tissue bay for the hoodie, a pocket for the
    product and cradles for the tumbler and the bottle. Origin underside centre."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, INS_H / 2))
    o = bpy.context.active_object
    o.name = "KitInsert"
    o.scale = (INS_W, INS_D, INS_H)
    bpy.ops.object.transform_apply(scale=True)
    cutters = []
    def box_cut(x0, x1, y0, y1, z0=-0.02, z1=INS_H + 0.02):
        bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
        c = bpy.context.active_object
        c.scale = (x1 - x0, y1 - y0, z1 - z0)
        cutters.append(c)
    def cyl_cut(x, y0, y1, r, zc, r2=None):
        if r2 is None:
            bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=y1 - y0, vertices=96,
                                                location=(x, (y0 + y1) / 2, zc), rotation=(math.pi / 2, 0, 0))
        else:
            bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=y1 - y0, vertices=96,
                                            location=(x, (y0 + y1) / 2, zc), rotation=(-math.pi / 2, 0, 0))
        cutters.append(bpy.context.active_object)
    zf = -FLOOR_Z  # insert-local z of box coordinate 0
    box_cut(*HOODIE_BAY)
    box_cut(*PRODUCT_POCKET)
    tz = SLOTS["tumbler"][2] + 0.0415 + zf
    cyl_cut(SLOTS["tumbler"][0], -0.1065, 0.1665, 0.0438, tz)
    bz = SLOTS["bottle"][2] + 0.040 + zf
    bx = SLOTS["bottle"][0]
    cyl_cut(bx, -0.1625, 0.045, 0.0425, bz)
    cyl_cut(bx, 0.045, 0.095, 0.0425, bz, r2=0.019)
    cyl_cut(bx, 0.09, 0.1725, 0.0195, bz)
    # thumb notch in the wall between the two cradles so items can be lifted out
    bpy.ops.mesh.primitive_cylinder_add(radius=0.017, depth=0.06, vertices=64,
                                        location=(0.149, -0.025, INS_H + 0.004))
    cutters.append(bpy.context.active_object)
    for c in cutters:
        mod = o.modifiers.new("cut", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.object = c
    bpy.context.view_layer.objects.active = o
    for mod in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for c in cutters:
        bpy.data.objects.remove(c, do_unlink=True)
    rm = o.modifiers.new("Remesh", "REMESH")
    rm.mode = "VOXEL"
    rm.voxel_size = 0.0014
    sm = o.modifiers.new("Soften", "SMOOTH")
    sm.factor = 0.8
    sm.iterations = 6
    smooth(o)
    o.data.shade_smooth()
    assign(o, mat_pulp(color))
    return o


# ================================================================= tissue
def _crumple(o, seed=0, big=0.006, small=0.0016, scale=1.0):
    """Displace along normals with sharp voronoi creases + soft folds."""
    t1 = bpy.data.textures.new(f"crease_{seed}", "VORONOI")
    t1.distance_metric = "DISTANCE"
    t1.weight_1, t1.weight_2 = -1.0, 1.0
    t1.noise_scale = 0.022 * scale
    t1.noise_intensity = 1.0
    t2 = bpy.data.textures.new(f"fold_{seed}", "CLOUDS")
    t2.noise_scale = 0.05 * scale
    t2.noise_depth = 2
    t3 = bpy.data.textures.new(f"crease2_{seed}", "VORONOI")
    t3.weight_1, t3.weight_2 = -1.0, 1.0
    t3.noise_scale = 0.009 * scale
    for tex, strength, name in ((t2, big, "fold"), (t1, small * 1.6, "crease"), (t3, small * 0.7, "crinkle")):
        mod = o.modifiers.new(name, "DISPLACE")
        mod.texture = tex
        mod.texture_coords = "LOCAL"
        mod.strength = strength
        mod.mid_level = 0.5
    # offset texture space per seed
    rnd = random.Random(seed)
    for mod in o.modifiers:
        if mod.type == "DISPLACE":
            e = bpy.data.objects.new(f"txs_{mod.name}_{seed}", None)
            _link(e)
            e.location = (rnd.uniform(-5, 5), rnd.uniform(-5, 5), rnd.uniform(-5, 5))
            e.hide_render = True
            e.hide_viewport = True
            mod.texture_coords = "OBJECT"
            mod.texture_coords_object = e

def tissue(w=None, d=None, depth=None, seed=3, overhang=0.035, color="cobalt", bounds=None):
    """Cobalt tissue sheet lining a rectangular bay (default: the hoodie bay),
    rising up the walls and flopping over the insert top in loose crumples.
    Origin at the centre of the bay floor (z=0). bounds=(x0, x1, y0, y1) in the
    same local frame (e.g. the box's inner walls): tissue reaching a wall is
    stopped there and bunches upward instead of passing through it."""
    if w is None:
        x0, x1, y0, y1 = HOODIE_BAY
        w, d = x1 - x0, y1 - y0
    depth = INS_H if depth is None else depth
    hx, hy = w / 2 - 0.002, d / 2 - 0.002
    reach = depth + overhang
    W, D = w + 2 * reach, d + 2 * reach
    nx, ny = 150, 170
    rnd = random.Random(seed)
    bm = bmesh.new()
    grid = []
    for j in range(ny + 1):
        row = []
        for i in range(nx + 1):
            u = -W / 2 + W * i / nx
            v = -D / 2 + D * j / ny
            dx = max(abs(u) - hx, 0.0); dy = max(abs(v) - hy, 0.0)
            s = math.hypot(dx, dy)
            cx = max(-hx, min(hx, u)); cy = max(-hy, min(hy, v))
            if s <= 1e-9:
                p = Vector((u, v, 0.0))
            else:
                dirv = Vector((dx * (1 if u > 0 else -1), dy * (1 if v > 0 else -1), 0)).normalized()
                if s < depth:
                    p = Vector((cx, cy, s)) - dirv * 0.0015 * math.sin(math.pi * s / depth)
                else:
                    k = s - depth
                    # roll over the insert lip, then lie loosely on top with a puffy lift
                    lift = 0.012 * math.sin(min(k / overhang, 1.0) * math.pi * 0.9)
                    p = Vector((cx, cy, depth)) + dirv * k * 0.92 + Vector((0, 0, lift + 0.002))
            if bounds is not None:
                bx0, bx1, by0, by1 = bounds
                m_ = 0.004
                ex = max(bx0 + m_ - p.x, 0.0, p.x - (bx1 - m_))
                ey = max(by0 + m_ - p.y, 0.0, p.y - (by1 - m_))
                if ex > 0 or ey > 0:
                    p.x = max(bx0 + m_, min(bx1 - m_, p.x))
                    p.y = max(by0 + m_, min(by1 - m_, p.y))
                    p.z += min((ex + ey) * 0.9, 0.028)
            row.append(bm.verts.new(p))
        grid.append(row)
    for j in range(ny):
        for i in range(nx):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    o = _mesh_obj("Tissue", bm, (mat_tissue_thin(color),))
    _crumple(o, seed, big=0.005, small=0.0014)
    sol = o.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.00015
    sol.offset = 0
    smooth(o)
    o.data.shade_smooth()
    return o

def tissue_puff(size=(0.07, 0.05, 0.035), seed=1, color="cobalt"):
    """A gathered tuft of tissue (a sheet pinched from the middle and stuffed
    into a gap): billowing radial folds, crinkled, thin and translucent.
    size = footprint x, y and height. Origin at its underside centre."""
    rnd = random.Random(seed)
    a, b, h = size[0] / 2, size[1] / 2, size[2]
    nr, nt_ = 34, 180
    folds = rnd.randint(6, 9)
    ph = [rnd.uniform(0, 2 * math.pi) for _ in range(4)]
    tw = [rnd.uniform(1.5, 4.0), rnd.uniform(2.0, 5.0), rnd.uniform(3.0, 7.0)]
    bm = bmesh.new()
    rows = []
    for i in range(nr + 1):
        rho = i / nr
        row = []
        for j in range(nt_):
            th = 2 * math.pi * j / nt_
            # sharp-crested, irregular folds (|sin| ridges), twisting with radius
            f1 = 1 - 2 * abs(math.sin((folds * th + ph[0] + tw[0] * rho) / 2))
            f2 = 1 - 2 * abs(math.sin(((folds + 4) * th + ph[1] - tw[1] * rho) / 2))
            f3 = math.sin(3 * th + ph[2] + 1.5 * rho)
            f4 = math.sin((2 * folds + 1) * th + ph[3] + tw[2] * rho)
            rr = rho * (1 + 0.10 * f1 * rho + 0.06 * f2 * rho + 0.10 * f3 * rho)
            dome = (1 - min(rho, 1.0) ** 2.0) ** 0.6
            amp = h * 0.45 * rho ** 1.1
            z = (h * 0.82 * dome * (1 + 0.12 * f3)
                 + amp * (0.55 * f1 + 0.3 * f2 + 0.15 * f4) * (0.55 + 0.45 * dome) + h * 0.16 * rho ** 3)
            z = max(z, 0.0015 + 0.002 * rho)
            row.append(bm.verts.new((a * rr * math.cos(th), b * rr * math.sin(th), z)))
        rows.append(row)
    for i in range(nr):
        for j in range(nt_):
            k = (j + 1) % nt_
            bm.faces.new((rows[i][j], rows[i][k], rows[i + 1][k], rows[i + 1][j]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = _mesh_obj(f"TissuePuff_{seed}", bm, (mat_tissue_thin(color),))
    _crumple(o, seed, big=h * 0.10, small=0.0026, scale=0.45)
    sol = o.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.00015
    sub = o.modifiers.new("sub", "SUBSURF"); sub.levels = 0; sub.render_levels = 1
    smooth(o)
    o.data.shade_smooth()
    return o


# ================================================================= note card
def note_card(text=("untitled", "(your logo here)"), number=1, edition=48, bow=0.0012, edge="cobalt"):
    """5 x 7 in bone cotton card (0.8 mm), letterpressed ink, painted edges.
    text = (title, mark, *extra lines). Origin at the underside centre."""
    mask, blur = card_textures(text, number, edition)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    nx, ny = 48, 66
    verts = []
    for j in range(ny + 1):
        row = []
        for i in range(nx + 1):
            x = -CARD_W / 2 + CARD_W * i / nx
            y = -CARD_D / 2 + CARD_D * j / ny
            # cotton stock bows a hair along its length
            z = bow * (1 - (2 * y / CARD_D) ** 2) * 0.6 + bow * 0.4 * (1 - (2 * x / CARD_W) ** 2)
            row.append(bm.verts.new((x, y, z)))
        verts.append(row)
    for j in range(ny):
        for i in range(nx):
            f = bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
            for l in f.loops:
                l[uv].uv = (l.vert.co.x / CARD_W + 0.5, l.vert.co.y / CARD_D + 0.5)
    o = _mesh_obj("NoteCard", bm, (_mat_card(mask, blur), mat_liner(edge)))
    sol = o.modifiers.new("Stock", "SOLIDIFY")
    sol.thickness = CARD_T
    sol.offset = 1.0
    sol.material_offset_rim = 1
    sol.use_rim = True
    bev = bevel(o, 0.00012, 2)
    smooth(o)
    o.data.shade_smooth()
    zmin = 0.0
    o.location.z = 0.0
    return o

def _mat_card(mask, blur):
    def build():
        m, nt, b = _c._new_mat("card_" + os.path.basename(mask)[:-4])
        tc = nt.nodes.new("ShaderNodeTexCoord")
        co = tc.outputs["Object"]
        uvn = tc.outputs["UV"]
        mk = nt.nodes.new("ShaderNodeTexImage")
        mk.image = _img(mask, True)
        mk.interpolation = "Cubic"
        bl = nt.nodes.new("ShaderNodeTexImage")
        bl.image = _img(blur, True)
        bl.interpolation = "Cubic"
        nt.links.new(uvn, mk.inputs["Vector"]); nt.links.new(uvn, bl.inputs["Vector"])
        # letterpress ink: slightly uneven coverage ("salt")
        salt = _noise(nt, co, 2400.0, 6.0, 0.7)
        sr = _maprange(nt, salt.outputs["Fac"], 0.3, 0.7, 0.9, 1.0)
        cov = nt.nodes.new("ShaderNodeMath"); cov.operation = "MULTIPLY"
        nt.links.new(mk.outputs["Color"], cov.inputs[0]); nt.links.new(sr.outputs["Result"], cov.inputs[1])
        # paper colour with soft cotton mottling
        mott = _noise(nt, co, 60.0, 5.0, 0.6)
        pc = nt.nodes.new("ShaderNodeMix"); pc.data_type = "RGBA"
        pc.inputs["A"].default_value = rgb("#ECE3D2")
        pc.inputs["B"].default_value = tuple(min(1, c * 0.95) for c in rgb("#ECE3D2")[:3]) + (1,)
        mr = _maprange(nt, mott.outputs["Fac"], 0.35, 0.7, 0, 1)
        nt.links.new(mr.outputs["Result"], pc.inputs["Factor"])
        col = nt.nodes.new("ShaderNodeMix"); col.data_type = "RGBA"
        nt.links.new(cov.outputs["Value"], col.inputs["Factor"])
        nt.links.new(pc.outputs["Result"], col.inputs["A"])
        col.inputs["B"].default_value = rgb("#101014")
        nt.links.new(col.outputs["Result"], b.inputs["Base Color"])
        rgh = _maprange(nt, mk.outputs["Color"], 0, 1, 0.9, 0.8)
        nt.links.new(rgh.outputs["Result"], b.inputs["Roughness"])
        shw = _maprange(nt, mk.outputs["Color"], 0, 1, 0.3, 0.0)     # ink kills the fibre sheen
        nt.links.new(shw.outputs["Result"], b.inputs["Sheen Weight"])
        spw = _maprange(nt, mk.outputs["Color"], 0, 1, 0.5, 0.25)
        nt.links.new(spw.outputs["Result"], b.inputs["Specular IOR Level"])
        b.inputs["Sheen Roughness"].default_value = 0.5
        b.inputs["Subsurface Weight"].default_value = 0.08
        b.inputs["Subsurface Radius"].default_value = (0.002, 0.0018, 0.0015)
        fib = _noise(nt, co, 700.0, 10.0, 0.65, dist=0.8)
        b1 = _bumpnode(nt, fib.outputs["Fac"], 0.12, 0.0003)
        felt = _noise(nt, co, 90.0, 4.0, 0.6)
        b2 = _bumpnode(nt, felt.outputs["Fac"], 0.05, 0.0006, b1.outputs["Normal"])
        deb = _bumpnode(nt, bl.outputs["Color"], 1.0, 0.0028, b2.outputs["Normal"], invert=True)
        nt.links.new(deb.outputs["Normal"], b.inputs["Normal"])
        return m
    return _cached(("card", mask), build)


# ================================================================= your product
def _can_profile():
    # (radius, z) bottom -> top for a 250 ml slim can (Ø53 x 134 mm)
    return [
        (0.0, 0.0085), (0.008, 0.0081), (0.0145, 0.0068), (0.0185, 0.0042), (0.0203, 0.0012),
        (0.0212, 0.0001), (0.0222, 0.0003), (0.0236, 0.0021), (0.0251, 0.0052), (0.0261, 0.0085),
        (0.02648, 0.0110), (0.0265, 0.0125),
        (0.0265, 0.1200), (0.02635, 0.1228), (0.0256, 0.1262), (0.0249, 0.1288), (0.02455, 0.1305),
        (0.02475, 0.1316), (0.02508, 0.1328), (0.02512, 0.1336), (0.0248, 0.1341), (0.0243, 0.1340),
        (0.02405, 0.1330), (0.0238, 0.1300), (0.0232, 0.1275), (0.0226, 0.1270), (0.0221, 0.1276),
        (0.0219, 0.1284), (0.0200, 0.1287), (0.0120, 0.1290), (0.0, 0.1291),
    ]

def _superellipse(cx, cy, a, b, n=64, p=3.2, rot=0.0):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        c, s = math.cos(t), math.sin(t)
        x = a * math.copysign(abs(c) ** (2 / p), c)
        y = b * math.copysign(abs(s) ** (2 / p), s)
        pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
    return pts

def _can(name):
    prof = _can_profile()
    o = lathe(name, prof, segments=128)
    o.data.materials.append(mat_can_paint("bone"))
    o.data.materials.append(mat_alu(0.22))
    for p in o.data.polygons:
        z = p.center.z
        rr = math.hypot(p.center.x, p.center.y)
        p.material_index = 0 if (0.0115 < z < 0.1302 and rr > 0.0244) else 1
    sub = o.modifiers.new("Sub", "SUBSURF"); sub.levels = 1; sub.render_levels = 2
    parts = [o]
    top = 0.1291
    # opening score (raised bead tear-drop) toward -Y, tab toward +Y
    pts = []
    for k in range(80):
        t = 2 * math.pi * k / 80
        ty = math.sin(t)                      # -1 (outer end) .. +1 (towards the rivet)
        narrow = 1.0 - 0.38 * (ty + 1) / 2
        x = 0.0088 * narrow * math.copysign(abs(math.cos(t)) ** (2 / 2.4), math.cos(t))
        y = -0.0118 + 0.0072 * math.copysign(abs(ty) ** (2 / 2.4), ty)
        pts.append((x, y))
    cu = bpy.data.curves.new(name + "_score", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for k, (x, y) in enumerate(pts):
        sp.points[k].co = (x, y, top + 0.00005, 1)
    sp.use_cyclic_u = True
    cu.bevel_depth = 0.00028
    cu.bevel_resolution = 2
    so = bpy.data.objects.new(name + "_score", cu)
    _link(so)
    so.data.materials.append(mat_alu(0.25))
    # bake the bevelled curve to a mesh (clean bounds for place(), no curve eval at render)
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(so.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(so, do_unlink=True)
    so = bpy.data.objects.new(name + "_score", me)
    _link(so)
    smooth(so)
    parts.append(so)
    # rivet
    rv = lathe(name + "_rivet", [(0.0, top), (0.0016, top), (0.0017, top + 0.0005), (0.0012, top + 0.0009),
                                 (0.0, top + 0.001)], segments=40, mat=mat_alu(0.2))
    parts.append(rv)
    # pull tab: flat ring (outer + finger hole), lying on the lid, nose over the rivet
    bm = bmesh.new()
    outer = _superellipse(0.0, 0.0062, 0.0062, 0.0105, n=96, p=3.0)
    inner = _superellipse(0.0, 0.0102, 0.0038, 0.0042, n=96, p=2.6)
    ov = [bm.verts.new((x, y, top + 0.0006)) for x, y in outer]
    iv = [bm.verts.new((x, y, top + 0.0006)) for x, y in inner]
    for k in range(96):
        j = (k + 1) % 96
        bm.faces.new((ov[k], ov[j], iv[j], iv[k]))
    for v in ov + iv:
        v.co.z += max(0.0, v.co.y - 0.010) * 0.06   # finger end lifts a touch
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    tab = _mesh_obj(name + "_tab", bm, (mat_alu(0.16),))
    s = tab.modifiers.new("t", "SOLIDIFY"); s.thickness = 0.00035; s.offset = 0
    bevel(tab, 0.0001, 2)
    smooth(tab)
    parts.append(tab)
    for p in parts[1:]:
        p.parent = o
    return o

def your_product():
    """Client product stand-in: two slim 250 ml cans in a cobalt/bone printed
    paperboard sleeve. Upright, front (big 'your product') facing -Y.
    Origin underside centre. Footprint 0.110 x 0.057 x 0.134 m."""
    cans = []
    for k, x in enumerate((-0.0268, 0.0268)):
        c = _can(f"Can_{k}")
        c.location = (x, 0.0, 0.0)
        c.rotation_euler = (0, 0, math.radians(20 + 137 * k))
        cans.append(c)
    # sleeve: rounded-rect paperboard band, UV along the perimeter (seam at the back)
    seg = 6
    r = 0.0045
    pts = _rrect(SLEEVE_W, SLEEVE_D, r, seg)
    # start the loop at the back centre (x=0, y=+D/2) heading -X (CCW)
    def bow(x, y):
        # paperboard panels bow out a hair between the creases
        if abs(abs(y) - SLEEVE_D / 2) < 1e-6:
            y += math.copysign(0.0008 * max(0.0, 1 - (x / (SLEEVE_W / 2 - r)) ** 2), y)
        elif abs(abs(x) - SLEEVE_W / 2) < 1e-6:
            x += math.copysign(0.0004 * max(0.0, 1 - (y / (SLEEVE_D / 2 - r)) ** 2), x)
        return x, y
    # densify the straight runs so the bow is smooth
    dense = []
    for i in range(len(pts)):
        a, b2 = pts[i], pts[(i + 1) % len(pts)]
        dlen = math.hypot(b2[0] - a[0], b2[1] - a[1])
        steps = max(1, int(dlen / 0.004))
        for k in range(steps):
            t = k / steps
            dense.append((a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t))
    pts = dense
    pts3 = [Vector(bow(x, y) + (0,)) for x, y in pts]
    # find index nearest to back centre
    start = min(range(len(pts3)), key=lambda i: (pts3[i] - Vector((0, SLEEVE_D / 2, 0))).length)
    loop = pts3[start:] + pts3[:start]
    L = [0.0]
    for i in range(1, len(loop) + 1):
        L.append(L[-1] + (loop[i % len(loop)] - loop[i - 1]).length)
    P = L[-1]
    # texture panels (mm along perimeter) — computed from geometry
    def u_of(x, y):
        best = min(range(len(loop)), key=lambda i: (loop[i] - Vector((x, y, 0))).length)
        return L[best]
    ppmm = 12
    panels = {
        "front": (u_of(SLEEVE_W / 2 - r, -SLEEVE_D / 2) * 1000 - 0.0, u_of(-SLEEVE_W / 2 + r, -SLEEVE_D / 2) * 1000),
        "left": (u_of(-SLEEVE_W / 2, SLEEVE_D / 2 - r) * 1000, u_of(-SLEEVE_W / 2, -SLEEVE_D / 2 + r) * 1000),
        "right": (u_of(SLEEVE_W / 2, -SLEEVE_D / 2 + r) * 1000, u_of(SLEEVE_W / 2, SLEEVE_D / 2 - r) * 1000),
        "back_a": (0.0, u_of(-SLEEVE_W / 2 + r, SLEEVE_D / 2) * 1000),
        "back_b": (u_of(SLEEVE_W / 2 - r, SLEEVE_D / 2) * 1000, P * 1000),
    }
    # the loop runs CCW from back centre: back(-X half) -> left side -> front (x from -W/2 to +W/2) -> right -> back
    fa, fb = sorted(panels["front"])
    panels["front"] = (fa, fb)
    for k in ("left", "right"):
        panels[k] = tuple(sorted(panels[k]))
    tex = os.path.join(TEX_DIR, "kit_sleeve.png")
    if not os.path.exists(tex):
        _pil(_SLEEVE_CODE, {"w": int(P * 1000 * ppmm), "h": int(SLEEVE_H * 1000 * ppmm), "ppmm": ppmm,
                            "panels": panels, "bg": _hex("cobalt", COBALT_ALBEDO), "fg": _hex("bone"),
                            "display": FONT_DISPLAY, "mono": FONT_MONO, "out": tex})
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    vz = 8
    rings = []
    for k in range(vz + 1):
        z = SLEEVE_Z + SLEEVE_H * k / vz
        rings.append([bm.verts.new((p.x, p.y, z)) for p in loop])
    n = len(loop)
    for k in range(vz):
        for i in range(n):
            j = i + 1
            a, b_ = rings[k][i], rings[k][j % n]
            c_, d_ = rings[k + 1][j % n], rings[k + 1][i]
            f = bm.faces.new((a, b_, c_, d_))
            us = (L[i] / P, L[j] / P, L[j] / P, L[i] / P)
            vs = (k / vz, k / vz, (k + 1) / vz, (k + 1) / vz)
            for l, uu, vv in zip(f.loops, us, vs):
                l[uv].uv = (uu, 1 - vv if False else vv)
    for f in bm.faces:
        f.normal_update()
        c = f.calc_center_median()
        if f.normal.dot(Vector((c.x, c.y, 0))) < 0:
            f.normal_flip()
    sl = _mesh_obj("Sleeve", bm, (_mat_print(tex, "sleeve_print", rough=0.5, coat=0.0, sheen=0.12),
                                  mat_matte("#E6E1D6", 0.85, name="sleeve_board_core")))
    so = sl.modifiers.new("Board", "SOLIDIFY")
    so.thickness = 0.00045
    so.offset = -1.0
    so.material_offset_rim = 1
    so.material_offset = 1
    bevel(sl, 0.00012, 2)
    smooth(sl)
    sl.data.shade_smooth()
    # image v=0 is the bottom row in Blender; PIL draws top-down -> flip handled by uv (v up)
    return _root("YourProduct", cans + [sl])


# ================================================================= fallbacks (when item libs are missing)
def _proxy_hoodie(color="Black"):
    o = rounded_box("HoodieProxy", (0.20, 0.27, 0.055), radius=0.014, segments=6,
                    mat=mat_fabric("ink" if color == "Black" else "fog"))
    return o

def _proxy_cap(color="Black"):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.0)
    crown = bpy.context.active_object
    crown.name = "CapProxy"
    for v in crown.data.vertices:
        if v.co.z < 0:
            v.co.z = 0
    crown.scale = (0.085, 0.095, 0.095)
    bpy.ops.object.transform_apply(scale=True)
    crown.location = (0, 0.012, 0.0)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.004, vertices=64)
    brim = bpy.context.active_object
    brim.scale = (0.085, 0.07, 1)
    bpy.ops.object.transform_apply(scale=True)
    brim.location = (0, -0.075, 0.012)
    brim.rotation_euler = (math.radians(-12), 0, 0)
    m = mat_fabric("ink" if color == "Black" else "bone")
    for o in (crown, brim):
        assign(o, m); smooth(o)
    return _root("CapProxyRoot", [crown, brim])

def _proxy_tumbler(color="Matte Black"):
    prof = [(0.0, 0.0), (0.033, 0.0), (0.0345, 0.003), (0.0355, 0.06), (0.0415, 0.20), (0.0415, 0.235),
            (0.0405, 0.236), (0.0405, 0.262), (0.039, 0.265), (0.0, 0.265)]
    return lathe("TumblerProxy", prof, mat=mat_powdercoat("ink"))

def _proxy_bottle(kind="manojo"):
    prof = [(0.0, 0.0), (0.036, 0.0), (0.0395, 0.004), (0.04, 0.012), (0.04, 0.19), (0.036, 0.215),
            (0.022, 0.235), (0.0145, 0.25), (0.0145, 0.272), (0.0165, 0.274), (0.0165, 0.30), (0.0, 0.30)]
    return lathe("BottleProxy", prof, mat=mat_glass())

def _item(kind, *args):
    """Try the real item libraries, fall back to correctly sized proxies."""
    try:
        if kind == "hoodie":
            import apparel
            return apparel.folded_hoodie(*args)
        if kind == "cap":
            import accessories
            return accessories.cap(*args)
        if kind == "tumbler":
            import vessels
            return vessels.tumbler(*args)
        if kind == "bottle":
            import vessels
            return vessels.bottle(*args)
    except Exception as e:  # ImportError or a builder still in progress
        print(f"[kit] {kind}: using proxy ({type(e).__name__}: {e})")
    return {"hoodie": _proxy_hoodie, "cap": _proxy_cap, "tumbler": _proxy_tumbler,
            "bottle": _proxy_bottle}[kind](*args)

def place(obj, name, parent=None):
    """Move an item builder's root into SLOTS[name] (box-local). Lying items are
    rotated -90° about X first (top -> +Y). Uses the real bounding box, so any
    item size works. If parent is given, obj is parented to it (box-local)."""
    x, y, z, rz = SLOTS[name]
    rx = -math.pi / 2 if name in LYING else 0.0
    obj.rotation_euler = (rx, 0.0, math.radians(rz))
    obj.location = (0, 0, 0)
    lo, hi = world_bbox(obj)
    obj.location = (x - (lo.x + hi.x) / 2, y - (lo.y + hi.y) / 2, z - lo.z)
    if parent is not None:
        obj.parent = parent
    return obj


# ================================================================= assembly
def packed_box(open=True, number=1, edition=48, hoodie="Black", cap="Black", tumbler="Matte Black",
               spirit="manojo", product=True, card=True, lid_pose="lean"):
    """The whole kit in box-local coords. open=True: lid leaning behind the base
    (lid_pose="lean") or omitted (lid_pose=None); open=False: lid seated."""
    parts = []
    base = box_base(); parts.append(base)
    ins = insert(); ins.location = (0, 0, FLOOR_Z); parts.append(ins)
    x0, x1, y0, y1 = HOODIE_BAY
    cx_, cy_ = (x0 + x1) / 2, (y0 + y1) / 2
    iw, idp = BOX_W / 2 - BOARD - 0.0004, BOX_D / 2 - BOARD - 0.0004
    t = tissue(seed=number + 2, bounds=(-iw - cx_, iw - cx_, -idp - cy_, idp - cy_))
    t.location = (cx_, cy_, FLOOR_Z); parts.append(t)
    items = {}
    if hoodie:
        items["hoodie"] = _item("hoodie", hoodie)
    if cap:
        items["cap"] = _item("cap", cap)
    if tumbler:
        items["tumbler"] = _item("tumbler", tumbler)
    if spirit:
        items["bottle"] = _item("bottle", spirit)
    if product:
        items["product"] = your_product()
    if card:
        items["card"] = note_card(number=number, edition=edition)
    for k, o in items.items():
        place(o, k)
        parts.append(o)
    # tissue wads in the gaps
    for i, (pos, size, rz) in enumerate([
        ((0.014, 0.080, INS_TOP - 0.010), (0.07, 0.13, 0.05), 6),       # behind the product
        ((0.016, -0.147, INS_TOP - 0.006), (0.075, 0.042, 0.032), -8),  # in front of the product
        ((0.160, 0.128, INS_TOP - 0.012), (0.042, 0.085, 0.045), 4),    # between tumbler lid and bottle neck
    ]):
        p = tissue_puff(size, seed=11 + i + number)
        p.location = pos
        p.rotation_euler = (0, 0, math.radians(rz))
        parts.append(p)
    if open is False:
        l = lid(number, edition); l.location = (0, 0, LID_SEAT_Z); parts.append(l)
    elif lid_pose == "lean":
        l = lid(number, edition)
        l.rotation_euler = (math.radians(74), 0, 0)
        lo, hi = world_bbox(l)
        l.location = (0, BOX_D / 2 + 0.004 - lo.y, -lo.z)
        parts.append(l)
    return _root(f"Kit_{number:02d}", parts)
