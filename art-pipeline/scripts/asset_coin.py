"""Renders the game coin sprite: chunky gold coin, embossed star, toon shading."""
import bpy
import math
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from toon_kit import (
    reset_scene, make_toon_material, add_outline,
    setup_studio_lighting, setup_camera_ortho, render_to,
)

scene = reset_scene()

# Coin body: squat beveled cylinder.
bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.32, vertices=48, location=(0, 0, 0))
coin = bpy.context.object
coin.name = 'Coin'
bpy.ops.object.modifier_add(type='BEVEL')
coin.modifiers['Bevel'].width = 0.09
coin.modifiers['Bevel'].segments = 6
bpy.ops.object.shade_smooth()

gold_mat = make_toon_material(
    'GoldCoin', base_color=(1.0, 0.75, 0.12, 1.0), rim_color=(1.0, 0.98, 0.75, 1.0),
    roughness=0.15,
)
coin.data.materials.append(gold_mat)
add_outline(coin, thickness=0.035)

# Inner rim detail: slightly recessed disc for a stamped-coin look.
bpy.ops.mesh.primitive_cylinder_add(radius=0.78, depth=0.06, vertices=48, location=(0, 0, 0.16))
inner = bpy.context.object
inner.name = 'CoinInner'
bpy.ops.object.shade_smooth()
inner_mat = make_toon_material(
    'GoldCoinInner', base_color=(1.0, 0.82, 0.25, 1.0), rim_color=(1.0, 1.0, 0.9, 1.0),
    roughness=0.2,
)
inner.data.materials.append(inner_mat)

# Embossed star on top.
bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.42, radius2=0, depth=0.14, location=(0, 0, 0.26))
star_base = bpy.context.object
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
star_base.rotation_euler = (0, 0, math.radians(90))
star_base.scale = (1, 1, 0.5)
star_base.name = 'StarAccent'
bpy.ops.object.shade_smooth()
star_mat = make_toon_material(
    'StarAccent', base_color=(1.0, 0.55, 0.05, 1.0), rim_color=(1.0, 0.9, 0.6, 1.0),
    roughness=0.15,
)
star_base.data.materials.append(star_mat)

setup_studio_lighting()
cam = setup_camera_ortho(distance=6, ortho_scale=2.4, elevation_deg=22, azimuth_deg=-30)

out_path = os.path.join(os.path.dirname(__file__), '..', 'renders', 'coin.png')
render_to(os.path.abspath(out_path), resolution=768)
print('COIN_RENDER_DONE')
