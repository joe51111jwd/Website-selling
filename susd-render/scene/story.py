"""The Waterline story as data, with no Blender in it: the level map, the K states, the running flood
history, the CRANE framing rule and the sequence frame table (brief, sections 3, 7.1, 7.2, 7.3).

Imported by scene/waterline.py (one frame) and scene/keyframes.py (writes scene/keyframes.json and drives
the sequence renders). Run `python3 scene/story.py` to print the state table.

    "Every hire compounds complexity before it compounds capacity."  [M 696]

Units: levels and decks are in H (the sentence block's height) above D0 (the ledge top at the start).
"""
import math

# --------------------------------------------------------------------------------------------
# The level map (brief, section 3): one H per 95 pathways, the lock floor is zero pathways
# --------------------------------------------------------------------------------------------


def pathways(n):
    return n * (n - 1) / 2.0


def level_H(n):
    """Water level for a team of n people, in H above D0."""
    p = pathways(n)
    if n <= 19:
        return (p - 76.0) / 95.0
    # beyond 19 the lock cannot hold 741 pathways at this scale: the climb is compressed (a cap, not a lie)
    return 1.00 + 0.35 * (p - 171.0) / 570.0


def n_for_level(h):
    """Inverse of level_H for n <= 19 (used to label frames)."""
    p = 95.0 * h + 76.0
    return (1 + math.sqrt(1 + 8 * p)) / 2


FLOOR_H = -0.80          # the lock floor, in H above D0
MARK12_H = level_H(12)   # the painted load line: the 12-person level (-0.105 H)
COURSES = [0.55, 0.45, 0.45]   # Side: each new course, in H

# K, story point, n (None in the cycle), water (H), deck = the words' ground (H), sun (x the default),
# signal, wind (m/s: the chop), camera, wet rule, kelvin of the sun.
# Review round 1 (06-HERO-BUILD, "Round 1 fixes"): K5 and K6 keep the window camera (from the open camera the
# drowned words are squeezed into a 10 cm strip at the waterline by refraction at grazing incidence: test
# out/test3/t1_under.png), now with the same sun as HERO and a visible, lit water volume; K0's water is a film on the floor (its top above its bottom); K16 is the Oxygen hold (camera OXYGEN) and
# K16F the same moment pulled back for the finale (camera WIDE), which the drain (K17) also uses.
STATES = {
    'K0':  dict(name='intro',    n=1,    water=FLOOR_H + 0.012, deck=0.00, sun=1.00, signal='off', wind=1.6, cam='HERO'),
    'K1':  dict(name='hero',     n=8,    water=level_H(8),  deck=0.00, sun=1.00, signal='off',   wind=2.2, cam='HERO'),
    'K2':  dict(name='twelve',   n=12,   water=level_H(12), deck=0.00, sun=1.00, signal='off',   wind=2.4, cam='HERO'),
    'K3':  dict(name='touch',    n=13,   water=level_H(13), deck=0.00, sun=0.90, signal='red',   wind=2.8, cam='HERO'),
    'K4':  dict(name='cut',      n=14.5, water=level_H(14.5), deck=0.00, sun=0.75, signal='red', wind=3.2, cam='HERO'),
    'K5':  dict(name='under',    n=19,   water=level_H(19), deck=0.00, sun=0.50, signal='red',   wind=3.6, cam='WINDOW'),
    'K6':  dict(name='redline',  n=39,   water=level_H(39), deck=0.00, sun=0.18, signal='red',   wind=4.0, cam='WINDOW', cloud=1),
    'K7':  dict(name='turn',     n=None, water=1.35,  deck=0.00, sun=1.00, signal='off',   wind=2.0, cam='CRANE'),
    'K8':  dict(name='side1',    n=None, water=1.35,  deck=0.55, sun=1.00, signal='off',   wind=2.0, cam='CRANE', wet='deck'),
    'K9':  dict(name='down1',    n=None, water=-0.45, deck=0.55, sun=1.00, signal='green', wind=1.8, cam='CRANE', wet='flood'),
    'K10': dict(name='up2',      n=None, water=MARK12_H, deck=0.55, sun=1.00, signal='green', wind=1.8, cam='CRANE'),
    'K11': dict(name='side2',    n=None, water=MARK12_H, deck=1.00, sun=1.00, signal='green', wind=1.6, cam='CRANE'),
    'K12': dict(name='down2',    n=None, water=-0.45, deck=1.00, sun=1.00, signal='green', wind=1.6, cam='CRANE'),
    'K13': dict(name='up3',      n=None, water=MARK12_H, deck=1.00, sun=1.00, signal='green', wind=1.4, cam='CRANE'),
    'K14': dict(name='side3',    n=None, water=MARK12_H, deck=1.45, sun=1.00, signal='green', wind=1.4, cam='CRANE'),
    'K15': dict(name='down3',    n=None, water=-0.45, deck=1.45, sun=1.00, signal='green', wind=1.2, cam='CRANE'),
    'K16': dict(name='oxygen',   n=None, water=-0.505, deck=1.45, sun=1.10, signal='green', wind=0.8, cam='OXYGEN', kelvin=4300),
    'K16F': dict(name='finale',  n=None, water=-0.505, deck=1.45, sun=1.10, signal='green', wind=0.8, cam='WIDE', kelvin=4300),
    'K17': dict(name='drain_end', n=None, water=FLOOR_H + 0.012, deck=1.45, sun=1.10, signal='green', wind=0.0, cam='WIDE', kelvin=4300),
}
ORDER = [f'K{i}' for i in range(17)] + ['K16F', 'K17']
ALIASES = {v['name']: k for k, v in STATES.items()}
# the names the still jobs use
ALIASES.update(hero='K1', touch='K3', under='K5', redline='K6', emerge='K8', raised='K11', drained='K9',
               final='K16F', drain='K17')
