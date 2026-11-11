"""goods/journal.png — four UltraHyde journals (Blue / Purple / Red / Black on top) fanned on top of each other,
3/4 high angle. blender -b --factory-startup -P blender/scenes/goods_journal.py -- [--preview] [--close]"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
from mathutils import Matrix
import accessories as acc

CLOSE = "--close" in argv_flags()
reset()
setup_render(1600, 1600, samples=256, exposure=0.0)   # Khronos PBR Neutral: true swatches, no exposure hack
c = bpy.context.scene.cycles
c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 6, 2, 2
c.transmission_bounces, c.transparent_max_bounces = 2, 4
if not PREVIEW:
    c.adaptive_threshold = 0.01
studio("soft", key=0.75, hdri_strength=0.4, rotation_deg=30, target=(0, 0, 0.03), scale=0.5)
key = bpy.data.objects["Key"]
key.data.size = key.data.size_y = 0.7
key.location = (-1.0, -0.45, 1.25)
look_at(key, (0, 0, 0.03))
key.data.energy *= float(os.environ.get("KEYK", "0.85"))
bpy.data.objects["Rim"].data.use_shadow = False
acc.neutral_world(0.3)
shadow_catcher()

J = acc.JOURNAL
step_z = J["Tp"] + 2 * J["tc"] + J["el_t"] + 0.0002
pivot = Vector((-J["Wc"] / 2 + 0.012, -J["Lc"] / 2 + 0.010, 0))
books = []
for i, (col, ang, rl) in enumerate((("Blue", -21.0, 0.034), ("Purple", -8.5, 0.040), ("Red", 4.0, 0.050),
                                    ("Black", 15.0, 0.060))):
    j = acc.journal(col, ribbon_len=rl)
    bpy.context.view_layer.update()
    R = Matrix.Rotation(math.radians(ang), 4, "Z")
    loc = j.location.copy()
    j.location = pivot + (R.to_3x3() @ (loc - pivot))
    j.rotation_euler.z = math.radians(ang)
    j.location.z = loc.z + i * step_z
    books.append(j)
bpy.context.view_layer.update()
acc.drape_ribbons(books)                 # ribbon tails fall onto the cover below / the floor

AZ, EL = 20.0, 42.0

def foil_card(cam, book, energy=float(os.environ.get("CARDE", "0.05"))):
    """Hidden reflection card for the chrome foil: a small strip at the mirror reflection of the
    camera ray through the top cover's logo, seen only in reflections and linked to the foil decals.
    Small solid angle -> the near-mirror foil catches a bright streak while the satin leather
    (rough lobe) only picks up a faint sheen."""
    J = acc.JOURNAL
    Tt = J["Tp"] + 2 * J["tc"]
    # aim at the middle of the word (x_logo = 0.006 is the word centre; aiming at its right end left
    # the 'y' outside the card's reflection -> one dead grey letter)
    logo = book.matrix_world @ Vector((0.006 + float(os.environ.get("CARDDX", "0.006")), 0.012, Tt))
    v = (logo - cam.location).normalized()
    r = Vector((v.x, v.y, -v.z))
    # a graded emissive card (mesh light) instead of a flat area light: the mirror foil picks up a
    # soft dark-to-bright sweep across the word, so it reads as polished chrome, not white print
    W_, H_ = float(os.environ.get("CARDW", "0.40")), 0.08
    bpy.ops.mesh.primitive_plane_add(size=1.0)
    card = bpy.context.active_object; card.name = "FoilCard"
    card.scale = (W_, H_, 1.0)
    card.location = logo + r * 0.9
    look_at(card, logo)
    m = bpy.data.materials.new("FoilCardEmit"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    o_ = nt.nodes.new("ShaderNodeOutputMaterial"); em = nt.nodes.new("ShaderNodeEmission")
    tc = nt.nodes.new("ShaderNodeTexCoord"); sx = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange")
    flip = os.environ.get("CARDFLIP", "1") == "1"
    mr.inputs["To Min"].default_value = 1.15 if flip else 0.25
    mr.inputs["To Max"].default_value = 0.25 if flip else 1.15
    mr.interpolation_type = "SMOOTHSTEP"
    nt.links.new(tc.outputs["Generated"], sx.inputs["Vector"]); nt.links.new(sx.outputs["X"], mr.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = energy / 0.05 * float(os.environ.get("CARDK", "1.3"))
    nt.links.new(mr.outputs["Result"], mul.inputs[0]); nt.links.new(mul.outputs[0], em.inputs["Strength"])
    em.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    nt.links.new(em.outputs["Emission"], o_.inputs["Surface"])
    card.data.materials.append(m)
    for attr in ("visible_diffuse", "visible_transmission", "visible_volume_scatter", "visible_shadow"):
        setattr(card, attr, False)
    card.visible_camera = False
    # linked to the foil decals ONLY: the satin leather never sees the card (no greyed covers)
    foils = [o for o in bpy.data.objects if o.name.startswith("JournalFoil")]
    lc = bpy.data.collections.new("foil_receivers")
    for o in foils:
        lc.objects.link(o)
    card.light_linking.receiver_collection = lc
    return card

if CLOSE:
    import numpy as np
    top = books[-1]
    cov = [o for o in top.children if o.name.startswith("JournalCover")][0]
    M = np.array(cov.matrix_world)
    co = np.array([v.co[:] for v in cov.data.vertices])
    if os.environ.get("CLOSE_TAIL"):
        sel = co[(co[:, 0] < 0.02) & (co[:, 1] < -0.07)]
    else:
        sel = co[(co[:, 0] > -0.03) & (co[:, 1] < 0.035) & (co[:, 1] > -0.115)]
    sel = sel @ M[:3, :3].T + M[:3, 3]
    cam = acc.frame_camera(sel, az_deg=20, el_deg=40, lens=100, pad=0.0)
    foil_card(cam, books[-1])
    bpy.context.scene.render.resolution_percentage = int(os.environ.get("PCT", "50")) if PREVIEW else 100
    render_to("goods/journal_close.png")
else:
    import numpy as np
    pts = np.vstack([acc._all_mesh_points(o, 3) for o in books] + [acc.shadow_footprint(books, stride=8)])
    cam = acc.frame_camera(pts, az_deg=AZ, el_deg=EL, lens=85, pad=0.07)
    foil_card(cam, books[-1])
    if os.environ.get("CROP"):                     # detail check: full-res border render of a region
        x0, x1, y0, y1 = map(float, os.environ["CROP"].split(","))
        r = bpy.context.scene.render
        r.resolution_percentage = 100
        r.use_border = True; r.use_crop_to_border = True
        r.border_min_x, r.border_max_x, r.border_min_y, r.border_max_y = x0, x1, y0, y1
        render_to("goods/journal_crop.png")
        raise SystemExit
    out = render_to("goods/journal.png")
    print("BORDER_ALPHA raw", acc.border_alpha(out))
    acc.fade_border(out)
    print("BORDER_ALPHA", acc.border_alpha(out))
