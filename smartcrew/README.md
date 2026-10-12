# SmartCrew: product page

A new public product page for [smartcrewhq.com](https://smartcrewhq.com): software for dirt-work contractors.
The flow is Facebook ad → this page → "Free Trial" / "Book a Demo" popup (company, name, email, phone, crew size) → a book-a-call page with Andrew's video and his Cal.com calendar.

Work in progress. Built with React, TypeScript, Vite and three.js.

## Run it

```bash
npm install
npm run dev               # http://localhost:5173
npm run build             # typechecks, then outputs dist/ (index.html and book/index.html)
npm run build:watermark   # a watermarked, noindex copy for sending previews
```

Dev-only views: `?screens` (every recreated app screen), `?screen=<id>` (one screen at native size), `?sandbox=devices` (the 3D devices).

## Settings

Everything external is in `src/config.ts`: the Cal.com event, the lead webhook, the Meta Pixel and GA4 IDs (empty on previews so test clicks don't reach the ad account), and Andrew's Vidalytics videos.
