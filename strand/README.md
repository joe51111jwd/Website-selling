# Strand — 3D-printed objects, made to order

**Everything here is one line.** An FDM print is literally one unbroken strand of plastic, so this shop is built out of one. A single strand runs down the whole page. As you scroll, a nozzle rides its tip and prints each product layer by layer, then the line leaves the top of the piece, loops down and feeds into the next one. It ends at a live printer working on a customer's order.

Built with React, TypeScript, Vite, three.js, [@react-three/fiber](https://r3f.docs.pmnd.rs) + [drei](https://drei.docs.pmnd.rs) and [Lenis](https://lenis.darkroom.engineering).

> The brand name, copy, prices, contact details and the products themselves are **placeholders**. Every product is a stand-in cube. See [Swapping in the real products](#swapping-in-the-real-products).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typechecks, then outputs dist/
```

## Deploy

Vercel: import the repo with **Root Directory** set to `strand`. It's a Vite project with no extra settings. The inspector uses a hash route (`#/p/<slug>`), so no rewrites are needed.

## What's on the page

| Piece | File | What it does |
| --- | --- | --- |
| Preloader | `src/components/Preloader.tsx` | "Heating nozzle 024 → 215 °C" while fonts load. Shorter on repeat visits. |
| Hero | `src/components/Hero.tsx` | The line drops in from off-screen and prints the first piece live, with a slicer readout (layer, metres of line). |
| Statement | `src/components/Statement.tsx` | What a printer actually does, with the real line length of a 45 mm cube. |
| The collection | `src/components/Piece.tsx` | Each product prints as you scroll to it: it's finished when its frame reaches the middle of the screen. Its line, layer count and text tick up with the print. Scroll back and it un-prints. Click the piece to inspect it. |
| Live printer | `src/components/Live.tsx` | The end of the line. A printer on a loop, working through customer orders, with live layer and time-left numbers. |
| Custom | `src/components/Custom.tsx` | Quote request with a file drop (STL, 3MF, OBJ, STEP, photo). |
| Footer | `src/components/Footer.tsx` | Total line in the collection, and the wordmark drawn as one stroke. |
| HUD | `src/components/Hud.tsx` | Bottom-left counter of metres of line laid and layers printed as you scroll. |
| Queue | `src/components/Queue.tsx` | The cart, called a queue: each item shows its print time, and the total says how long the order takes to print. |

### The inspector (the 3D viewer)

`src/components/Inspector.tsx` + `src/three/Viewer.tsx`. Opens full screen from any piece, and can be linked: `/#/p/signal`.

- Orbit with drag or touch, zoom with the wheel or a pinch (drei `OrbitControls`). It turns on its own when left alone.
- The piece sits on a textured build plate, with contact shadows and dimension callouts in mm.
- **Layer slider**, like a slicer's: drag it down to un-print the piece and see the walls and infill inside. Arrow keys, Page Up/Down and Home/End work on the handle.
- **Filament**: picking a colour reprints the piece from the plate up in that colour.
- **Size** S / M / L rescales it and updates the price, line length, weight and print time.
- **Glow** filament gets a "Lights off" switch.
- Arrow keys or the arrows at the top step between pieces. Esc closes.

### How the 3D works

| File | Job |
| --- | --- |
| `src/lib/toolpath.ts` | Generates each cube as a real toolpath, the way a slicer does: walls inside-out, then grid, gyroid or honeycomb infill, with solid diagonal skins on the bottom and top layers. `locate()` maps print progress to a point on the path (one layer at a time, so pieces grow at an even rate). |
| `src/three/strand.ts` | Renders a toolpath as one `InstancedMesh`: every segment is a flattened cylinder ("bead") of plastic, so a whole piece is one draw call. `set(progress)` shows the line up to the nozzle, with the freshly laid bit glowing hot. |
| `src/three/World.tsx` | The fixed WebGL layer behind the page. Each frame it moves the camera with the scroll and places every piece on its DOM box (`data-station="…"`), so CSS controls the layout. A single number, the line's position, is derived from the scroll, and every piece, connector and the nozzle are drawn from it. |
| `src/three/nozzle.ts` | The print head, built from primitives (brass nozzle, heater block, heat sink). |
| `src/lib/layout.ts` | Measures the DOM boxes the line attaches to, again on resize and after fonts load. |
| `src/lib/scroll.ts` | Lenis smooth scroll, driven from the render loop so the page and the line never drift apart. |

It respects `prefers-reduced-motion`: smooth scroll and spinning stop, and the line jumps to where the scroll is instead of easing there. Without WebGL the page still reads, just without the line.

## Swapping in the real products

Everything about the products lives in **`src/content/catalog.ts`**: names, copy, prices, which filaments each one comes in, sizes, and the infill and wall numbers used for the stats (line length, weight, print time are calculated from these).

The cubes are generated by `cubeToolpath()`. For the real models, the best route matches what the seller already does: they slice every model to print it anyway. Export the G-code from the slicer (PrusaSlicer, Cura, Bambu Studio and Orca all produce it), parse the `G1` moves with extrusion into the same `Toolpath` shape (`seg`, `layerStart`, `cum`), and the page and inspector will draw the real toolpath, infill and all. Real files have hundreds of thousands of moves, so thin them out (keep every Nth sparse-infill move, merge short collinear segments) to around 5–10k segments per piece.

If that's too much work for launch, a plain GLB per product can go in the inspector with drei's `useGLTF`, revealed from the plate up with a clipping plane instead.

Before launch:

- [ ] Real brand name, wordmark (`Footer.tsx` path, `Header.tsx`), copy and prices.
- [ ] Replace `hello@example.com`, the social links and "[City]" in `Footer.tsx`.
- [ ] Wire the custom-quote form (`Custom.tsx`) to a form service or email API. It only confirms on the page right now.
- [ ] Connect checkout in `Queue.tsx` (Stripe Checkout or a Shopify Buy Button). The button shows a mockup notice.
- [ ] Live printer: if the seller runs OctoPrint, Moonraker (Klipper) or Bambu, their APIs give the real layer number, time left and a camera feed for the "watch yours being printed" link.
- [ ] Add `og:image` once there's a domain.
