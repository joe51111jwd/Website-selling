"""
chainmail studio — shared Blender foundation.

Every scene script does:

    import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
    from common import *

and then builds geometry with the brand materials below, so every render on the
site shares one lighting rig, one colour pipeline and one palette.

Run a scene:  blender -b --factory-startup -P chainmail/blender/scenes/<scene>.py -- [--preview]
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))              # chainmail/blender
ASSETS = os.path.join(ROOT, "assets")
OUT_DIR = os.path.join(ROOT, "out")                         # full-quality PNG finals (git-ignored)
PREVIEW_DIR = os.path.join(ROOT, "previews")
FONT_DISPLAY = os.path.join(ASSETS, "fonts", "Archivo-ExpandedExtraBold.ttf")
FONT_TEXT = os.path.join(ASSETS, "fonts", "Archivo-SemiBold.ttf")
FONT_MONO = os.path.join(ASSETS, "fonts", "GeistMono-Medium.ttf")
HDRI = {
    "soft": os.path.join(ASSETS, "hdri", "studio_small_09_2k.hdr"),
    "warm": os.path.join(ASSETS, "hdri", "brown_photostudio_02_2k.hdr"),
    "contrast": os.path.join(ASSETS, "hdri", "studio_small_03_2k.hdr"),
}

# ---------------------------------------------------------------- brand palette
# sRGB hex — identical to the CSS custom properties in site/src/styles/tokens.css
PALETTE = {
    "ink":      "#0B0B0F",   # near-black, the box + type
    "graphite": "#2A2A31",
    "bone":     "#EFEBE3",   # warm off-white, paper + background
    "fog":      "#D9D4CA",
    "cobalt":   "#2B3BFF",   # the accent: tissue, cap, seal
    "cobalt_d": "#1420B8",
    "volt":     "#D8FF3C",   # tiny highlight only (stitching, a tab)
    "chrome":   "#C9CCD3",
}

def argv_flags():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

PREVIEW = "--preview" in argv_flags()

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def rgb(hex_or_name, a=1.0):
    h = PALETTE.get(hex_or_name, hex_or_name).lstrip("#")
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (a,)

# ---------------------------------------------------------------- scene / render
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.unit_settings.system = "METRIC"
    return s

def setup_render(width=1600, height=1600, samples=256, transparent=True, preview=None,
                 motion_blur=False, exposure=0.0):
    """Cycles, CPU, OIDN denoise, AgX. --preview drops to 40% res / 32 spp."""
    preview = PREVIEW if preview is None else preview
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    c = s.cycles
    c.device = "CPU"
    c.samples = 32 if preview else samples
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.02 if preview else 0.008
    c.use_denoising = True
    c.denoiser = "OPENIMAGEDENOISE"
    c.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    c.denoising_prefilter = "ACCURATE"
    c.max_bounces = 12
    c.diffuse_bounces = 4
    c.glossy_bounces = 6
    c.transmission_bounces = 12
    c.transparent_max_bounces = 16
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.blur_glossy = 0.5
    c.use_light_tree = True
    s.render.resolution_x = width
    s.render.resolution_y = height
    s.render.resolution_percentage = 40 if preview else 100
    s.render.film_transparent = transparent
    s.render.filter_size = 1.2
    s.render.use_motion_blur = motion_blur
    s.render.image_settings.file_format = "PNG"
    s.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    s.render.image_settings.color_depth = "16" if not preview else "8"
    s.render.image_settings.compression = 30
    # Khronos PBR Neutral: built for product/e-commerce renders — base colours (cobalt
    # #2B3BFF, catalog swatches, bone whites) reproduce faithfully, highlights still roll
    # off gently. AgX desaturated cobalt to periwinkle (#6B8BED) and greyed the whites.
    s.view_settings.view_transform = "Khronos PBR Neutral"
    s.view_settings.look = "None"
    s.view_settings.exposure = exposure
    s.display_settings.display_device = "sRGB"
    s.render.threads_mode = "AUTO"
    return s

def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

def camera(loc=(0, -4, 2), target=(0, 0, 0.3), lens=85, ortho_scale=None, dof_target=None, fstop=8.0,
           name="Camera"):
    cam_data = bpy.data.cameras.new(name)
    cam = bpy.data.objects.new(name, cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = loc
    look_at(cam, target)
    if ortho_scale:
        cam_data.type = "ORTHO"
        cam_data.ortho_scale = ortho_scale
    else:
        cam_data.lens = lens
    cam_data.sensor_width = 36
    cam_data.clip_start = 0.01
    cam_data.clip_end = 200
    if dof_target is not None:
        cam_data.dof.use_dof = True
        cam_data.dof.focus_distance = (Vector(dof_target) - Vector(loc)).length
        cam_data.dof.aperture_fstop = fstop
    bpy.context.scene.camera = cam
    return cam

def area_light(name, loc, target, size=2.0, energy=400, color=(1, 1, 1), shape="RECTANGLE", size_y=None,
               spread=180):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.color = color[:3]
    ld.shape = shape
    ld.size = size
    ld.size_y = size_y or size
    ld.spread = math.radians(spread)
    lo = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = loc
    look_at(lo, target)
    return lo

def world_hdri(kind="soft", strength=0.6, rotation_deg=0.0, visible=False, bg_color=None):
    """HDRI for reflections/fill. visible=False keeps it out of the camera
    (film is transparent anyway for cutouts). bg_color, if given, is what the camera sees."""
    w = bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    tex = nt.nodes.new("ShaderNodeTexEnvironment")
    tex.image = bpy.data.images.load(HDRI[kind], check_existing=True)
    mapn = nt.nodes.new("ShaderNodeMapping")
    mapn.inputs["Rotation"].default_value[2] = math.radians(rotation_deg)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(coord.outputs["Generated"], mapn.inputs["Vector"])
    nt.links.new(mapn.outputs["Vector"], tex.inputs["Vector"])
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = strength
    nt.links.new(tex.outputs["Color"], bg.inputs["Color"])
    if bg_color is None and visible:
        nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    else:
        # camera rays see a flat colour (or nothing under film_transparent); everything else sees the HDRI
        flat = nt.nodes.new("ShaderNodeBackground")
        flat.inputs["Color"].default_value = rgb(bg_color or "bone")
        flat.inputs["Strength"].default_value = 1.0
        lp = nt.nodes.new("ShaderNodeLightPath")
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
        nt.links.new(bg.outputs["Background"], mix.inputs[1])
        nt.links.new(flat.outputs["Background"], mix.inputs[2])
        nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return w

def studio(kind="soft", key=1.0, hdri_strength=0.35, rotation_deg=30, target=(0, 0, 0.2), scale=1.0):
    """The house lighting rig: big soft key upper-left, strip rim back-right,
    low fill front, HDRI for reflections. scale multiplies light distances for
    larger subjects (e.g. a whole kit box ~0.45 m wide -> scale ~1.5)."""
    world_hdri(kind, hdri_strength, rotation_deg)
    t = Vector(target)
    s = scale
    area_light("Key", t + Vector((-2.2, -2.0, 2.8)) * s, t, size=2.4 * s, energy=170 * key * s * s,
               color=(1.0, 0.97, 0.93))
    area_light("Rim", t + Vector((2.4, 2.2, 1.6)) * s, t, size=0.5 * s, size_y=3.0 * s,
               energy=130 * key * s * s, color=(0.92, 0.95, 1.0))
    area_light("Fill", t + Vector((1.8, -2.6, 0.5)) * s, t, size=3.0 * s, energy=28 * key * s * s,
               color=(1.0, 0.98, 0.96))
    area_light("Top", t + Vector((0, 0, 3.4)) * s, t, size=1.6 * s, energy=45 * key * s * s)

def shadow_catcher(size=20, z=0.0, name="ShadowCatcher"):
    """Invisible floor that keeps soft contact shadows in the transparent PNG."""
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    p = bpy.context.active_object
    p.name = name
    p.is_shadow_catcher = True
    p.data.materials.append(mat_matte("bone", 0.9, name="CatcherMat"))
    return p

def floor(color="bone", z=0.0, size=40, rough=0.85, name="Floor"):
    """Visible seamless floor (for full-frame, non-transparent shots)."""
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    p = bpy.context.active_object
    p.name = name
    p.data.materials.append(mat_matte(color, rough, name=name + "Mat"))
    return p

# ---------------------------------------------------------------- materials
def _new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    return m, nt, bsdf

def _bump(nt, bsdf, height_socket, strength=0.2, distance=0.001):
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    nt.links.new(height_socket, b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], bsdf.inputs["Normal"])
    return b

def mat_matte(color, rough=0.7, name=None, coat=0.0):
    m, nt, b = _new_mat(name or f"matte_{color}")
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    return m

def mat_softtouch(color="ink", name=None):
    """Rigid-box wrap paper with soft-touch lamination: velvety, faint grain."""
    m, nt, b = _new_mat(name or f"softtouch_{color}")
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = 0.62
    b.inputs["Sheen Weight"].default_value = 0.08
    b.inputs["Sheen Roughness"].default_value = 0.5
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 900.0
    n.inputs["Detail"].default_value = 4
    _bump(nt, b, n.outputs["Fac"], 0.06, 0.0004)
    return m

def mat_chrome(rough=0.08, tint="chrome", name="chrome"):
    m, nt, b = _new_mat(name)
    b.inputs["Base Color"].default_value = rgb(tint)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Roughness"].default_value = rough
    return m

def mat_foil(tint="chrome", name="foil"):
    """Hot-foil stamp: metallic, slightly brushed, sits on paper."""
    m, nt, b = _new_mat(name)
    b.inputs["Base Color"].default_value = rgb(tint)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Roughness"].default_value = 0.22
    b.inputs["Anisotropic"].default_value = 0.5
    return m

def mat_fabric(color, name=None, scale=420.0, sheen=0.6, rough=0.92, knit=True):
    """Cotton / french terry. Procedural knit bump + sheen so folds read as cloth."""
    m, nt, b = _new_mat(name or f"fabric_{color}")
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Sheen Weight"].default_value = sheen
    b.inputs["Sheen Roughness"].default_value = 0.35
    b.inputs["Sheen Tint"].default_value = (1, 1, 1, 1)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    if knit:
        wave = nt.nodes.new("ShaderNodeTexWave")
        wave.wave_type = "BANDS"
        wave.bands_direction = "X"
        wave.inputs["Scale"].default_value = scale
        wave.inputs["Distortion"].default_value = 1.5
        wave.inputs["Detail"].default_value = 1.0
        nt.links.new(coord.outputs["Object"], wave.inputs["Vector"])
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = scale * 0.6
        noise.inputs["Detail"].default_value = 6
        nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "FLOAT"
        mix.inputs[0].default_value = 0.45
        nt.links.new(wave.outputs["Fac"], mix.inputs[2])
        nt.links.new(noise.outputs["Fac"], mix.inputs[3])
        _bump(nt, b, mix.outputs[0], 0.35, 0.0006)
    return m

def mat_paper(color="bone", name=None, rough=0.85, tooth=0.08):
    m, nt, b = _new_mat(name or f"paper_{color}")
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Subsurface Weight"].default_value = 0.05
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 1400.0
    n.inputs["Detail"].default_value = 8
    _bump(nt, b, n.outputs["Fac"], tooth, 0.0003)
    return m

def mat_tissue(color="cobalt", name=None):
    """Crinkled tissue paper: thin, slightly translucent, crumpled bump."""
    m, nt, b = _new_mat(name or f"tissue_{color}")
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = 0.55
    b.inputs["Transmission Weight"].default_value = 0.15
    b.inputs["Sheen Weight"].default_value = 0.3
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.feature = "F2"
    v.inputs["Scale"].default_value = 60.0
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 25.0
    n.inputs["Detail"].default_value = 10
    n.inputs["Distortion"].default_value = 2.0
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "FLOAT"
    mix.inputs[0].default_value = 0.5
    nt.links.new(v.outputs["Distance"], mix.inputs[2])
    nt.links.new(n.outputs["Fac"], mix.inputs[3])
    _bump(nt, b, mix.outputs[0], 0.5, 0.004)
    return m

def mat_leather(color="cobalt_d", name=None):
    """Faux-leather (UltraHyde) journal cover: pebbled grain, satin."""
    m, nt, b = _new_mat(name or f"leather_{color}")
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = 0.48
    b.inputs["Coat Weight"].default_value = 0.15
    b.inputs["Coat Roughness"].default_value = 0.4
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.inputs["Scale"].default_value = 700.0
    v.feature = "SMOOTH_F1"
    _bump(nt, b, v.outputs["Distance"], 0.25, 0.0004)
    return m

def mat_powdercoat(color="bone", name=None):
    m, nt, b = _new_mat(name or f"powder_{color}")
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = 0.45
    b.inputs["Coat Weight"].default_value = 0.3
    b.inputs["Coat Roughness"].default_value = 0.25
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 2500.0
    _bump(nt, b, n.outputs["Fac"], 0.08, 0.0002)
    return m

def mat_glass(tint=(0.95, 0.98, 0.97), rough=0.0, ior=1.5, name="glass"):
    m, nt, b = _new_mat(name)
    b.inputs["Base Color"].default_value = tint + (1,) if len(tint) == 3 else tint
    b.inputs["Roughness"].default_value = rough
    b.inputs["IOR"].default_value = ior
    b.inputs["Transmission Weight"].default_value = 1.0
    return m

def mat_liquid(color=(0.55, 0.25, 0.06), density=1.0, name="liquid"):
    """Spirit inside a bottle: clear dielectric + absorption volume for depth colour."""
    m, nt, b = _new_mat(name)
    b.inputs["Base Color"].default_value = (1, 1, 1, 1)
    b.inputs["Roughness"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.36
    b.inputs["Transmission Weight"].default_value = 1.0
    out = nt.nodes.get("Material Output")
    vol = nt.nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = tuple(color[:3]) + (1,)
    vol.inputs["Density"].default_value = density
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    return m

def mat_emission(color="bone", strength=2.0, name=None):
    m, nt, b = _new_mat(name or f"emit_{color}")
    b.inputs["Emission Color"].default_value = rgb(color)
    b.inputs["Emission Strength"].default_value = strength
    return m

# ---------------------------------------------------------------- geometry helpers
def assign(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    return obj

def bevel(obj, width=0.002, segments=3, limit="ANGLE"):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = limit
    mod.harden_normals = False
    return mod

def subsurf(obj, levels=2, render_levels=None):
    mod = obj.modifiers.new("Subsurf", "SUBSURF")
    mod.levels = levels
    mod.render_levels = render_levels or levels
    return mod

def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def rounded_box(name, size, radius=0.004, segments=4, location=(0, 0, 0), mat=None):
    """A box with real bevelled edges (size = full dimensions in metres, origin at base centre)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(location[0], location[1], location[2] + size[2] / 2))
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    bevel(o, radius, segments)
    smooth(o)
    if mat:
        assign(o, mat)
    return o

