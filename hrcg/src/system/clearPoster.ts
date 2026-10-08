// A transparent 1x1 GIF for <video poster> (FIXLIST F-002). Owner: A1.
// Browsers fetch a <video poster> eagerly, wherever the element sits, so every LoopVideo (and the hero
// film) sets this instead; the visible poster is the lazy <picture class="loopvideo-poster"> beside it.
export const CLEAR_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
