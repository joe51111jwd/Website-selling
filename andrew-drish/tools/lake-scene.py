"""Legacy Lake at dawn: dock, mist, pine treeline. Usage:
python scene.py OUTDIR W H SAMPLES F0 F1 [STEP]"""
import bpy, math, random, sys, os
from mathutils import Vector

out, W, H, SPP, F0, F1 = sys.argv[1], *map(int, sys.argv[2:7])
STEP = int(sys.argv[7]) if len(sys.argv) > 7 else 1
NFRAMES = int(os.environ.get('NF','48'))
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SPP
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4
sc.cycles.volume_bounces = 0
sc.cycles.volume_step_rate = 4.0
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
sc.view_settings.exposure = 0.0
sc.frame_start, sc.frame_end = 1, NFRAMES

def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links

# ---------- sky ----------
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
sky = wn.new('ShaderNodeTexSky')
for t in ('MULTIPLE_SCATTERING', 'NISHITA', 'SINGLE_SCATTERING'):
    try: sky.sky_type = t; break
    except Exception: pass
SUN_EL, SUN_AZ = math.radians(float(os.environ.get('SEL','1.6'))), math.radians(float(os.environ.get('SAZ','180')))
for k, v in dict(sun_elevation=SUN_EL, sun_rotation=SUN_AZ, altitude=200, air_density=1.6, dust_density=4.0, ozone_density=1.0, sun_size=math.radians(1.2), sun_intensity=0.6).items():
    if hasattr(sky, k): setattr(sky, k, v)
bg = wn['Background']; bg.inputs[1].default_value = 0.35
wl.new(sky.outputs[0], bg.inputs[0])

sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 2.2; sun.color = (1.0, 0.62, 0.36); sun.angle = math.radians(1.5)
so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so)
so.rotation_euler = (math.radians(90) - SUN_EL, 0, SUN_AZ + math.radians(180))
fill = bpy.data.lights.new('fill', 'SUN'); fill.energy = 0.25; fill.color = (0.55, 0.65, 1.0)
fo = bpy.data.objects.new('fill', fill); sc.collection.objects.link(fo); fo.rotation_euler = (math.radians(35), 0, math.radians(20))

# ---------- water ----------
bpy.ops.mesh.primitive_plane_add(size=4000, location=(0, 0, 0)); water = bpy.context.object
m, n, l = mat('water'); p = n['Principled BSDF']
p.inputs['Base Color'].default_value = (0.004, 0.006, 0.008, 1)
p.inputs['Roughness'].default_value = 0.035
p.inputs['IOR'].default_value = 1.333
p.inputs['Specular IOR Level'].default_value = 0.65
tc = n.new('ShaderNodeTexCoord'); mp = n.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.35, 1.2, 1)
nz = n.new('ShaderNodeTexNoise'); nz.noise_dimensions = '4D'; nz.inputs['Scale'].default_value = 6; nz.inputs['Detail'].default_value = 6
nz.inputs['W'].default_value = 0
bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.035; bump.inputs['Distance'].default_value = 0.05
l.new(tc.outputs['Object'], mp.inputs[0]); l.new(mp.outputs[0], nz.inputs['Vector']); l.new(nz.outputs['Fac'], bump.inputs['Height']); l.new(bump.outputs[0], p.inputs['Normal'])
fc = nz.inputs['W']; fc.default_value = 0; fc.keyframe_insert('default_value', frame=1); fc.default_value = 1.2; fc.keyframe_insert('default_value', frame=NFRAMES)
water.data.materials.append(m)

# ---------- far shore: hills + pines ----------
def hz(x, y):
    d = min(max((y - 440) / 160, 0), 1)
    return d * (7 + 5 * math.sin(x * 0.004) + 3 * math.sin(x * 0.013 + 1) + 1.5 * math.sin(x * 0.041)) - 0.5
bpy.ops.mesh.primitive_grid_add(x_subdivisions=200, y_subdivisions=20, size=1, location=(0, 0, 0)); hill = bpy.context.object
hill.scale = (2400, 160, 1); hill.location = (0, 520, -0.5)
bpy.ops.object.transform_apply(scale=True)
for v in hill.data.vertices:
    x, y = v.co.x, v.co.y
    d = (y + 80) / 160
    v.co.z = hz(x, y + 520)
