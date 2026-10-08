// Footage sources for THE SET. ONE switch: SOURCE.
//  'raw' = PASS A interim copies in public/clips/raw/ (scripts/prep-interim.sh: 1920x1076 crop,
//          approximate grade, tape livery box). Crowds are NOT crushed: drafts only.
//  'mezz' = A5's crowd-crushed, livery-shifted, graded mezzanines in public/clips/ (see their README).
// Every 16:9 source is 1920x1076 (the brief's x 2-1922 crop); bays are 1440x1440; all are 24 fps, 121 frames.
import source from './source.json';
import measured from './measured.json';

export const SOURCE = source.source as 'raw' | 'mezz';

export type ClipId = 'c30' | 'c31' | 'c32' | 'c33' | 'c34' | 'v0' | 'b40' | 'b41' | 'b42' | 'b43' | 'b44' | 'n09r' | 'n01b';

// A5 mezzanine file names (film/public/clips/README.md). c30 as delivered is not exported (it fails the
// brickwork gate): with USE_N09 it is never used. Crops below are taken from the full 16:9 files and stay
// inside the regions A5 marks safe (c31 4:5 at x 1059, c33 rows 272+, head out of frame).
const MEZZ: Record<ClipId, string> = {
  c30: 'clips/c30-n09-169.mp4',
  c31: 'clips/c31-169.mp4',
  c32: 'clips/c32-169.mp4',
  c33: 'clips/c33-169.mp4',
  c34: 'clips/c34-169.mp4',
  v0: 'clips/v0-169.mp4',
  b40: 'clips/b40-1440.mp4',
  b41: 'clips/b41-1440.mp4',
  b42: 'clips/b42-1440.mp4',
  b43: 'clips/b43-1440.mp4',
  b44: 'clips/b44-1440.mp4',
  n09r: 'clips/c30-n09-169.mp4', // N09 retake: PERSPECTIVE 01-A (replaces c30)
  n01b: 'clips/n01b-916.mp4', // N01b: the 9:16 snap (phone hero), 1076x1912
};

export const clipPath = (id: ClipId) => (SOURCE === 'raw' ? `clips/raw/${id}.mp4` : MEZZ[id]);

export const CLIP_SIZE: Record<ClipId, [number, number]> = {
  c30: [1920, 1076],
  c31: [1920, 1076],
  c32: [1920, 1076],
  c33: [1920, 1076],
  c34: [1920, 1076],
  v0: [1920, 1076],
  b40: [1440, 1440],
  b41: [1440, 1440],
  b42: [1440, 1440],
  b43: [1440, 1440],
  b44: [1440, 1440],
  n09r: [1920, 1076],
  n01b: [1076, 1912],
};

export const SRC_FPS = 24;

// The snap films: source frames first → freeze (inclusive); the freeze frame is the film's last frame.
export const SNAP: Record<'c34' | 'n01b', { first: number; freeze: number }> = {
  c34: { first: 60, freeze: 84 },
  n01b: { first: 76, freeze: 100 },
};

// PERSPECTIVE 01-A: the gated N09 retake when present (brief §7a: c30 only if N09 fails).
export const USE_N09 = true;
// 9:16 hero: N01b (A5 gate PASS) laid out per brief §2.5; false = the §2.5 fallback (4:5 c34 window).
export const USE_N01B = true;

// Stills derived from the active source (scripts/stills.sh re-extracts them).
export const STILLS = {
  c34f84: 'stills/c34-f84.png', // the freeze frame (c34 frame 84)
  n01bf100: 'stills/n01b-f100.png', // the 9:16 freeze frame (N01b frame 100: its plume peak, A5)
  b44at260: 'stills/b44-260.png', // the plan-cut still (b44 at 2.60 s, frame 62)
  b44last: 'stills/b44-last.png',
  b40f0: 'stills/b40-f0.jpg',
  b41f0: 'stills/b41-f0.jpg',
  b42f0: 'stills/b42-f0.jpg',
  b43f0: 'stills/b43-f0.jpg',
} as const;

// Brief-prescribed crops, in source pixels [x, y, w, h].
export const CROPS = {
  // c31 only as 4:5 at x >= 0.50; taken at the right-most position (x 1059-1920) so the head and its
  // ~3.0 s visor glint stay out of frame.
  c31_45: [1059, 0, 861, 1076],
  // c33 only as the bottom-anchored 2.39:1 crop (rows 271-1076).
  c33_239: [0, 273, 1920, 803],
  // c30 fallback band (only if N09 is missing): 2.39:1 from the top, keeps the trowel, the top course and
  // the line, cuts the near face below it.
  c30_239: [0, 0, 1920, 803],
  // N09 retake, as A5's el-c30 plate: 2.39:1 at y 40; phone 4:5 at x 330
  n09r_239: [0, 40, 1920, 804],
  n09r_45: [330, 0, 861, 1076],
} as const;

// b44's freshly snapped line in the 2.60 s still (1440² px), measured from the chalk-blue pixels by
// scripts/stills.sh on the active source: the plan cut lays the visitor's deposit exactly on it.
export const B44_FRESH = measured.b44Fresh;
// R2 phase offsets for bays 01–04 (seconds into each loop)
export const BAY_PHASE = [0, 1.2, 2.5, 3.7] as const;
