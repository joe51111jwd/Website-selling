import type { CubeSpec } from "../lib/toolpath";

// Everything the shop sells lives here. The models are placeholder cubes for now; see README.

export type Finish = "matte" | "silk" | "glow";

export type Filament = {
  id: string;
  name: string;
  material: string;
  hex: string;
  finish: Finish;
  density: number; // g/cm³, for the weight estimate
};

export const filaments: Record<string, Filament> = {
  signal: { id: "signal", name: "Signal", material: "PLA Matte", hex: "#ff5a1f", finish: "matte", density: 1.24 },
  cobalt: { id: "cobalt", name: "Cobalt", material: "PLA Matte", hex: "#2d4fd6", finish: "matte", density: 1.24 },
  bone: { id: "bone", name: "Bone", material: "PLA Matte", hex: "#e7e0d0", finish: "matte", density: 1.24 },
  graphite: { id: "graphite", name: "Graphite", material: "PLA Matte", hex: "#2b2a29", finish: "matte", density: 1.24 },
  moss: { id: "moss", name: "Moss", material: "PLA Matte", hex: "#6d7b3b", finish: "matte", density: 1.24 },
  blush: { id: "blush", name: "Blush", material: "PLA Matte", hex: "#eba497", finish: "matte", density: 1.24 },
  copper: { id: "copper", name: "Copper", material: "Silk PLA", hex: "#c8784a", finish: "silk", density: 1.24 },
  pearl: { id: "pearl", name: "Pearl", material: "Silk PLA", hex: "#e2dde8", finish: "silk", density: 1.24 },
  glow: { id: "glow", name: "Glow", material: "Glow PLA", hex: "#d6eec0", finish: "glow", density: 1.3 },
};

export type Size = { id: "S" | "M" | "L"; mm: number; price: number };
export const sizes: Size[] = [
  { id: "S", mm: 30, price: 0.75 },
  { id: "M", mm: 45, price: 1 },
  { id: "L", mm: 60, price: 1.45 },
];

export type Product = {
  slug: string;
  no: string;
  name: string;
  line: string; // one sentence for the collection
  about: string; // a short paragraph for the inspector
  price: number; // size M, USD
  filaments: string[]; // first one is the default
  infillPct: number; // the real infill percentage, for the stats
  spec: CubeSpec; // how the stand-in cube is drawn
};

export const products: Product[] = [
  {
    slug: "signal",
    no: "01",
    name: "Signal",
    line: "Gyroid inside. Light, stiff, and just as strong in every direction.",
    about: "A gyroid is a surface with no straight lines and no weak axis. It's what the printer lays down inside, a wave that swings 90° as it climbs, so the piece holds up however you load it.",
    price: 24,
    filaments: ["signal", "graphite", "bone"],
    infillPct: 15,
    spec: { layers: 56, walls: 3, infill: "gyroid", density: 0.2, solid: 4 },
  },
  {
    slug: "cobalt",
    no: "02",
    name: "Cobalt",
    line: "Honeycomb inside, for the reason bees settled on it: most strength, least material.",
    about: "Hexagons tile with no gaps and share every wall, so the cells brace each other. Two walls and a 20% honeycomb make it rigid and surprisingly light.",
    price: 28,
    filaments: ["cobalt", "bone", "graphite"],
    infillPct: 20,
    spec: { layers: 56, walls: 2, infill: "honeycomb", density: 0.2, solid: 4 },
  },
  {
    slug: "copper",
    no: "03",
    name: "Copper",
    line: "Silk PLA with a metal sheen that slides across the layers as you turn it.",
    about: "Silk filament cools with a glossy, pearlescent skin that catches light along every layer line. The grid inside is the classic: two sets of diagonals crossing on every layer.",
    price: 34,
    filaments: ["copper", "pearl", "signal"],
    infillPct: 18,
    spec: { layers: 56, walls: 3, infill: "grid", density: 0.2, solid: 4 },
  },
  {
    slug: "bone",
    no: "04",
    name: "Bone",
    line: "Our densest piece. Four walls and a tight triangle infill; it feels heavier than it looks.",
    about: "Four perimeters and 30% triangles: three sets of lines crossing at 60°, so every cell is a little truss. It takes the longest of anything we make, and it's the one people pick up twice.",
    price: 30,
    filaments: ["bone", "blush", "graphite"],
    infillPct: 30,
    spec: { layers: 56, walls: 4, infill: "triangles", density: 0.3, solid: 5 },
  },
  {
    slug: "moss",
    no: "05",
    name: "Moss",
    line: "Two walls, a wide honeycomb, printed slow for a soft, even surface.",
    about: "Printed at half speed so every layer settles before the next one lands. The surface comes out close to matte stone.",
    price: 26,
    filaments: ["moss", "bone", "cobalt"],
    infillPct: 12,
    spec: { layers: 56, walls: 2, infill: "honeycomb", density: 0.14, solid: 4 },
  },
  {
    slug: "glow",
    no: "06",
    name: "Glow",
    line: "Charges in daylight, glows for hours after dark.",
    about: "Strontium aluminate in the filament stores light and lets it out slowly. Leave it on a windowsill; it glows green-white all evening.",
    price: 32,
    filaments: ["glow", "pearl", "bone"],
    infillPct: 18,
    spec: { layers: 56, walls: 3, infill: "grid", density: 0.18, solid: 4 },
  },
];

// The hero piece and the one on the live printer aren't for sale; they're just the line at work.
export const heroSpec: CubeSpec = { layers: 52, walls: 3, infill: "gyroid", density: 0.2, solid: 4 };
export const liveSpec: CubeSpec = { layers: 48, walls: 3, infill: "grid", density: 0.2, solid: 4 };

export const liveOrders = [
  { product: "bone", filament: "bone", who: "Maya", where: "Portland, OR" },
  { product: "signal", filament: "signal", who: "Tomás", where: "Austin, TX" },
  { product: "cobalt", filament: "cobalt", who: "Priya", where: "Leeds, UK" },
  { product: "copper", filament: "copper", who: "Jun", where: "Vancouver, BC" },
];

// Real-world numbers for a cube at 0.2 mm layers with a 0.4 mm nozzle.
export type Stats = { layers: number; lineM: number; grams: number; minutes: number };

export function stats(p: Pick<Product, "infillPct" | "spec">, mm: number, f: Filament): Stats {
  const layerH = 0.2;
  const bead = 0.4;
  const wall = p.spec.walls * bead;
  const skin = p.spec.solid * layerH;
  const inner = mm - 2 * wall;
  const vWalls = (mm * mm - inner * inner) * mm;
  const vSkins = 2 * skin * inner * inner;
  const vInfill = (p.infillPct / 100) * inner * inner * (mm - 2 * skin);
  const vol = vWalls + vSkins + vInfill; // mm³
  const layers = Math.round(mm / layerH);
  return {
    layers,
    lineM: vol / (bead * layerH) / 1000,
    grams: (vol / 1000) * f.density,
    minutes: vol / 6 / 60 + layers * 0.06,
  };
}

export const priceFor = (p: Product, size: Size) => Math.round(p.price * size.price);

export const fmtTime = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} h ${String(m).padStart(2, "0")} m` : `${m} m`;
};

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
