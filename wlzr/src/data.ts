// Everything the band's team will edit lives here. Swap placeholders for the real thing and the
// players pick it up: no other file needs to change.

export const RECORD = {
  artist: "Major Lazer",
  title: "Shock The System",
  station: "WLZR.TV",
  frequency: "103.3",
  // Where "Listen" goes once the record is out (Spotify / Apple / a smart link).
  listenUrl: "#",
  storeUrl: "#",
};

export type Track = {
  title: string;
  // Path or URL to the audio. Until the masters arrive this is null and the radio plays its own
  // synthesized placeholder loop (src/radio.ts), seeded per track.
  audio: string | null;
  bpm: number;
  key: number; // root note, MIDI number, for the placeholder synth only
};

export const TRACKS: Track[] = [
  { title: "Rotate", audio: null, bpm: 104, key: 45 },
  { title: "Shock The System", audio: null, bpm: 110, key: 41 },
  { title: "Pirate Signal", audio: null, bpm: 100, key: 43 },
  { title: "Sound Boy", audio: null, bpm: 108, key: 38 },
];

export type Video = {
  title: string;
  // The visor and the player loop this clip. With a YouTube id the big player plays YouTube instead.
  loop: string;
  poster: string;
  youtube: string | null;
  length: string;
};

// Placeholder footage: Mixkit (free licence), until the band's videos are in.
export const VIDEOS: Video[] = [
  { title: "Rotate (Official Video)", loop: "v/clip1.mp4", poster: "v/clip1.jpg", youtube: null, length: "3:21" },
  { title: "Shock The System (Visualizer)", loop: "v/clip2.mp4", poster: "v/clip2.jpg", youtube: null, length: "2:58" },
  { title: "Live From The Boat", loop: "v/clip3.mp4", poster: "v/clip3.jpg", youtube: null, length: "43:04" },
  { title: "Tour Diary 01", loop: "v/clip4.mp4", poster: "v/clip4.jpg", youtube: null, length: "6:12" },
];

export type Show = { date: string; city: string; venue: string; tickets: string };

// From the deck (Oct 27, 2026). Ticket links to come.
export const SHOWS: Show[] = [
  { date: "Dec. 30, 2026", city: "Kabupaten Badung, Indonesia", venue: "Finns Beach Club", tickets: "#" },
  { date: "Dec. 31, 2026", city: "Melbourne, Australia", venue: "New Years at the Bowl", tickets: "#" },
  { date: "Jan. 1, 2027", city: "Sydney, Australia", venue: "Field Day 2027", tickets: "#" },
  { date: "Feb. 27, 2027", city: "Christchurch, New Zealand", venue: "Electric Avenue Music Festival", tickets: "#" },
];

export type Product = {
  name: string;
  kind: "tee" | "longsleeve" | "hoodie" | "hat";
  category: "T-Shirts" | "Hats" | "Sweats" | "Accessories";
  price: string;
  // "camo" | a colour. Placeholder art is drawn in src/merch-art.ts until product photos arrive;
  // set `image` to a photo to use that instead.
  body: string;
  sleeves?: string;
  image?: string;
  url: string;
};

export const PRODUCTS: Product[] = [
  { name: "Shock Camo Long Sleeve", kind: "longsleeve", category: "T-Shirts", price: "$65", body: "camo", sleeves: "#f4f4f4", url: "#" },
  { name: "WLZR.TV Broadcast Tee", kind: "tee", category: "T-Shirts", price: "$40", body: "#111111", url: "#" },
  { name: "Pirate Signal Hoodie", kind: "hoodie", category: "Sweats", price: "$90", body: "#00d824", url: "#" },
  { name: "Lazer Dad Hat", kind: "hat", category: "Hats", price: "$35", body: "#1a1aff", url: "#" },
];
