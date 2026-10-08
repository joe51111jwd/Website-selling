// Footage sources for THE SET. ONE switch: SOURCE.
//  'raw' = PASS A interim copies in public/clips/raw/ (scripts/prep-interim.sh: 1920x1076 crop,
//          approximate grade, tape livery box). Crowds are NOT crushed: drafts only.
//  'mezz' = A5's crowd-crushed, livery-shifted, graded mezzanines in public/clips/ (see their README).
// Every 16:9 source is 1920x1076 (the brief's x 2-1922 crop); bays are 1440x1440; all are 24 fps, 121 frames.
export const SOURCE: 'raw' | 'mezz' = 'raw';

export type ClipId = 'c30' | 'c31' | 'c32' | 'c33' | 'c34' | 'v0' | 'b40' | 'b41' | 'b42' | 'b43' | 'b44';

// A5 mezzanine file names (update to match A5's README when it lands).
const MEZZ: Record<ClipId, string> = {
  c30: 'clips/c30.mp4',
  c31: 'clips/c31.mp4',
  c32: 'clips/c32.mp4',
  c33: 'clips/c33.mp4',
  c34: 'clips/c34.mp4',
  v0: 'clips/v0.mp4',
  b40: 'clips/b40.mp4',
  b41: 'clips/b41.mp4',
  b42: 'clips/b42.mp4',
  b43: 'clips/b43.mp4',
  b44: 'clips/b44.mp4',
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
};

export const SRC_FPS = 24;

// Stills derived from the active source (scripts/stills.sh re-extracts them).
export const STILLS = {
  c34f84: 'stills/c34-f84.png', // the freeze frame (c34 frame 84)
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
  // c30 fallback band (until N09): 2.39:1 from the top, keeps the trowel, the top course and the line,
  // cuts the near face below it.
  c30_239: [0, 0, 1920, 803],
} as const;

// b44's freshly snapped line in the 2.60 s still (1440² px), measured from the chalk-blue pixels
// (row 755, x 560–1068): the plan cut lays the visitor's deposit exactly on it.
export const B44_FRESH = { x0: 560, x1: 1068, y: 755 } as const;
// R2 phase offsets for bays 01–04 (seconds into each loop)
export const BAY_PHASE = [0, 1.2, 2.5, 3.7] as const;
