// Content the deck actually names. Slots we do not have art or audio for stay empty.

export const RECORD = {
  artist: "Major Lazer",
  title: "Shock The System",
  station: "WLZR.TV",
};

export type Track = {
  title: string;
  audio: string | null;
  bpm: number;
  key: number;
};

// One real title from the deck. Audio is a stand-in loop until a master is supplied.
export const TRACKS: Track[] = [{ title: "Rotate", audio: null, bpm: 104, key: 45 }];

export type Video = {
  label: string;
  loop: string;
  poster: string;
};

// One neutral clip until the band's footage is supplied. No invented titles.
export const VIDEOS: Video[] = [{ label: "Video", loop: "v/clip1.mp4", poster: "v/clip1.jpg" }];

export type Show = { date: string; city: string; venue: string };

export const SHOWS: Show[] = [
  { date: "Dec. 30, 2026", city: "Kabupaten Badung, Indonesia", venue: "Finns Beach Club" },
  { date: "Dec. 31, 2026", city: "Melbourne, Australia", venue: "New Years at the Bowl 2026" },
  { date: "Jan. 1, 2027", city: "Sydney, Australia", venue: "Field Day 2027" },
  { date: "Feb. 27, 2027", city: "Christchurch, New Zealand", venue: "Electric Avenue Music Festival 2027" },
];

export const CATS = ["T-Shirts", "Hats", "Sweats", "Accessories"] as const;
export type Category = (typeof CATS)[number];

export type Product = {
  category: Category;
  image: string;
  label: string;
};

// The only product photograph in the supplied art (the shirt in the merch goggles).
export const PRODUCTS: Product[] = [{ category: "T-Shirts", image: "brand/shirt.png", label: "T-Shirt" }];

export const productsIn = (cat: Category | null) => PRODUCTS.filter((p) => !cat || p.category === cat);
