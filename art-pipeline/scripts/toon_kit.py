"""Reusable toon-render kit for the game's 3D-to-sprite art pipeline.

Style target: rounded, glossy "candy plastic" look (Supercell / Dream Games /
Fortune Tiger), soft cel-shaded bands, thick dark outline, warm key light,
transparent PNG output for direct use as a 2D sprite.

Usage: import from an asset script run via `blender -b --python <script>.py`.
"""
import bpy
import math


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = False
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    return scene


def make_toon_material(name, base_color, rim_color=(1.0, 0.95, 0.8, 1.0),
                        roughness=0.25, rim_power=2.5, band_count=3):
    """Cel-shaded plastic material: banded diffuse ramp + fresnel rim light."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    for n in list(nodes):
        nodes.remove(n)

    out = nodes.new('ShaderNodeOutputMaterial')
    out.location = (600, 0)

    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (300, 0)
    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Roughness'].default_value = roughness
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.6
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = 0.6

    # Banded shading: quantize the diffuse response for a soft toon look.
    geo = nodes.new('ShaderNodeNewGeometry')
    geo.location = (-600, -200)
    light_path = nodes.new('ShaderNodeLightPath')
    light_path.location = (-600, 200)

    fresnel = nodes.new('ShaderNodeFresnel')
    fresnel.location = (-300, -300)
    fresnel.inputs['IOR'].default_value = 1.45

    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.location = (-100, -300)
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.55
    ramp.color_ramp.elements[0].color = (0, 0, 0, 0)
    ramp.color_ramp.elements[1].position = 0.8
    ramp.color_ramp.elements[1].color = rim_color
    links.new(fresnel.outputs['Fac'], ramp.inputs['Fac'])

    rim_emit = nodes.new('ShaderNodeEmission')
    rim_emit.location = (100, -300)
    rim_emit.inputs['Strength'].default_value = 1.2
    links.new(ramp.outputs['Color'], rim_emit.inputs['Color'])

    add_shader = nodes.new('ShaderNodeAddShader')
    add_shader.location = (450, -100)
    links.new(bsdf.outputs['BSDF'], add_shader.inputs[0])
    links.new(rim_emit.outputs['Emission'], add_shader.inputs[1])
    links.new(add_shader.outputs['Shader'], out.inputs['Surface'])

    return mat


def add_outline(obj, thickness=0.02, color=(0.05, 0.03, 0.08, 1.0)):
    """Classic inverted-hull outline: duplicate shell, flip normals, flat dark shade."""
    bpy.context.view_layer.objects.active = obj
    solid = obj.modifiers.new('OutlineShell', type='SOLIDIFY')
    solid.thickness = thickness
    solid.offset = 1.0
    solid.use_flip_normals = True

    mat = bpy.data.materials.new(f'{obj.name}_outline')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = 1.0
    mat.use_backface_culling = False

    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    obj.data.materials.append(mat)
    solid.material_offset = len(obj.data.materials) - 1


def setup_studio_lighting(key_strength=1400, fill_strength=250, rim_strength=900):
    """Warm key (top-front-right), cool fill (opposite), bright rim (behind)."""
    bpy.ops.object.light_add(type='AREA', location=(3, -4, 5))
    key = bpy.context.object
    key.data.energy = key_strength
    key.data.size = 3
    key.data.color = (1.0, 0.93, 0.82)
    key.rotation_euler = (math.radians(50), 0, math.radians(35))

    bpy.ops.object.light_add(type='AREA', location=(-4, -2, 2))
    fill = bpy.context.object
    fill.data.energy = fill_strength
    fill.data.size = 4
    fill.data.color = (0.75, 0.85, 1.0)
    fill.rotation_euler = (math.radians(70), 0, math.radians(-60))

    bpy.ops.object.light_add(type='AREA', location=(0, 4, 3))
    rim = bpy.context.object
    rim.data.energy = rim_strength
    rim.data.size = 2
    rim.data.color = (1.0, 1.0, 1.0)
    rim.rotation_euler = (math.radians(-60), 0, 0)

    world = bpy.context.scene.world or bpy.data.worlds.new('World')
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.02, 0.02, 0.03, 1.0)
        bg.inputs['Strength'].default_value = 0.15


def setup_camera_ortho(distance=6, ortho_scale=2.6, elevation_deg=18, azimuth_deg=-25):
    az, el = math.radians(azimuth_deg), math.radians(elevation_deg)
    x = distance * math.cos(el) * math.sin(az)
    y = -distance * math.cos(el) * math.cos(az)
    z = distance * math.sin(el)
    bpy.ops.object.camera_add(location=(x, y, z))
    cam = bpy.context.object
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = ortho_scale
    direction = (-x, -y, -z)
    cam.rotation_euler = direction_to_euler(direction)
    bpy.context.scene.camera = cam
    return cam


def direction_to_euler(direction):
    import mathutils
    vec = mathutils.Vector(direction)
    return vec.to_track_quat('-Z', 'Y').to_euler()


def render_to(path, resolution=512):
    scene = bpy.context.scene
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
