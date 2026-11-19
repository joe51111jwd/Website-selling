# The book's own letterforms for covers 11-15: drawn, not typed. Each capital is a skeleton of strokes (lines and
# arcs) in a box one unit tall, made for this title only (S C A L I N G U P D E O W and the hyphen). Each cover then
# *builds* the letters its own way: from wooden blocks (11), as growing branches (12), cut through a wall (13) or
# through paper (14), or stitched (15). No font is used anywhere in the title.
#
#   from lettering import layout, raster
#   strokes = layout("SCALING", height=1.0, tracking=0.22)   # list of polylines [(x, y), ...], y up
import math

T = 0.19  # the stroke weight these skeletons are drawn for (a fraction of the cap height)


def arc(cx, cy, rx, ry, a0, a1, n=28):
    """Points on an elliptical arc from angle a0 to a1 (degrees, counter-clockwise, 0 = east)."""
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


# Each letter: (advance width, [polyline, ...]). Coordinates in cap-height units, baseline y=0, cap y=1.
# The skeleton sits on the stroke's centre line, inset by T/2 so the drawn letter fills 0..1.
h = T / 2


def _letters():
    L = {}
    w = 0.66  # S: two stacked bowls, the top one a touch smaller, like a hand-cut sign letter
    r = (0.5 - h) / 2  # the two bowls meet exactly on the middle line
    L["S"] = (w, [arc(w / 2, 0.5 + r, w / 2 - h - 0.02, r, 18, 270)[:-1] + arc(w / 2, 0.5 - r, w / 2 - h, r, 90, -162)])
    w = 0.70
    L["C"] = (w, [arc(w / 2 + 0.02, 0.5, w / 2 - h + 0.02, 0.5 - h, 42, 318)])
    w = 0.78
    L["A"] = (w, [[(h, h), (w / 2, 1 - h * 0.4), (w - h, h)], [(w * 0.24, 0.34), (w * 0.76, 0.34)]])
    w = 0.56
    L["L"] = (w, [[(h, 1), (h, h), (w, h)]])
    w = T
    L["I"] = (w, [[(h, 0), (h, 1)]])
    w = 0.72
    L["N"] = (w, [[(h, 0), (h, 1 - h), (w - h, h), (w - h, 1)]])
    w = 0.74  # G: the C with a spur and a bar that steps inward
    L["G"] = (w, [arc(w / 2, 0.5, w / 2 - h, 0.5 - h, 40, 352), [(w - h, 0.47), (w - h, h * 1.4)], [(w * 0.52, 0.47), (w - h + h, 0.47)]])
    w = 0.68
    L["U"] = (w, [[(h, 1), (h, 0.38)] + arc(w / 2, 0.38, w / 2 - h, 0.38 - h, 180, 360)[1:] + [(w - h, 1)]])
    w = 0.64
    L["P"] = (w, [[(h, 0), (h, 1 - h), (w * 0.42, 1 - h)] + arc(w * 0.42, 0.735, w * 0.58 - h, 0.265 - h, 90, -90)[1:] + [(h, 0.47)]])
    w = 0.72
    L["D"] = (w, [[(h, h), (h, 1 - h), (w * 0.36, 1 - h)] + arc(w * 0.36, 0.5, w * 0.64 - h, 0.5 - h, 90, -90)[1:] + [(h, h)]])
    w = 0.58
    L["E"] = (w, [[(w, 1 - h), (h, 1 - h), (h, h), (w, h)], [(h, 0.5), (w * 0.86, 0.5)]])
    w = 0.80
    L["O"] = (w, [arc(w / 2, 0.5, w / 2 - h, 0.5 - h, 90, 450, 48)])
    w = 1.02
    L["W"] = (w, [[(h * 0.6, 1), (w * 0.25, h * 0.6), (w * 0.5, 0.72), (w * 0.75, h * 0.6), (w - h * 0.6, 1)]])
    w = 0.34
    L["-"] = (w, [[(0.02, 0.46), (w - 0.02, 0.46)]])
    L[" "] = (0.32, [])
    return L


LETTERS = _letters()


def layout(text, height=1.0, tracking=0.16, x0=0.0, y0=0.0):
    """Lay out text left to right. Returns (strokes, width): strokes are polylines in output units, y up,
    each tagged with its letter index: [(index, char, [(x, y), ...]), ...]."""
    out, x = [], x0
    for i, ch in enumerate(text):
        w, polys = LETTERS[ch]
        for p in polys:
            out.append((i, ch, [(x + px * height, y0 + py * height) for px, py in p]))
        x += (w + tracking) * height
    return out, x - tracking * height - x0


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def inside(strokes, x, y, weight):
    """Is (x, y) inside the drawn letters (strokes of the given weight)?"""
    r = weight / 2
    for _, _, p in strokes:
        for (ax, ay), (bx, by) in zip(p, p[1:]):
            if seg_dist(x, y, ax, ay, bx, by) <= r:
                return True
    return False


def raster(text, rows, tracking=0.2, weight=T):
    """The title on a grid of square cells (for building it from blocks): returns [(letter index, col, row)], cols."""
    strokes, width = layout(text, 1.0, tracking)
    cell = 1.0 / rows
    cols = int(math.ceil((width + weight) / cell))
    cells = []
    for c in range(cols):
        for r in range(rows):
            x, y = (c + 0.5) * cell - weight / 2, (r + 0.5) * cell
            hit = None
            for i, ch, p in strokes:
                for (ax, ay), (bx, by) in zip(p, p[1:]):
                    if seg_dist(x, y, ax, ay, bx, by) <= weight / 2 + cell * 0.18:
                        hit = i
                        break
                if hit is not None:
                    break
            if hit is not None:
                cells.append((hit, c, r))
    return cells, cols


def svg_paths(strokes, page_h, sx=1.0, ox=0.0, oy=0.0):
    """SVG path data (y flipped for SVG), one path per stroke."""
    out = []
    for i, ch, p in strokes:
        closed = abs(p[0][0] - p[-1][0]) < 1e-6 and abs(p[0][1] - p[-1][1]) < 1e-6
        pts = p[:-1] if closed else p
        d = "M " + " L ".join(f"{ox + x * sx:.2f} {page_h - (oy + y * sx):.2f}" for x, y in pts) + (" Z" if closed else "")
        out.append((i, ch, d))
    return out


if __name__ == "__main__":
    # a proof sheet of the letters, for checking them by eye
    import sys
    s, w = layout("SCALING UP-SIDE-DOWN", 1.0, 0.16)
    H = 200
    paths = svg_paths(s, 1.4 * H, H, 30, 0.2 * H)
    body = "".join(f'<path d="{d}" fill="none" stroke="#1c1a17" stroke-width="{T * H:.1f}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="1.6"/>' for _, _, d in paths)
    open(sys.argv[1], "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * H + 60:.0f}" height="{1.4 * H:.0f}" style="background:#f6f3ee">{body}</svg>')