SIDE_PREV = {'K8': 'K7', 'K11': 'K10', 'K14': 'K13'}   # each Side state and the state before it


def history():
    """Running state along the story: the flood scar on the fixed wall (max water so far) and on the
    moving parts (max of water - deck so far, carried up with the deck); and, per course, the highest water
    that stood on it after it was laid (course 0 was laid in the flood; courses 1 and 2 never went under)."""
    hw_wall = -9.0
    hw_deck_rel = -9.0
    hw_course = [-9.0] * len(COURSES)
    out = {}
    for k in ORDER:
        s = STATES[k]
        hw_wall = max(hw_wall, s['water'])
        hw_deck_rel = max(hw_deck_rel, s['water'] - s['deck'])
        laid = sum(1 for c in _cum(COURSES) if c <= s['deck'] + 1e-6)
        for i in range(laid):
            hw_course[i] = max(hw_course[i], s['water'])
        out[k] = dict(hw_wall=hw_wall, hw_deck=hw_deck_rel + s['deck'], hw_course=list(hw_course))
    return out


def _cum(xs):
    t, out = 0.0, []
    for x in xs:
        t += x
        out.append(t)
    return out


HIST = history()

# --------------------------------------------------------------------------------------------
# CRANE framing (brief 7.1)
# --------------------------------------------------------------------------------------------
HERO_TOP, HERO_FH = 1.827, 4.425     # HERO: the sentence at 18.7-41.3 % of the frame height
SIDE_WORDS_TOP = 0.135               # in Side the camera rises less than the course: the words climb in the frame


def base_frame(deck, water):
    """The words at 18.7 % from the top; pull back if the waterline would leave 62 % of the frame."""
    fh = HERO_FH
    need = (deck + 1.0 - water) / (0.62 - 0.187)
    if need > fh:
        fh = need
    return deck + 1.0 + 0.187 * fh, fh


def crane_frame(k):
    """-> (frame top in H above D0, frame height in H). Down and Up states re-centre the words at 18.7 %;
    a Side state keeps the previous state's frame height and puts the words at SIDE_WORDS_TOP, so the words
    visibly climb in the frame (review round 1: the old pull-back rule re-centred them, so they never moved)."""
    s = STATES[k]
    if k in SIDE_PREV:
        # keep the previous frame's height and lift it less than the course: the words' top goes from
        # 18.7 % to 13.5 % of the frame (about 0.23 H of visible climb), the most the trees' shade above the
        # panel allows before the top band would be lit
        p = SIDE_PREV[k]
        top, fh = crane_frame(p)
        return s['deck'] + 1.0 + SIDE_WORDS_TOP * fh, fh
    if k == 'K7':
        return HERO_TOP, HERO_FH
    return base_frame(s['deck'], s['water'])


