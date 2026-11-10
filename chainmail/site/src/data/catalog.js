// Source: chainmail catalog (chainmail.store + kit builder), Nov 2026. Prices per kit, USD.
/* Chainmail catalog — sourced from chainmail.store (WooCommerce Store API) and the current
   kit builder (chainmail-pi.vercel.app), Nov 2026. Prices are per kit, USD.
   Decoration upcharges marked `placeholder: true` are NOT from the store — confirm with Chainmail. */
export const CATALOG = {
  quantities: [24, 48, 72, 96, 120],          // 120 renders as "120+" → agent hand-off
  minimum: 24,
  agent: { name: 'Luis', email: 'luis@chainmail.store' },
  templateUrl: 'https://chainmail.store/wp-content/uploads/2026/06/CHAINMAIL-SHIPPING-TEMPLATE.xlsx',
  restrictedPolicyUrl: 'https://chainmail.store/prohibited-and-restricted-shipping-items-policy/',

  sendIn: {
    id: 'send-in', wcId: 5269, name: 'Your product', price: 1,
    blurb: 'Your brand or product should be the feature. Ship it to us and we pack one in every kit.',
    rules: ['Smaller than 12 × 12 × 8 in', 'Under 4 lb', 'Not on the prohibited or restricted list'],
  },

  decorations: {
    'print-1':  { name: '1 Colour Screen Print', short: '1C Print',  upcharge: 0, placeholder: true },
    'print-4':  { name: '4 Colour Screen Print', short: '4C Print',  upcharge: 4, placeholder: true },
    'embroid-1':{ name: '1 Colour Embroidery',   short: 'Embroidery', upcharge: 6, placeholder: true },
    'laser':    { name: 'Laser Engrave',         short: 'Laser',      upcharge: 0, placeholder: true },
    'foil':     { name: '1 Colour Foil Deboss',  short: 'Foil',       upcharge: 0, placeholder: true },
  },

  goods: [
    {
      id: 'tee-short', wcId: 1846, name: 'Short Sleeve', kind: 'Apparel', price: 32, sized: true,
      image: 'assets/products/TEE_-Main-Image.webp', mock: 'assets/products/tee-preview.jpg',
      blurb: 'Premium tee in a standard 4.2 oz or a heavier 7.5 oz streetwear fit.',
      options: {
        color:  ['Black', 'Dust', 'White'],
        weight: ['Standard 4.2 oz', 'Heavy 7.5 oz'],
        position: ['Centre chest', 'Left chest'],
      },
      decorations: ['print-1', 'print-4', 'embroid-1'],
    },
    {
      id: 'tee-long', wcId: 5399, name: 'Long Sleeve', kind: 'Apparel', price: 32, sized: true,
      image: 'assets/products/LongSleeve_Main.webp',
      variants: {   // colour × weight photos (front, on model)
        'Black|Standard 4.2 oz': 'assets/products/cm_TEE_LW.LS_.BLK_.webp',
        'Dust|Standard 4.2 oz':  'assets/products/cm_TEE_LW.LS_.DST_.webp',
        'White|Standard 4.2 oz': 'assets/products/cm_TEE_LW.LS_.WHT_.webp',
        'Black|Heavy 7.5 oz':    'assets/products/cm_TEE_HW.LS_.BLK_.webp',
        'Dust|Heavy 7.5 oz':     'assets/products/cm_TEE_HW.LS_.DST_.webp',
        'White|Heavy 7.5 oz':    'assets/products/cm_TEE_HW.LS_.WHT_.webp',
      },
      blurb: 'Long sleeve in standard 4.2 oz or heavy 7.5 oz. Black, dust (natural) or white.',
      options: {
        color:  ['Black', 'Dust', 'White'],
        weight: ['Standard 4.2 oz', 'Heavy 7.5 oz'],
        position: ['Centre chest', 'Left chest'],
      },
      decorations: ['print-1', 'print-4', 'embroid-1'],
    },
    {
      id: 'hoodie', wcId: 2285, name: 'Hoodie', kind: 'Apparel', price: 72, sized: true,
      image: 'assets/products/HOODIE_1080x1350_main.webp',
      blurb: 'Mid-weight 9.0 oz garment-dyed French terry. 100% USA-grown cotton, shrink-free.',
      options: {
        color: ['Black', 'Cement', 'White'],
        position: ['Centre chest', 'Left chest'],
      },
      decorations: ['print-1', 'print-4', 'embroid-1'],
    },
    {
      id: 'cap', wcId: 2379, name: 'Cap', kind: 'Headwear', price: 35, sized: false,
      image: 'assets/products/cm_CAP_main.webp',
      blurb: 'Relaxed Dad Cap or structured 5-panel Retro Trucker.',
      options: {
        style: ['Dad Cap', 'Retro Trucker'],
        color: ['Black', 'White'],
      },
      decorations: ['embroid-1'],
    },
    {
      id: 'tote', wcId: 2406, name: 'Tote', kind: 'Bag', price: 37, sized: false,
      image: 'assets/products/cm_TOTE_main.webp',
      blurb: 'Bull denim, made and batch-dyed in the USA. Washable, 15 in across.',
      options: {
        color: ['Black', 'Natural', 'White'],
      },
      decorations: ['print-1', 'print-4', 'embroid-1'],
    },
    {
      id: 'tumbler', wcId: 2432, name: 'Tumbler', kind: 'Drinkware', price: 45, sized: false,
      image: 'assets/products/TUMBLER_1080x1350_Blanks.webp',
      blurb: '25 oz BruMate Rise. Leakproof MagFlip lid, insulated, cup-holder friendly.',
      options: {
        color: ['Matte Black', 'Primrose', 'Lavender', 'Dune'],
      },
      decorations: ['laser'],
    },
    {
      id: 'journal', wcId: 2452, name: 'Journal', kind: 'Paper', price: 20, sized: false,
      image: 'assets/products/JOURNAL_1080x1350_main.webp',
      blurb: 'Italian UltraHyde wraparound cover, 80 sheets FSC lined paper, 5.5 × 8.25 in.',
      options: {
        color: ['Black', 'Red', 'Purple', 'Blue'],
      },
      decorations: ['foil'],
    },
  ],

  // swatch values for the colour chips (approximate, matched to product photography)
  swatches: {
    'Black': '#151515', 'Dust': '#E6E0D2', 'White': '#F7F7F4', 'Cement': '#CFCBC3',
    'Natural': '#E9E1CF', 'Matte Black': '#1D1D1F', 'Primrose': '#EBB3C4', 'Lavender': '#CDB9E6',
    'Dune': '#D9D3CA', 'Red': '#8E3A3A', 'Purple': '#4B3A72', 'Blue': '#2F4778',
  },

  spirits: [
    { id: 'kettle-one',    wcId: 5252, name: 'Ketel One',              type: 'Vodka',               proof: 80, price: 36, image: 'assets/spirits/kettle-one-750ml.webp' },
    { id: 'manojo',        wcId: 5253, name: 'Manojo',                 type: 'Mezcal',              proof: 86, price: 42, image: 'assets/spirits/manojo-mezcal-750ml.webp' },
    { id: 'johnnie-black', wcId: 5255, name: 'Johnnie Walker Black',   type: 'Blended Scotch',      proof: 80, price: 47, image: 'assets/spirits/johnnie-walker-black-label-750ml.webp' },
    { id: 'jameson',       wcId: 5256, name: 'Jameson',                type: 'Irish Whiskey',       proof: 80, price: 42, image: 'assets/spirits/jameson-irish-whiskey-750ml.webp' },
    { id: 'four-roses',    wcId: 5258, name: 'Four Roses',             type: 'Yellow Label Bourbon',proof: 80, price: 27, image: 'assets/spirits/four-roses-yellow-label-bourbon-750ml.webp' },
    { id: 'casamigos',     wcId: 5259, name: 'Casamigos',              type: 'Tequila Blanco',      proof: 80, price: 47, image: 'assets/spirits/casamigos-tequila-blanco-750ml.webp' },
    { id: 'maestro-dobel', wcId: 5260, name: 'Maestro Dobel',          type: 'Tequila Blanco',      proof: 80, price: 44, image: 'assets/spirits/maestro-dobel-tequila-blanco-750ml.webp' },
  ],
};
export default CATALOG;
