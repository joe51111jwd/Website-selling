# Blender smoke test: lit 3D type on a plane, Cycles on CPU with denoising.
# Run: blender -b -P tools/smoke_test.py -- <out.png> <samples>
import bpy, sys, time
argv = sys.argv[sys.argv.index('--') + 1:]
out, samples = argv[0], int(argv[1])

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = samples
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1440, 900
sc.view_settings.view_transform = 'AgX'

bpy.ops.object.text_add(location=(0, 0, 0))
t = bpy.context.object
t.data.body = 'UP-SIDE-DOWN'
t.data.extrude = 0.12
t.data.bevel_depth = 0.01
t.data.align_x = 'CENTER'
m = bpy.data.materials.new('ink'); m.use_nodes = True
m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.05, 0.2, 0.1, 1)
m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.45
t.data.materials.append(m)
t.rotation_euler = (1.5708, 0, 0)

bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -0.01))
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 2, 0), rotation=(1.5708, 0, 0))

bpy.ops.object.light_add(type='AREA', location=(-3, -4, 5))
L = bpy.context.object; L.data.energy = 900; L.data.size = 3
L.rotation_euler = (0.9, 0, -0.6)

bpy.ops.object.camera_add(location=(0, -9, 2.2), rotation=(1.38, 0, 0))
sc.camera = bpy.context.object
sc.render.filepath = out
t0 = time.time()
bpy.ops.render.render(write_still=True)
print('RENDER_SECONDS', round(time.time() - t0, 1))