def lerp(a, b, t):
    return a + (b - a) * t


def ease(t):
    """Ease in-out (smoothstep) for the cycle phases."""
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------------------------------------
# The sequence frame table (brief 7.3, with the window frames now on the HERO camera)
# --------------------------------------------------------------------------------------------

def frames(layout='desktop'):
    """Every sequence frame as {id, a, b, t, n}: the frame is state a blended toward state b by t
    (water follows n when n is given, so the tide is even in n; the cycle is eased in time)."""
    P = layout == 'phone'
    pre = 'p' if P else 'd'
    out = []

    def add(a, b, t, n=None):
        out.append(dict(id=f'{pre}{len(out):02d}', a=a, b=b, t=round(t, 4), n=None if n is None else round(n, 4)))

    # intro: n 1, 4, 6, 8 (K0 -> K1, water by n)
    for n in ([1, 8] if P else [1, 4, 6, 8]):
        add('K0', 'K1', (n - 1) / 7.0, n)
    per_hire = 2 if P else 3
    # hiring to twelve: 8 -> 12
    for i in range(1, 4 * per_hire + 1):
        n = 8 + i / per_hire
        add('K1', 'K2', (n - 8) / 4.0, n)
    # thirteen: 12 -> 14.5
    steps = 5 if P else 7
    for i in range(1, steps + 1):
        n = 12 + 2.5 * i / steps
        add(*(('K2', 'K3', n - 12) if n <= 13 else ('K3', 'K4', (n - 13) / 1.5)), n)
    # going under: 14.5 -> 19 (3 per hire desktop, 2 phone)
    steps = 10 if P else 15
    for i in range(1, steps + 1):
        n = 14.5 + 4.5 * i / steps
        add('K4', 'K5', (n - 14.5) / 4.5, n)
    # Redline: 19 -> 39
    steps = 3 if P else 4
    for i in range(1, steps + 1):
        n = 19 + 20 * i / steps
        add('K5', 'K6', i / steps, n)
    # the cycle: eased in time per phase
    phases = [('K6', 'K7', 3 if P else 4), ('K7', 'K8', 4 if P else 6), ('K8', 'K9', 7 if P else 10)]
    for a, b, m in [('K9', 'K10', 0), ('K10', 'K11', 0), ('K11', 'K12', 0), ('K12', 'K13', 0), ('K13', 'K14', 0), ('K14', 'K15', 0)]:
        phases.append((a, b, 3 if P else 4))
    phases += [('K15', 'K16', 4 if P else 6)]
    for a, b, m in phases:
        for i in range(1, m + 1):
            add(a, b, ease(i / m))
    return out


def drain_frames(layout='desktop', count=12):
    pre = 'pdrain' if layout == 'phone' else 'ddrain'
    return [dict(id=f'{pre}{i:02d}', a='K16F', b='K17', t=round((i / (count - 1)) ** 2, 4), n=None) for i in range(count)]


if __name__ == '__main__':
    print(f"{'K':>5} {'name':10} {'n':>5} {'p':>6} {'water':>7} {'deck':>6} {'hw_wall':>8} {'hw_deck':>8} {'sun':>5} {'signal':6} {'wind':>5} cam")
    for k in ORDER:
        s = STATES[k]
        p = '' if s['n'] is None else f"{pathways(s['n']):.0f}"
        print(f"{k:>5} {s['name']:10} {str(s['n'] or ''):>5} {p:>6} {s['water']:7.3f} {s['deck']:6.2f} "
              f"{HIST[k]['hw_wall']:8.3f} {HIST[k]['hw_deck']:8.3f} {s['sun']:5.2f} {s['signal']:6} {s['wind']:5.1f} {s['cam']}")
    for k in ('K7', 'K8', 'K9', 'K10', 'K11', 'K12', 'K13', 'K14', 'K15'):
        top, fh = crane_frame(k)
        s = STATES[k]
        print(f'{k}: frame top {top:.3f} H, height {fh:.3f} H, words top at {(top - s["deck"] - 1.0) / fh * 100:.1f} %, '
              f'water at {(top - s["water"]) / fh * 100:.1f} %')
    print(len(frames()), 'desktop frames,', len(frames('phone')), 'phone frames')
