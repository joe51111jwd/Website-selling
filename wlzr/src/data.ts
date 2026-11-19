/**
 * WLZR.TV content. This is the only file to edit when &SONS sends real media.
 *
 * Drop files in `public/` and point `audio`, `src`, `image`, `tickets`, or
 * `url` at them (a path like "audio/rotate.mp3", or a full https URL).
 * Set `placeholder: false` on any row that is real.
 *
 * Everything marked `placeholder: true` is a layout sample. It is not a
 * released track, a delivered video, a product for sale, or a confirmed show.
 * The tour rows repeat the dates drawn on the deck visor so the player matches
 * that layout. They are not a confirmed tour. Replace the arrays in place.
 */

export const RECORD = {
  artist: "Major Lazer",
  title: "Shock The System",
  station: "WLZR.TV",
};

/** Store / Pleasure portal. Null until &SONS sends the URL. */
export const STORE_URL: string | null = null;

export type Track = {
  title: string;
  /** File under public/, or a stream URL. Null until a master exists. */
  audio: string | null;
  placeholder: boolean;
};

export const TRACKS: Track[] = [
  { title: "Rotate", audio: null, placeholder: true },
  { title: "PLACEHOLDER — track 2", audio: null, placeholder: true },
  { title: "PLACEHOLDER — track 3", audio: null, placeholder: true },
];

export type VideoItem = {
  title: string;
  /** mp4/webm path or URL. Null shows the poster only. */
  src: string | null;
  poster: string | null;
  /** "archive" is the older-videos shelf. */
  shelf: "current" | "archive";
  placeholder: boolean;
};

export const VIDEOS: VideoItem[] = [
  {
    title: "PLACEHOLDER — video 1",
    src: null,
    poster: "placeholders/video-still.webp",
    shelf: "current",
    placeholder: true,
  },
  {
    title: "PLACEHOLDER — video 2",
    src: null,
    poster: null,
    shelf: "current",
    placeholder: true,
  },
  {
    title: "PLACEHOLDER — older video",
    src: null,
    poster: null,
    shelf: "archive",
    placeholder: true,
  },
];

export const CATS = ["T-Shirts", "Hats", "Sweats", "Accessories"] as const;
export type Category = (typeof CATS)[number];

export type Product = {
  category: Category;
  title: string;
  /** Product photo. Null shows an empty frame. */
  image: string | null;
  detail: string;
  /** Per-item store URL. Falls back to STORE_URL. */
  url: string | null;
  placeholder: boolean;
};

export const PRODUCTS: Product[] = [
  {
    category: "T-Shirts",
    title: "PLACEHOLDER — t-shirt",
    image: "placeholders/shirt.webp",
    detail: "Cropped from the merch-head render so the window has a frame. Not a product photo.",
    url: null,
    placeholder: true,
  },
  {
    category: "T-Shirts",
    title: "PLACEHOLDER — t-shirt 2",
    image: null,
    detail: "Empty slot so the goggle carousel has a second frame to cycle.",
    url: null,
    placeholder: true,
  },
  {
    category: "Hats",
    title: "PLACEHOLDER — hat",
    image: null,
    detail: "No product photo supplied.",
    url: null,
    placeholder: true,
  },
  {
    category: "Sweats",
    title: "PLACEHOLDER — sweat",
    image: null,
    detail: "No product photo supplied.",
    url: null,
    placeholder: true,
  },
  {
    category: "Accessories",
    title: "PLACEHOLDER — accessory",
    image: null,
    detail: "No product photo supplied.",
    url: null,
    placeholder: true,
  },
];

export type Show = {
  date: string;
  city: string;
  venue: string;
  tickets: string | null;
  /** Add-on merch for this date. Falls back to STORE_URL. */
  merch: string | null;
  placeholder: boolean;
};

export const SHOWS: Show[] = [
  {
    date: "Dec. 30, 2026",
    city: "Kabupaten Badung, Indonesia",
    venue: "Finns Beach Club",
    tickets: null,
    merch: null,
    placeholder: true,
  },
  {
    date: "Dec. 31, 2026",
    city: "Melbourne, Australia",
    venue: "New Years at the Bowl 2026",
    tickets: null,
    merch: null,
    placeholder: true,
  },
  {
    date: "Jan. 1, 2027",
    city: "Sydney, Australia",
    venue: "Field Day 2027",
    tickets: null,
    merch: null,
    placeholder: true,
  },
  {
    date: "Feb. 27, 2027",
    city: "Christchurch, New Zealand",
    venue: "Electric Avenue Music Festival 2027",
    tickets: null,
    merch: null,
    placeholder: true,
  },
];

export const productsIn = (cat: Category | null) => PRODUCTS.filter((p) => !cat || p.category === cat);
