"""Shared Blender setup for every James Taylor render: one dark studio, one look, the food shaders.

Run any script as:  blender -b -P james-taylor/blender/<script>.py -- [args]
Plain bpy, no add-ons. Units are real metres (a bun is 0.105 m across).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache")
OUT = os.path.join(HERE, "out")


def argv():
    """Arguments after the `--` separator, as a dict of --key value pairs (flags become True)."""
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    d, i = {}, 0
    while i < len(a):
        k = a[i].lstrip("-")
        if i + 1 < len(a) and not a[i + 1].startswith("--"):
            d[k] = a[i + 1]
            i += 2
        else:
            d[k] = True
            i += 1
    return d


def reset(samples=96, transparent=True):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    c = sc.cycles
    c.device = "CPU"
    c.samples = samples
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.04
    c.use_denoising = True
    c.denoiser = "OPENIMAGEDENOISE"
    c.denoising_prefilter = "ACCURATE"
    c.max_bounces = 5
    c.diffuse_bounces = 2
    c.glossy_bounces = 2
    c.transmission_bounces = 2
    c.volume_bounces = 0
    c.transparent_max_bounces = 4
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.blur_glossy = 1.0
    sc.render.film_transparent = transparent
    # PBR Neutral keeps food colours as authored (AgX turns saturated oranges into salmon)
    sc.view_settings.view_transform = "Khronos PBR Neutral"
    sc.view_settings.look = "None"
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    sc.render.image_settings.color_depth = "8"
    sc.render.threads_mode = "AUTO"
    sc.render.use_persistent_data = True
    return sc


def resolution(w, h, pct=100):
    r = bpy.context.scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = int(w), int(h), int(pct)


# ---------------------------------------------------------------- node helpers

def node(nt, kind, loc=(0, 0), **inputs):
    n = nt.nodes.new(kind)
    n.location = loc
    for k, v in inputs.items():
        if k.startswith("_"):
            setattr(n, k[1:], v)
        else:
            n.inputs[k].default_value = v
    return n


def link(nt, a, b, out=0, inp=0):
    nt.links.new(a.outputs[out] if not isinstance(out, str) else a.outputs[out],
                 b.inputs[inp] if not isinstance(inp, str) else b.inputs[inp])


def ramp(nt, stops, loc=(0, 0), interp="LINEAR"):
    """Color ramp from [(pos, (r,g,b,a)), ...]."""
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.location = loc
    cr = r.color_ramp
    cr.interpolation = interp
    while len(cr.elements) > 1:
        cr.elements.remove(cr.elements[-1])
    cr.elements[0].position = stops[0][0]
    cr.elements[0].color = stops[0][1]
    for p, c in stops[1:]:
        e = cr.elements.new(p)
        e.color = c
    return r


def rgb(hexstr, a=1.0):
    """sRGB hex to linear RGBA."""
    hexstr = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(hexstr[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, a)


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = node(nt, "ShaderNodeOutputMaterial", (900, 0))
    bsdf = node(nt, "ShaderNodeBsdfPrincipled", (600, 0))
    link(nt, bsdf, out)
    return m, nt, bsdf


def tex_coord(nt, kind="Object", loc=(-1200, 0)):
    tc = node(nt, "ShaderNodeTexCoord", loc)
    return tc.outputs[kind]


def noise(nt, vec, scale, detail=4.0, rough=0.55, loc=(-900, 0), dim="3D", distortion=0.0):
    n = node(nt, "ShaderNodeTexNoise", loc, Scale=scale, Detail=detail, Roughness=rough, Distortion=distortion)
    n.noise_dimensions = dim
    nt.links.new(vec, n.inputs["Vector"])
    return n


def bump(nt, height_socket, strength, distance, loc=(300, -400), normal=None):
    b = node(nt, "ShaderNodeBump", loc, Strength=strength, Distance=distance)
    nt.links.new(height_socket, b.inputs["Height"])
    if normal is not None:
        nt.links.new(normal, b.inputs["Normal"])
    return b


def math_node(nt, op, a=None, b=None, loc=(0, 0), clamp=False):
    m = node(nt, "ShaderNodeMath", loc)
    m.operation = op
    m.use_clamp = clamp
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            m.inputs[i].default_value = v
        else:
            nt.links.new(v, m.inputs[i])
    return m


def mix_rgb(nt, fac, a, b, blend="MIX", loc=(0, 0)):
    m = node(nt, "ShaderNodeMix", loc)
    m.data_type = "RGBA"
    m.blend_type = blend
    for idx, v in ((0, fac), (6, a), (7, b)):
        if isinstance(v, (int, float)):
            m.inputs[idx].default_value = v
        elif isinstance(v, tuple):
            m.inputs[idx].default_value = v
        else:
            nt.links.new(v, m.inputs[idx])
    return m


# ---------------------------------------------------------------- scene helpers

def world(hdri="studio_small_09", strength=0.35, rotation=0.0, tint=(1, 1, 1, 1)):
    sc = bpy.context.scene
    w = bpy.data.worlds.new("studio")
    sc.world = w
    # a small importance map: the world is mostly for reflections here, and the full-size map
    # costs seconds per frame
    w.cycles.sampling_method = "MANUAL"
    w.cycles.sample_map_resolution = 256
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = node(nt, "ShaderNodeOutputWorld", (600, 0))
    bg = node(nt, "ShaderNodeBackground", (400, 0), Strength=strength)
    env = node(nt, "ShaderNodeTexEnvironment", (0, 0))
    env.image = bpy.data.images.load(os.path.join(CACHE, "hdri", f"{hdri}.hdr"), check_existing=True)
    mp = node(nt, "ShaderNodeMapping", (-200, 0))
    mp.inputs["Rotation"].default_value = (0, 0, rotation)
    tc = node(nt, "ShaderNodeTexCoord", (-400, 0))
    link(nt, tc, mp, "Generated", "Vector")
    link(nt, mp, env, 0, "Vector")
    tintn = mix_rgb(nt, 1.0, env.outputs[0], tint, "MULTIPLY", (200, 0))
    link(nt, tintn, bg, 2, "Color")
    link(nt, bg, out)
    return w


def area(name, loc, target=(0, 0, 0), size=0.5, size_y=None, power=50.0, color=(1, 1, 1), spread=180.0):
    d = bpy.data.lights.new(name, "AREA")
    d.energy = power
    d.color = color
    d.shape = "RECTANGLE"
    d.size = size
    d.size_y = size if size_y is None else size_y
    d.spread = math.radians(spread)
    o = bpy.data.objects.new(name, d)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    aim(o, target)
    return o


def point(name, loc, power=10.0, color=(1, 1, 1), radius=0.02):
    d = bpy.data.lights.new(name, "POINT")
    d.energy = power
    d.color = color
    d.shadow_soft_size = radius
    o = bpy.data.objects.new(name, d)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    return o


def aim(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def camera(loc, target, lens=85.0, fstop=None, focus=None, name="Camera"):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_start = 0.005
    cd.clip_end = 50
    cam = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = loc
    aim(cam, target)
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        if focus is not None:
            cd.dof.focus_distance = focus
        else:
            cd.dof.focus_distance = (Vector(loc) - Vector(target)).length
    bpy.context.scene.camera = cam
    return cam


def mesh_obj(name, verts, faces, mat=None, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.validate()
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    if mat:
        me.materials.append(mat)
    return o


def shadow_catcher(size=4.0, z=0.0):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    p = bpy.context.active_object
    p.name = "ShadowCatcher"
    p.is_shadow_catcher = True
    return p


def append(blend, kind, name):
    """Append one datablock (Object/Material/...) from a .blend."""
    with bpy.data.libraries.load(blend, link=False) as (src, dst):
        setattr(dst, kind, [name])
    item = getattr(dst, kind)[0]
    return item


def append_object(blend, name, link_to_scene=True):
    o = append(blend, "objects", name)
    if link_to_scene:
        bpy.context.scene.collection.objects.link(o)
    return o


def apply_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    for m in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def select_only(obj):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def fast_sss():
    """Burley subsurface instead of random walk on every material: a fraction of the cost, and at
    these scales the difference doesn't show."""
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        for n in m.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED":
                n.subsurface_method = "BURLEY"


def render_still(path):
    fast_sss()
    sc = bpy.context.scene
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def render_anim(folder, start, end, step=1, prefix=""):
    fast_sss()
    sc = bpy.context.scene
    os.makedirs(folder, exist_ok=True)
    sc.frame_start, sc.frame_end, sc.frame_step = start, end, step
    sc.render.filepath = os.path.join(folder, prefix + "####")
    sc.render.use_overwrite = False  # resumable: frames already on disk are skipped
    sc.render.use_placeholder = True
    bpy.ops.render.render(animation=True)


def ease(t):
    """Smoothstep-ish ease in-out on 0..1."""
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease_out(t, p=3.0):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** p


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return tuple(lerp(x, y, t) for x, y in zip(a, b))