m, n, l = mat('land'); n['Principled BSDF'].inputs['Base Color'].default_value = (0.012, 0.018, 0.012, 1); n['Principled BSDF'].inputs['Roughness'].default_value = 0.9
hill.data.materials.append(m)

pm, pn, pl = mat('pine'); pn['Principled BSDF'].inputs['Base Color'].default_value = (0.006, 0.014, 0.008, 1); pn['Principled BSDF'].inputs['Roughness'].default_value = 0.85
def pine_mesh():
    bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=1, depth=1, location=(0, 0, 0)); base = bpy.context.object
    objs = [base]; base.scale = (1, 1, 1.0); base.location.z = 0.75
    for i, (r, z, h) in enumerate([(0.82, 1.35, 0.95), (0.62, 1.9, 0.85), (0.42, 2.4, 0.75)]):
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=r, depth=h, location=(0, 0, z)); objs.append(bpy.context.object)
    bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.08, depth=0.6, location=(0, 0, 0.1)); objs.append(bpy.context.object)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = base; bpy.ops.object.join()
    base.data.materials.append(pm); me = base.data
    bpy.data.objects.remove(base); return me
pine = pine_mesh()
def put_pine(x, y, s):
    o = bpy.data.objects.new('p', pine); sc.collection.objects.link(o)
    o.location = (x, y, 0); s2 = s * random.uniform(0.85, 1.2)
    o.scale = (s * 0.32 * random.uniform(.8, 1.1), s * 0.32, s2 * 0.62); o.rotation_euler.z = random.random() * 6.28
# far treeline on the hills
for i in range(2600):
    x = random.uniform(-1000, 1000); y = random.uniform(445, 600)
    put_pine(x, y, random.uniform(11, 20))
for o in [o for o in sc.collection.objects if o.name.startswith('p')]:
    o.location.z = hz(o.location.x, o.location.y) - 1
# a nearer wooded point on the left, like an island
for i in range(260):
    a = random.random() * 6.28; r = math.sqrt(random.random()) * 38
    put_pine(-95 + r * math.cos(a) * 1.6, 210 + r * math.sin(a), random.uniform(9, 17) * (1 - r / 60))
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(-95, 210, -2)); isl = bpy.context.object; isl.scale = (62, 40, 4); isl.data.materials.append(bpy.data.materials['land'])
# near-shore trees framing the right edge

# ---------- dock ----------
wm, wn2, wl2 = mat('wood'); wp = wn2['Principled BSDF']
wave = wn2.new('ShaderNodeTexWave'); wave.inputs['Scale'].default_value = 1.6; wave.inputs['Distortion'].default_value = 6; wave.inputs['Detail'].default_value = 4
wtc = wn2.new('ShaderNodeTexCoord'); wmap = wn2.new('ShaderNodeMapping'); wmap.inputs['Scale'].default_value = (0.25, 6, 1)
wl2.new(wtc.outputs['Object'], wmap.inputs[0]); wl2.new(wmap.outputs[0], wave.inputs['Vector'])
ramp = wn2.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (0.05, 0.04, 0.032, 1); ramp.color_ramp.elements[1].color = (0.16, 0.13, 0.10, 1)
wl2.new(wave.outputs['Fac'], ramp.inputs[0]); wl2.new(ramp.outputs[0], wp.inputs['Base Color'])
wp.inputs['Roughness'].default_value = 0.6
wb = wn2.new('ShaderNodeBump'); wb.inputs['Strength'].default_value = 0.25; wl2.new(wave.outputs['Fac'], wb.inputs['Height']); wl2.new(wb.outputs[0], wp.inputs['Normal'])
DOCK_LEN, PLANK, GAP, WID = 34, 0.16, 0.018, 1.8
y = -2
while y < DOCK_LEN:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(random.uniform(-.02, .02), y + PLANK / 2, 0.62 + random.uniform(-.006, .006)))
    o = bpy.context.object; o.scale = (WID + random.uniform(-.03, .03), PLANK, 0.035); o.rotation_euler.z = random.uniform(-.008, .008)
    o.data.materials.append(wm); y += PLANK + GAP