def lathe(name, profile, segments=96, location=(0, 0, 0), mat=None):
    """Revolve a 2D profile [(radius, z), ...] (bottom -> top) around Z. Great for
    bottles, tumblers, caps. Returns a closed, smooth-shaded mesh."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        ring = []
        for i in range(segments):
            a = 2 * math.pi * i / segments
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    for k in range(len(rings) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            bm.faces.new((rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]))
    if profile[0][0] > 1e-5:
        bm.faces.new(list(reversed(rings[0])))
    if profile[-1][0] > 1e-5:
        bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.location = location
    smooth(o)
    if mat:
        assign(o, mat)
    return o

def text(body, font=FONT_DISPLAY, size=0.05, extrude=0.0, location=(0, 0, 0), rotation=(0, 0, 0),
         align_x="CENTER", align_y="CENTER", mat=None, name=None, to_mesh=True, letter_spacing=1.0):
    cu = bpy.data.curves.new(name or f"txt_{body[:8]}", "FONT")
    cu.body = body
    cu.font = bpy.data.fonts.load(font, check_existing=True)
    cu.size = size
    cu.extrude = extrude
    cu.align_x = align_x
    cu.align_y = align_y
    cu.space_character = letter_spacing
    o = bpy.data.objects.new(name or cu.name, cu)
    bpy.context.scene.collection.objects.link(o)
    o.location = location
    o.rotation_euler = rotation
    if mat:
        cu.materials.append(mat)
    if to_mesh:
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.convert(target="MESH")
        o = bpy.context.active_object
    return o

def logo(size=0.05, location=(0, 0, 0), rotation=(0, 0, 0), mat=None, extrude=0.0, name="logo"):
    """The chainmail wordmark: lowercase 'chainmail' flanked by two interlocked
    links, set in Archivo Expanded. Built as mesh so it can be foil-stamped,
    embroidered (solidify + fabric mat) or printed (tiny extrude)."""
    import bpy as _b
    parts = []
    t = text("chainmail", FONT_DISPLAY, size, extrude, (0, 0, 0), (0, 0, 0), mat=mat, name=name + "_word")
    parts.append(t)
    # word width from bounds
    xs = [v.co.x for v in t.data.vertices]
    half = (max(xs) - min(xs)) / 2
    r_out, r_in = size * 0.26, size * 0.15
    for side in (-1, 1):
        for k in range(2):
            bpy.ops.mesh.primitive_torus_add(major_radius=(r_out + r_in) / 2, minor_radius=(r_out - r_in) / 2,
                                             major_segments=48, minor_segments=12)
            ring = bpy.context.active_object
            ring.scale = (1.35, 0.9, 0.18 if extrude == 0 else max(0.18, extrude / size))
            ring.location = (side * (half + size * (0.32 + k * 0.42)), size * 0.02, 0)
            if mat:
                assign(ring, mat)
            parts.append(ring)
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    o.location = location
    o.rotation_euler = rotation
    smooth(o)
    return o

# ---------------------------------------------------------------- output
def render_to(rel_path, also_preview=True):
    """Render the current scene. Finals go to blender/out/<rel_path> (16-bit PNG);
    run `python3 chainmail/tools/optimize.py` to publish them as WebP into
    site/public/renders/. --preview renders go to blender/previews/<rel_path>."""
    base = PREVIEW_DIR if PREVIEW else OUT_DIR
    out = os.path.join(base, rel_path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.context.scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print(f"[chainmail] wrote {out}")
    return out

def save_blend(rel_path):
    out = os.path.join(ROOT, "blend", rel_path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
    return out
