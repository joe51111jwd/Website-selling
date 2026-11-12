// Site copy + presentation data that sits next to the catalog (catalog.js keeps the commercial facts).
import { CATALOG } from './catalog.js';

export const MAILTO = (subject, body) =>
  `mailto:${CATALOG.agent.email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;

/** Render manifest paths (BRIEF §2) — relative to /renders/, without extension. */
export const RENDERS = {
  heroOpen: 'kit/hero-open',
  closed: 'kit/closed',
  lidTop: 'kit/lid-top',
  product: 'kit/product',
  noteCard: 'kit/note-card',
  stack: 'kit/stack',
  lineup: 'spirits/lineup',
};

/** Presentation for each catalog good: display order, render, spec line, alt text. */
export const GOODS_META = {
  hoodie: {
    render: 'goods/hoodie', label: 'hoodie', spec: '9.0 oz French terry',
    alt: 'Three folded hoodies in black, cement and white, stacked, with an embroidered placeholder logo.',
  },
  'tee-short': {
    render: 'goods/tee', label: 'short sleeve', spec: '4.2 or 7.5 oz cotton',
    alt: 'Folded short-sleeve tees in black, dust and white with a screen-printed placeholder logo.',
  },
  'tee-long': {
    render: 'goods/longsleeve', label: 'long sleeve', spec: '4.2 or 7.5 oz cotton',
    alt: 'Folded long-sleeve tees in black, dust and white, a ribbed cuff showing.',
  },
  cap: {
    render: 'goods/cap', label: 'cap', spec: 'Dad cap or retro trucker',
    alt: 'A black and a white dad cap, three-quarter view, embroidered placeholder logo.',
  },
  tumbler: {
    render: 'goods/tumbler', label: 'tumbler', spec: '25 oz BruMate Rise',
    alt: 'Tumblers in matte black, primrose, lavender and dune with a laser-etched placeholder logo.',
  },
  tote: {
    render: 'goods/tote', label: 'tote', spec: 'Bull denim, 15 in',
    alt: 'Standing denim totes in black, natural and white, handles up.',
  },
  journal: {
    render: 'goods/journal', label: 'journal', spec: 'UltraHyde, 5.5 × 8.25 in',
    alt: 'Fanned journals in black, red, purple and blue with a foil-debossed placeholder logo.',
  },
};
export const GOODS_ORDER = ['hoodie', 'tee-short', 'tee-long', 'cap', 'tumbler', 'tote', 'journal'];
export const goodById = (id) => CATALOG.goods.find((g) => g.id === id);
export const spiritById = (id) => CATALOG.spirits.find((s) => s.id === id);

/** "How a kit gets made" — captions + running per-kit price. */
export const MADE_STEPS = [
  { caption: 'your product goes in first.', price: 1, note: 'a kit, to pack yours' },
  { caption: 'then the goods. hoodie, cap, tumbler, your logo on all of it.', price: 153, note: 'hoodie 72 · cap 35 · tumbler 45' },
  { caption: 'a premium spirit, if you want one.', price: 195, note: 'manojo, $42' },
  { caption: 'and a note. say something nice, we print the card.', price: 195, note: 'the card is on us' },
  { caption: 'lid on. take a look — ready to approve?', price: 195, note: 'a kit, as shown' },
];
/** The kit used in the sequence, for "as shown" totals. */
export const SHOWN_KIT = { perKit: 195, edition: 48 };

export const WORK = [
  { id: 'krispykreme-barbie', title: 'barbie × krispy kreme', tag: '65th anniversary kit',
    desc: 'A collector doll in a co-branded window box, a dozen-box insert and a patched white denim jacket.',
    photos: ['krispykreme_x_barbie_1.webp', 'krispykreme_x_barbie_2.webp', 'krispykreme_x_barbie_3.webp'] },
  { id: 'barbie-sweetlorens', title: 'barbie × sweet loren’s', tag: '“Bake bold. Dream big.”',
    desc: 'Chef Barbie, a pink robe and a printed mailer that opens onto the whole collab.',
    photos: ['barbie_x_sweetlorens_1.webp', 'barbie_x_sweetlorens_2.webp', 'barbie_x_sweetlorens_3.webp'] },
  { id: 'olipop-crocs', title: 'olipop × crocs', tag: '“Sippin’ on a dream”',
    desc: 'Custom orange Crocs with Jibbitz, a cold can and a branded Igloo cooler.',
    photos: ['olipop_x_crocs_1.webp', 'olipop_x_crocs_2.webp', 'olipop_x_crocs_3.webp'] },
  { id: 'olipop-guitar', title: 'olipop guitar + case', tag: 'Fender Malibu, one-off',
    desc: 'A Fender Malibu finished in Olipop strawberry, in a branded hard case.',
    photos: ['olipop_guitar_1.webp', 'olipop_guitar_2.webp', 'olipop_guitar_3.webp'] },
  { id: 'four-loko-remix', title: 'four loko remix', tag: '“The best box you’ve ever tasted”',
    desc: 'Printed mailer, sticker sheet, koozie and the cans, for the Remix launch.',
    photos: ['four_loko_remix_1.webp', 'four_loko_remix_2.webp', 'four_loko_remix_3.webp'] },
  { id: 'manojo', title: 'manojo mezcal', tag: '“Paz, amor y fe”',
    desc: 'Bottle, copita, tee and cap under an illustrated lid.',
    photos: ['manojo_1.webp', 'manojo_2.webp', 'manojo_3.webp'] },
  { id: 'bachans', title: 'bachan’s hella hot', tag: 'Japanese barbecue sauce launch',
    desc: 'Sauce, bowl, chopsticks and a recipe booklet in a fire-red box.',
    photos: ['bachans_1.webp', 'bachans_2.webp', 'bachans_3.webp'] },
  { id: 'lesser-evil', title: 'lesser evil', tag: '“Feed the feeling”',
    desc: 'A trunk-printed box packed with Moonions, a bottle, a tin and stickers.',
    photos: ['lesser_evil_1.webp', 'lesser_evil_2.jpg', 'lesser_evil_4.webp'] },
  { id: 'caviar-spoon', title: '14k gold caviar spoon', tag: 'For Jefferson’s',
    desc: 'With inlaid mother of pearl scoop.',
    photos: ['spoon_1.webp', 'spoon_2.webp', 'spoon_3.webp'] },
];

export const QUOTES = [
  { text: 'chainmail brings our incredibly detailed concepts to life, always on brand and always in time.',
    name: 'Teresa Cesario', org: 'Pernod Ricard' },
  { text: 'we have done over 25,000 gift boxes with these guys over the years. would never use anyone else.',
    name: 'Jaisen Freeman', org: 'Four Loko' },
  { text: 'everything we’ve done with this group has been 10/10',
    name: 'Charlie Hodges', org: 'Krispy Kreme' },
];

export const CLIENTS = [
  { file: 'loko-2.webp', name: 'Four Loko' },
  { file: 'pr-2.webp', name: 'Pernod Ricard' },
  { file: 'olipop.webp', name: 'Olipop' },
  { file: 'busch-2.webp', name: 'Anheuser-Busch' },
  { file: 'arizona-1.webp', name: 'AriZona' },
  { file: 'mm-2.webp', name: 'Manojo Mezcal' },
  { file: 'chilis-2.webp', name: 'Chili’s' },
  { file: 'eleven-2.webp', name: 'E11EVEN Vodka' },
  { file: 'filthy-2.webp', name: 'Filthy' },
  { file: 'oy6-1.webp', name: 'On Your 6' },
];

export const SHIP_CHAIN = ['your order', 'chainmail', 'licensed shipper', 'carrier', '21+ recipient'];