for yy in range(-2, DOCK_LEN + 1, 3):
    for xx in (-WID / 2 + 0.06, WID / 2 - 0.06):
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.085, depth=2.2, location=(xx, yy, -0.4)); bpy.context.object.data.materials.append(wm)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, yy, 0.54)); o = bpy.context.object; o.scale = (WID, 0.09, 0.09); o.data.materials.append(wm)
for xx in (-WID / 2 + 0.05, WID / 2 - 0.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(xx, DOCK_LEN / 2 - 1, 0.5)); o = bpy.context.object; o.scale = (0.08, DOCK_LEN + 2, 0.1); o.data.materials.append(wm)

# ---------- mist ----------
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 300, 6)); fog = bpy.context.object; fog.scale = (2000, 640, 12)
fm, fn, fl = mat('fog'); fn.remove(fn['Principled BSDF'])
vol = fn.new('ShaderNodeVolumePrincipled'); vol.inputs['Color'].default_value = (1.0, 0.86, 0.74, 1); vol.inputs['Anisotropy'].default_value = 0.55
tco = fn.new('ShaderNodeTexCoord'); sep = fn.new('ShaderNodeSeparateXYZ'); fl.new(tco.outputs['Object'], sep.inputs[0])
mr = fn.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -0.5; mr.inputs['From Max'].default_value = 0.15; mr.inputs['To Min'].default_value = 1; mr.inputs['To Max'].default_value = 0
fl.new(sep.outputs['Z'], mr.inputs['Value'])
fnz = fn.new('ShaderNodeTexNoise'); fnz.inputs['Scale'].default_value = 3; fnz.noise_dimensions = '4D'
fmp = fn.new('ShaderNodeMapping'); fmp.inputs['Scale'].default_value = (1, 3, 6); fl.new(tco.outputs['Object'], fmp.inputs[0]); fl.new(fmp.outputs[0], fnz.inputs['Vector'])
fW = fnz.inputs['W']; fW.default_value = 0; fW.keyframe_insert('default_value', frame=1); fW.default_value = 0.4; fW.keyframe_insert('default_value', frame=NFRAMES)
mul = fn.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; fl.new(mr.outputs[0], mul.inputs[0]); fl.new(fnz.outputs['Fac'], mul.inputs[1])
dens = fn.new('ShaderNodeMath'); dens.operation = 'MULTIPLY'; dens.inputs[1].default_value = 0.022; fl.new(mul.outputs[0], dens.inputs[0])
fl.new(dens.outputs[0], vol.inputs['Density'])
fl.new(vol.outputs[0], fn['Material Output'].inputs['Volume'])
fog.data.materials.append(fm)

# ---------- camera: glide down the dock toward the sun ----------
cam = bpy.data.cameras.new('cam'); cam.lens = 30; cam.clip_end = 5000
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
cam.dof.use_dof = True; cam.dof.aperture_fstop = 4.0
def ease(t): return t * t * (3 - 2 * t)
for f in range(1, NFRAMES + 1):
    t = ease((f - 1) / (NFRAMES - 1))
    co.location = (0.0 + 0.25 * math.sin(t * 3.1), -7 + t * 33, 1.55 + 0.35 * t)
    target = Vector((0 - 4 * t, 120, 4.0 - 2 * t))
    co.rotation_euler = (target - co.location).to_track_quat('-Z', 'Y').to_euler()
    co.keyframe_insert('location', frame=f); co.keyframe_insert('rotation_euler', frame=f)
    cam.dof.focus_distance = 12 + 60 * t; cam.dof.keyframe_insert('focus_distance', frame=f)

os.makedirs(out, exist_ok=True)
sc.render.image_settings.file_format = 'PNG'
for f in range(F0, F1 + 1, STEP):
    sc.frame_set(f)
    sc.render.filepath = os.path.join(out, f'f{f:03d}.png')
    bpy.ops.render.render(write_still=True)
    print('done', f, flush=True)
