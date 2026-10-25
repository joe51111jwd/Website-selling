// Every word on the page lives here. Quotes are verbatim from the source named next to them;
// facts come from the same reporting (see SOURCES at the bottom).

export const SITE = {
  name: "James Taylor",
  role: "Chef",
  line: "American nostalgia, cooked at 900°.",
  restaurant: "The Joyce",
  address: "448 Española Way, Miami Beach",
  reserve: "https://www.thejoycerestaurant.com/reservations/",
  privateEvents: "https://www.thejoycerestaurant.com/private-events/",
  joyce: "https://www.thejoycerestaurant.com/",
  instagram: "https://www.instagram.com/thejoycerestaurant/",
};

export type Ticket = {
  no: string;
  when: string;
  where: string;
  what: string;
  note?: string;
  quote?: string;
  stamp?: string;
};

// The kitchen tickets: his career, fired one at a time.
export const TICKETS: Ticket[] = [
  {
    no: "001",
    when: "Age 5",
    where: "TGI Fridays",
    what: "In the kitchen with his dad.",
    quote: "I grew up working in the kitchen at TGI Fridays with my dad beginning at the age of 5.",
    stamp: "Fired",
  },
  {
    no: "018",
    when: "Age 18",
    where: "Le Cordon Bleu",
    what: "Culinary school, Chicago.",
    stamp: "Fired",
  },
  {
    no: "BB3",
    when: "3 years",
    where: "Bavette's Bar & Boeuf",
    what: "A steakhouse in his native Chicago. Where the steaks got serious.",
    stamp: "Fired",
  },
  {
    no: "R★1",
    when: "Opening team",
    where: "Roister",
    what: "Executive sous chef at the Alinea Group's first casual restaurant. One Michelin star.",
    stamp: "Fired",
  },
  {
    no: "A★3",
    when: "3 years",
    where: "Alinea",
    what: "Chef de tournant at a three-Michelin-star kitchen.",
    quote: "Over the next three years, I became the Executive Sous Chef.",
    stamp: "Fired",
  },
  {
    no: "MIA",
    when: "2021",
    where: "Miami",
    what: "Private chef. A following, one dinner at a time.",
    stamp: "Fired",
  },
  {
    no: "WIN",
    when: "Dec 2024",
    where: "The Window",
    what: "A walk-up burger window on Española Way, like a Cuban ventanita.",
    stamp: "Fired",
  },
  {
    no: "JOY",
    when: "Jan 10, 2025",
    where: "The Joyce",
    what: "Executive chef and partner. 45 seats behind dark green drapery.",
    stamp: "Open",
  },
];

export type Dish = {
  id: "ribeye" | "burger" | "latkes" | "chicken" | "pie";
  no: string;
  name: string;
  sub: string;
  specs: [string, string][];
  quote?: { text: string; by: string };
  blurb: string;
};

export const DISHES: Dish[] = [
  {
    id: "ribeye",
    no: "01",
    name: "Chicago Cut Ribeye",
    sub: "Thick cut. Broiled from above.",
    specs: [
      ["Cut", "Chicago cut ribeye"],
      ["Heat", "Broiler, about 900°"],
      ["Rest", "Up to 45 minutes"],
    ],
    quote: { text: "the most beautiful ribeye in Miami Beach", by: "The Infatuation" },
    blurb: "Chicago style: cooked from above under a broiler, not over grill flames. Then it rests, so the juices settle and stay put.",
  },
  {
    id: "burger",
    no: "02",
    name: "The Joyce Burger",
    sub: "Three years in the making.",
    specs: [
      ["Beef", "75:25 all-beef patties"],
      ["Cheese", "American"],
      ["Bun", "Brioche"],
      ["Sauce", "Joyce sauce"],
    ],
    quote: { text: "We went through hundreds of iterations, plenty of inconsistency, at least twenty different buns", by: "James Taylor, World Red Eye" },
    blurb: "Three years and hundreds of versions to get here, sold from the walk-up window on Española Way. Built for one thing: every component in one bite.",
  },
  {
    id: "latkes",
    no: "03",
    name: "Caviar & Latkes",
    sub: "Ossetra, crisp potato, the classics.",
    specs: [
      ["Caviar", "Ossetra"],
      ["Latkes", "Three, crispy"],
      ["With", "Traditional accompaniments"],
    ],
    blurb: "Shredded potato fried until it shatters, Ossetra caviar on top, the traditional accompaniments alongside.",
  },
  {
    id: "chicken",
    no: "04",
    name: "Shanghai Firecracker Chicken",
    sub: "Sweet, fried, and dried chiles.",
    specs: [
      ["Heat", "Sweet, fried, and dried chiles"],
      ["Sundays", "The American-Chinese menu"],
    ],
    blurb: "The dish that sparked Sundays at The Joyce: a whole American-Chinese menu, from crab rangoons to General Tso's to beef and broccoli.",
  },
  {
    id: "pie",
    no: "05",
    name: "Sour Orange Pie",
    sub: "The last word.",
    specs: [
      ["Filling", "Orange custard"],
      ["Crust", "Vanilla cookie"],
      ["Top", "Crème chantilly"],
    ],
    blurb: "Tart, cold and bright after a steak. Florida, in a slice.",
  },
];

