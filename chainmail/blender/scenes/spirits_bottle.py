"""spirits/<id>.png — one 750 ml bottle, 800x1600, upright 3/4 view.
The camera, lights and ground are IDENTICAL for all seven bottles so the cutouts
line up on the site (same base line, same scale: 1 px = same mm in every file).

   blender -b --factory-startup -P blender/scenes/spirits_bottle.py -- --id jameson [--preview] [--close]
   --id all  renders the seven one after another (one process).
   --close   tight camera on the closure + shoulder (preview QA only).
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import vessels

FLAGS = argv_flags()
CLOSE = "--close" in FLAGS
LABEL = "--label" in FLAGS
ID = FLAGS[FLAGS.index("--id") + 1] if "--id" in FLAGS else "all"
# QA only: --crop x0,y0,x1,y1 renders that region of the FINAL frame at full resolution (fractions,
# origin bottom-left) into previews/spirits/<id>_crop.png; --spp N overrides the sample count
CROP = [float(v) for v in FLAGS[FLAGS.index("--crop") + 1].split(",")] if "--crop" in FLAGS else None
SPP = int(FLAGS[FLAGS.index("--spp") + 1]) if "--spp" in FLAGS else None
CLAMP = float(FLAGS[FLAGS.index("--clamp") + 1]) if "--clamp" in FLAGS else None
IDS = list(vessels.BOTTLES) if ID == "all" else ID.split(",")

# 18 deg elevation: a touch lower than the 30-38 deg goods camera on purpose (spirits genre: the
# bottle reads tall and the shoulders/neck aren't foreshortened) but high enough to read the
# liquid surface and the closure tops. Fixed camera + fixed scale for all seven (site row layout).
CAM_AZ, CAM_EL = math.radians(22), math.radians(18)
CAM_TGT, CAM_DIST, CAM_LENS = (0.0, 0.0, 0.170), 0.95, 85


# indirect clamp: 12 left unconverged caustic speckle + red-orange fireflies in the thick heels
# (round 2); 5 keeps the strip-line highlights (transmission-seen emitters, strength 6) intact
# after the PBR Neutral roll-off while killing the rare high-energy TIR paths
GLASS_CLAMP_INDIRECT = 5.0
GLASS_FILTER_GLOSSY = 0.8


def glass_render_settings(samples=512, time_limit=0):
    setup_render(800, 1600, samples=SPP or samples, preview=False if CROP else None)
    s = bpy.context.scene
    c = s.cycles
    c.max_bounces = 24
    c.transmission_bounces = 24      # ~10 glass/liquid interfaces front-to-back; 24 leaves TIR headroom
    c.glossy_bounces = 8
    c.diffuse_bounces = 3
    c.transparent_max_bounces = 32
    c.volume_bounces = 2
    c.sample_clamp_indirect = CLAMP if CLAMP is not None else GLASS_CLAMP_INDIRECT
    c.blur_glossy = GLASS_FILTER_GLOSSY
    c.film_transparent_glass = True
    c.film_transparent_roughness = 0.1
    if not PREVIEW:
        c.adaptive_threshold = 0.01
        c.time_limit = time_limit or 0
    if CROP:
        s.render.use_border = True
        s.render.use_crop_to_border = True
        s.render.border_min_x, s.render.border_min_y, s.render.border_max_x, s.render.border_max_y = CROP
        s.render.image_settings.color_depth = "8"
    return s


def backlight_card(center, az, width=0.60, height=0.76, dist=0.18, strength=1.6, px=10.0, warm=(1.0, 0.975, 0.94),
                   name="BackCard"):
    """Soft-edged emissive card behind the subject, seen ONLY through glass
    (transmission rays). Gives liquids their true colour and a luminous core on any
    page background, with no hard edge anywhere (radial falloff to black)."""
    bpy.ops.mesh.primitive_plane_add(size=1)
    p = bpy.context.active_object
    p.name = name
    p.scale = (width, height, 1)
    view = Vector((-math.sin(az), math.cos(az), 0.0))
    p.location = Vector(center) + view * dist
    p.rotation_euler = (math.pi / 2, 0, az)
    m = bpy.data.materials.new(name + "Mat")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = tuple(warm) + (1,)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    def falloff(sock, power):
        a = nt.nodes.new("ShaderNodeMath"); a.operation = "MULTIPLY_ADD"
        nt.links.new(sock, a.inputs[0]); a.inputs[1].default_value = 2.0; a.inputs[2].default_value = -1.0
        q = nt.nodes.new("ShaderNodeMath"); q.operation = "MULTIPLY"
        nt.links.new(a.outputs[0], q.inputs[0]); nt.links.new(a.outputs[0], q.inputs[1])
        o = nt.nodes.new("ShaderNodeMath"); o.operation = "SUBTRACT"; o.use_clamp = True
        o.inputs[0].default_value = 1.0; nt.links.new(q.outputs[0], o.inputs[1])
        pw = nt.nodes.new("ShaderNodeMath"); pw.operation = "POWER"
        nt.links.new(o.outputs[0], pw.inputs[0]); pw.inputs[1].default_value = power
        return pw.outputs[0]
    fx = falloff(sep.outputs["X"], px)
    fy = falloff(sep.outputs["Y"], 1.2)
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
    nt.links.new(fx, mul.inputs[0]); nt.links.new(fy, mul.inputs[1])
    st = nt.nodes.new("ShaderNodeMath"); st.operation = "MULTIPLY"
    nt.links.new(mul.outputs[0], st.inputs[0]); st.inputs[1].default_value = strength
    nt.links.new(st.outputs[0], em.inputs["Strength"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    p.data.materials.append(m)
    p.visible_camera = False
    p.visible_diffuse = False
    p.visible_glossy = False
    p.visible_shadow = False
    p.visible_volume_scatter = False
    return p


# Dark-field lighting for the ink spirits section.
# BACKLIGHT[kind] = (card strength, horizontal falloff power, use lobed wrap card instead of the flat back card)
#   * clear spirits (vodka / tequila / mezcal): the transmission-only back card is dimmed to a faint glow
#     so the bottle core reads as clear glass over ink (dark core); the shape is drawn by the two
#     glossy/transmission-only edge strips (bright white lines down each wall).
#   * coloured spirits (scotch / bourbon / irish): a brighter card so the liquid colour reads; the square
#     scotch gets a lobed wrap card instead (see wrap_card / SCOTCH_LOBES) and is turned (SPIN).
BACKLIGHT = {"kettle-one": (0.0, 40, 0.0), "manojo": (0.30, 16, 0.0), "johnnie-black": (1.9, 2, 1),
             "jameson": (1.05, 6, 0.0), "four-roses": (1.1, 10, 0.0), "casamigos": (0.0, 30, 0.0),
             "maestro-dobel": (0.0, 40, 0.0)}
# per-bottle turn about Z (deg) in the single shots. The square scotch is turned so the camera sees
# its front and side faces at ~45 deg each: at the shared 22 deg camera azimuth the side face is hit
# at 71 deg incidence, its refracted rays TIR off the back wall and the face can only show
# reflections (grey) -- at 45 deg both faces transmit the liquid.
SPIN = {"johnnie-black": -23.0}
EDGE_STRIP_ANGLE = math.radians(65)     # strips sit back-left / back-right, +-65 deg off the view axis


def emissive_strip(name, loc, target, w=0.03, h=0.70, strength=6.0, color=(1.0, 0.99, 0.97),
                   glossy=True, transmission=True):
    """Thin emissive card visible only to glossy/transmission rays (never camera, diffuse or shadow):
    draws crisp white edge lines down glass walls without lighting the floor or the labels."""
    bpy.ops.mesh.primitive_plane_add(size=1)
    p = bpy.context.active_object
    p.name = name
    p.scale = (w, h, 1)
    p.location = loc
    d = Vector(target) - Vector(loc)
    d.z = 0.0
    p.rotation_euler = (math.pi / 2, 0, math.atan2(d.y, d.x) - math.pi / 2)
    m = bpy.data.materials.new(name + "Mat")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = tuple(color) + (1,)
    # soft vertical ends so a strip never shows a hard cut in a reflection
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    a = nt.nodes.new("ShaderNodeMath"); a.operation = "PINGPONG"
    nt.links.new(sep.outputs["Y"], a.inputs[0]); a.inputs[1].default_value = 0.5
    sm = nt.nodes.new("ShaderNodeMapRange"); sm.interpolation_type = "SMOOTHSTEP"
    nt.links.new(a.outputs[0], sm.inputs["Value"])
    sm.inputs["From Min"].default_value = 0.0; sm.inputs["From Max"].default_value = 0.18
    st = nt.nodes.new("ShaderNodeMath"); st.operation = "MULTIPLY"
    nt.links.new(sm.outputs["Result"], st.inputs[0]); st.inputs[1].default_value = strength
    nt.links.new(st.outputs[0], em.inputs["Strength"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    p.data.materials.append(m)
    p.visible_camera = False
    p.visible_diffuse = False
    p.visible_shadow = False
    p.visible_volume_scatter = False
    p.visible_glossy = glossy
    p.visible_transmission = transmission
    return p


def edge_strips(center, view_az, dist=0.38, zc=0.17, strength=6.0, prefix="Edge"):
    """Two tall thin strips behind the subject at +-EDGE_STRIP_ANGLE from the camera axis."""
    c = Vector((center[0], center[1], zc))
    out = []
    for sgn, nm in ((-1, "L"), (1, "R")):
        a = view_az + sgn * EDGE_STRIP_ANGLE
        d = Vector((-math.sin(a), math.cos(a), 0.0))      # away from camera, rotated left/right
        out.append(emissive_strip(f"{prefix}{nm}", c + d * dist, c, strength=strength))
    return out


def wrap_card(center, az, lobes, radius=0.20, height=0.70, strength=1.6, name="WrapCard"):
    """Transmission-only cylinder all around the subject (never seen by the camera, nor by glossy,
    diffuse or shadow rays). Emission = strength * sum of lobes, each lobe (dir, power, gain) =
    gain * max(0, dot(d, dir))^power with d the horizontal direction from the axis in the card's
    local frame (+Y = straight away from the camera at azimuth `az`, +X = camera right).

    Why (ray-traced, see SPIN): with the square scotch turned 45/45 to the camera, the rays through
    the middle of each face exit straight back, but those through the outer halves TIR off the far
    wall and leave exactly sideways (+-92 deg from the view axis, ~9 cm of liquid). A flat back card
    misses those (the outer halves read as dead grey glass); a uniform wrap also lights every inner
    Fresnel reflection (faces wash out milky). So: a broad back lobe + two very narrow side lobes."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=radius, depth=height, end_fill_type="NOTHING",
                                        location=(center[0], center[1], center[2]))
    p = bpy.context.active_object
    p.name = name
    p.rotation_euler = (0, 0, az)            # local +Y = away from the camera
    m = bpy.data.materials.new(name + "Mat")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (1.0, 0.975, 0.94, 1)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    def M(op, a, b=None, c=None):
        n = nt.nodes.new("ShaderNodeMath"); n.operation = op
        for i, v in enumerate((a, b, c)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                nt.links.new(v, n.inputs[i])
        return n.outputs[0]
    tot = None
    for (dx, dy), pw, gain in lobes:
        L = math.hypot(dx, dy)
        dx, dy = dx / L, dy / L
        dot = M("MULTIPLY_ADD", sep.outputs["X"], dx / radius, M("MULTIPLY", sep.outputs["Y"], dy / radius))
        lobe = M("MULTIPLY", M("POWER", M("MAXIMUM", dot, 0.0), pw), gain)
        tot = lobe if tot is None else M("ADD", tot, lobe)
    zf = M("SUBTRACT", 1.0, M("POWER", M("DIVIDE", sep.outputs["Z"], height / 2), 2.0))
    v = M("MULTIPLY", M("MULTIPLY", tot, M("MAXIMUM", zf, 0.0)), strength)
    nt.links.new(v, em.inputs["Strength"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    p.data.materials.append(m)
    for attr in ("visible_camera", "visible_diffuse", "visible_glossy", "visible_shadow",
                 "visible_volume_scatter"):
        setattr(p, attr, False)
    return p


# lobes for the square scotch (card-local: +Y away from camera, +X camera right)
SCOTCH_LOBES = [((0.0, 1.0), 2.0, 1.0), ((-1.0, 0.0), 30.0, 0.9), ((1.0, 0.0), 30.0, 0.9)]


KEY_LEFT_DEG, KEY_EL_DEG = 26.0, 64.0


def aim_key(target, view_az, scale, left_deg=KEY_LEFT_DEG, el_deg=KEY_EL_DEG):
    """Re-seat the studio key: still upper-left of the lens, but only ~26 deg off the view axis and
    ~64 deg up (studio() puts it ~70 deg left, ~43 deg up). A 0.3 m bottle then throws its shadow
    mostly straight back (hidden behind the glass, foreshortened) instead of 0.3 m sideways out of
    the narrow 800 px frame."""
    k = bpy.data.objects["Key"]
    t = Vector(target)
    d = (k.location - t).length
    a = (view_az - math.pi / 2) - math.radians(left_deg)      # camera sits at angle view_az - 90 deg
    el = math.radians(el_deg)
    k.location = t + Vector((math.cos(a) * math.cos(el), math.sin(a) * math.cos(el), math.sin(el))) * d
    look_at(k, t)
    return k


def bottle_lights(kind, target=(0, 0, 0.16), az=None, scale=0.72):
    """House rig (key upper-left, rim back-right) + dark-field glass lights: a transmission-only
    back card (dim for clear spirits, brighter for coloured ones) and two glossy/transmission-only
    edge strips at +-65 deg behind, which give each wall a crisp white line on ink."""
    az = CAM_AZ if az is None else az
    studio("soft", key=1.0, hdri_strength=0.30, scale=scale, target=target)
    bpy.data.objects["Rim"].data.use_shadow = False   # house rule: rim lights edges, no smudge
    aim_key(target, az, scale)
    st, px, side = BACKLIGHT.get(kind, (1.2, 10, 0.0))
    if side > 0:
        # square scotch: a wrap card instead of the flat back card (see wrap_card)
        wrap_card((0, 0, 0.13), az, SCOTCH_LOBES, strength=st)
    elif st > 0:
        backlight_card((0, 0, 0.13), az, strength=st, px=px)
    edge_strips((0, 0), az)


# no time cap (round 2: the 1500 s ceiling stopped the thick heels short of 512 spp -> speckle)
FINAL_TIME_LIMIT = 0


def build_scene(kind, lineup=False):
    reset()
    glass_render_settings(time_limit=FINAL_TIME_LIMIT)
    bottle_lights(kind)
    sc = shadow_catcher()
    sc.visible_transmission = False     # refracted rays pass under to the back card
    # glossy rays skip the catcher too: at 18 deg every vertical chrome facet / glass wall mirrors the
    # floor, and a lit bone catcher turned the polished caps into flat white "plastic". They now
    # mirror the dark studio below the horizon (what the cutout sits on in the ink section).
    sc.visible_glossy = False
    b = vessels.bottle(kind)
    b.rotation_euler.z = math.radians(SPIN.get(kind, 0.0))
    vessels.contact_occluder(b, kind)
    return b


def main():
    for kind in IDS:
        build_scene(kind)
        if CLOSE or LABEL:
            info = vessels.BOTTLES[kind]
            h = info.get("_height", 0.3)
            if CLOSE:
                tgt, dist, lens = (0.0, 0.0, h - 0.045), 0.42, 100
            else:
                L = info["label"][1]
                tgt, dist, lens = (0.0, 0.0, 0.5 * (L["z0"] + L["z1"])), 0.40, 100
        else:
            tgt, dist, lens = CAM_TGT, CAM_DIST, CAM_LENS
        el = CAM_EL
        loc = (tgt[0] + dist * math.sin(CAM_AZ) * math.cos(el), tgt[1] - dist * math.cos(CAM_AZ) * math.cos(el),
               tgt[2] + dist * math.sin(el))
        camera(loc=loc, target=tgt, lens=lens)
        suffix = "_close" if CLOSE else ("_label" if LABEL else "")
        if CROP:
            import common
            common.PREVIEW = True          # QA crops never land in the published out/ folder
            suffix = "_crop"
        out = render_to(f"spirits/{kind}{suffix}.png")
        if not (CLOSE or LABEL or CROP):
            # tall narrow frame: wide side bands, thin top/bottom bands (bases sit ~7 % above the edge)
            vessels.fade_alpha_edges(out, margin=(0.16, 0.045), edge=(0.01, 0.004))


if __name__ == "__main__":
    main()
