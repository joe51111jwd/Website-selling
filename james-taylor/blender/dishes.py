"""One place that stages each signature dish on the set, for stills, turntables and films.

stage(name) builds the dish at the origin and returns (root, look) where root is the empty to spin
and look is the camera framing the dish wants: (location, target, lens).
"""
import math

import kit
import studio

NAMES = ("ribeye", "burger", "latkes", "chicken", "pie")


def stage(name, **opt):
    if name == "ribeye":
        import steak
        if opt.get("round"):
            board, top = studio.round_board(radius=0.14, tone=0.36)
        else:
            board, top = studio.board(rot=math.radians(-8))
        root, objs = steak.build(split=opt.get("split", False))
        root.location.z = top
        root.rotation_euler.z = math.radians(15)
        if opt.get("round"):
            board.parent = root
            board.location.z = -top
            root.location.x = 0.02
            if "far" in objs:
                # served cut: the far half eased away so the pink inside shows as it turns
                objs["far"].location.x += 0.03
                objs["far"].rotation_euler.z = math.radians(-24)
        return root, ((0.0, -0.5, 0.36), (0.0, 0.0, top + 0.012), 42)
    if name == "burger":
        import burger
        board, top = studio.round_board(radius=0.085, thick=0.02, tone=0.36) if opt.get("board", True) else (None, 0.0)
        root, layers = burger.build()
        root.location.z = top
        if board:
            board.parent = root
            board.location.z = -top
        burger.explode(layers, opt.get("explode", 0.0))
        root["layers"] = [k for k, _, _ in layers]
        return root, ((0.0, -0.44, 0.17), (0.0, 0.0, top + 0.036), 62)
    if name == "latkes":
        import latkes
        root, _ = latkes.build(studio.stoneware())
        return root, ((0.0, -0.42, 0.28), (0.0, 0.0, 0.012), 44)
    if name == "chicken":
        import chicken
        root, _ = chicken.build()
        return root, ((0.0, -0.34, 0.25), (0.0, 0.0, 0.03), 52)
    if name == "pie":
        import pie
        root, _ = pie.build(studio.stoneware())
        root.rotation_euler.z = math.radians(-35)
        return root, ((0.0, -0.36, 0.22), (0.0, 0.0, 0.02), 50)
    raise ValueError(name)


def set_up(samples=48, w=900, h=900, transparent=True, world=0.25, fire=0.5, key_pos=(-0.85, 0.45, 0.75)):
    kit.reset(samples=samples, transparent=transparent)
    kit.resolution(w, h)
    kit.world("studio_small_09", strength=world)
    studio.lights(fire=fire, key_pos=key_pos)
    kit.shadow_catcher()