export const BURGER_LAYERS: { key: string; label: string; detail: string }[] = [
  { key: "crown", label: "Brioche + Joyce sauce", detail: "The bun that beat at least twenty others" },
  { key: "cheese_high", label: "American cheese", detail: "Melted to the edges" },
  { key: "patty_high", label: "75:25 beef", detail: "Seared hard on a hot griddle" },
  { key: "cheese_low", label: "American cheese", detail: "Again" },
  { key: "patty_low", label: "75:25 beef", detail: "Two patties, all beef" },
  { key: "heel", label: "Brioche heel", detail: "Toasted, sauced" },
];

export const PRESS = [
  {
    outlet: "Time Out Miami",
    rating: "★★★★★",
    text: "The menu looks like standard steak house stuff until you actually taste it.",
    when: "May 2025",
  },
  {
    outlet: "The Infatuation",
    rating: "8.0",
    text: "A pretty perfect steak",
    when: "March 2026",
  },
  {
    outlet: "Time Out Miami",
    rating: "",
    text: "Like eating in a collector's private den, but one where you're actually welcome.",
    when: "May 2025",
  },
];

export const AWARDS = [
  "Wine Spectator Best of Award of Excellence, 2026",
  "Star Wine List Gold Star, best medium-sized wine list in Florida",
];

export const JOYCE = {
  secret: "Finding The Joyce feels like being let in on a secret.",
  secretBy: "Time Out Miami",
  facts: [
    ["Seats", "45"],
    ["On the walls", "Picasso, Basquiat"],
    ["Chairs", "Gio Ponti"],
    ["Bar stools", "Joe Colombo"],
    ["Sundays", "The American-Chinese menu"],
    ["Wednesdays", "Live jazz"],
  ] as [string, string][],
  partners: "Opened with art collector Andre Sakhai and Marc Lotenberg (Spicy Hospitality Group).",
};

export const PHILOSOPHY = {
  quote: "classic American cooking inspired by deeply memorable meals from my life",
  magic: "The magic is in the details.",
  by: "James Taylor, World Red Eye",
};

export const SOURCES = [
  { name: "World Red Eye, “The Joyce: Redefining Luxury Boutique Hospitality” (Nov 2025)", url: "https://worldredeye.com/2025/11/qa-the-joyce-redefining-luxury-boutique-hospitality/" },
  { name: "Boca Raton Observer, “A Class Apart” (Jul 2025)", url: "https://bocaratonobserver.com/food-and-drink/review/a-class-apart/" },
  { name: "Time Out Miami, The Joyce (May 2025)", url: "https://www.timeout.com/miami/restaurants/the-joyce" },
  { name: "The Infatuation, The Joyce (Mar 2026)", url: "https://www.theinfatuation.com/miami/reviews/the-joyce" },
  { name: "Resident, “Art on the Plate” (Jan 2025)", url: "https://resident.com/food-and-drink/2025/01/12/art-on-the-plate-the-joyce-and-the-window-at-the-joyce-redefine-miami-beach-dining" },
  { name: "SOBEWFF, James Taylor", url: "https://sobewff.org/personality/james-taylor/" },
];
