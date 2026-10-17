// The wiring: thin orange lines from every card into the SmartCrew box. Measured from the laid-out
// cards and box (so it follows whatever grid the CSS chose: one row of six, 3 + 3 round the box,
// or the phone's two columns), redrawn only when they resize. In each column the card nearest the
// box gets a line. Lines are nested so they never cross: the inner ones turn first, the outer ones
// turn later and enter the box further out, like a tidy harness. They draw in once (CSS, when the
// net gets .is-wired) and rest.

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type Wire = { d: string; port: [number, number] | null; entry: [number, number]; delay: number };
type Geo = { w: number; h: number; wires: Wire[]; key: string };

const R = 11; // corner radius
const STEP = 13; // vertical spacing between nested turns
const MAX_ENTRY_GAP = 58; // widest spacing between lines where they enter the box

type Port = { x: number; y: number };

function group(ports: Port[], hubL: number, hubR: number, y1: number, dir: 1 | -1): Omit<Wire, "delay">[] {
  if (!ports.length) return [];
  ports.sort((a, b) => a.x - b.x);
  const n = ports.length;
  const cx = (hubL + hubR) / 2;
  const inset = Math.max(26, (hubR - hubL) * 0.16);
  const gap = n > 1 ? Math.min(MAX_ENTRY_GAP, (hubR - hubL - inset * 2) / (n - 1)) : 0;
  const entries = ports.map((p, k) => {
    const e = cx + (k - (n - 1) / 2) * gap;
    return Math.abs(p.x - e) < 2 * R + 4 ? p.x : e; // nearly straight: make it straight
  });

  // turning levels: centred in the gap, inner lines turn nearest the cards
  const y0 = ports[0].y;
  const mid = (y0 + y1) / 2;
  const left = ports.map((p, k) => ({ p, e: entries[k], k })).filter((o) => o.e > o.p.x + 0.5);
  const right = ports.map((p, k) => ({ p, e: entries[k], k })).filter((o) => o.e < o.p.x - 0.5).reverse();
  const level = new Map<number, number>();
  for (const side of [left, right]) {
    const m = side.length;
    const room = Math.abs(y1 - y0) - 2 * (R + 4);
    const step = m > 1 ? Math.min(STEP, room / (m - 1)) : 0;
    const span = (m - 1) * step;
    // side[0] is the outermost: it turns last (nearest the box)
    side.forEach((o, i) => level.set(o.k, mid - dir * (span / 2) + dir * (m - 1 - i) * step));
  }

  return ports.map((p, k) => {
    const e = entries[k];
    const lv = level.get(k);
    let d: string;
    if (lv === undefined) {
      d = `M${p.x} ${p.y}V${y1}`;
    } else {
      const s = e > p.x ? 1 : -1;
      const r = Math.min(R, Math.abs(e - p.x) / 2, Math.abs(lv - p.y), Math.abs(y1 - lv));
      d =
        `M${p.x} ${p.y}V${lv - dir * r}` +
        `Q${p.x} ${lv} ${p.x + s * r} ${lv}` +
        `H${e - s * r}` +
        `Q${e} ${lv} ${e} ${lv + dir * r}` +
        `V${y1}`;
    }
    return { d, port: [p.x, p.y], entry: [e, y1] };
  });
}

function measure(net: HTMLElement, hub: HTMLElement): Geo {
  const nr = net.getBoundingClientRect();
  const hr = hub.getBoundingClientRect();
  const hubL = hr.left - nr.left;
  const hubR = hr.right - nr.left;
  const hubT = hr.top - nr.top;
  const hubB = hr.bottom - nr.top;
  const rd = (v: number) => Math.round(v * 2) / 2;

  const cards = [...net.querySelectorAll<HTMLElement>("[data-rp-card]")];
  const w = Math.round(nr.width);
  const h = Math.round(nr.height);

  // one column (phones): a single spine through every card's icon, like stations on a line,
  // turning under the last card into the box
  const xs = cards.map((c) => {
    const r = c.getBoundingClientRect();
    return (r.left + r.right) / 2;
  });
  if (cards.length > 1 && Math.max(...xs) - Math.min(...xs) < 2) {
    const ico = (c: HTMLElement) => (c.querySelector<HTMLElement>("[data-rp-port]") ?? c).getBoundingClientRect();
    const f = ico(cards[0]);
    const x = rd((f.left + f.right) / 2 - nr.left);
    const y0 = rd((f.top + f.bottom) / 2 - nr.top);
    const last = cards[cards.length - 1].getBoundingClientRect();
    const yl = rd((last.bottom - nr.top + hubT) / 2);
    const xc = rd((hubL + hubR) / 2);
    const r = Math.min(R, (hubT - yl) - 1, Math.abs(xc - x) / 2);
    const d = `M${x} ${y0}V${yl - r}Q${x} ${yl} ${x + r} ${yl}H${xc - r}Q${xc} ${yl} ${xc} ${yl + r}V${rd(hubT)}`;
    return { w, h, wires: [{ d, port: null, entry: [xc, rd(hubT)], delay: 0 }], key: `${w}x${h}|${d}` };
  }

  // per column, the card nearest the box above it and below it
  const above = new Map<number, Port>();
  const below = new Map<number, Port>();
  cards.forEach((c) => {
    const r = c.getBoundingClientRect();
    const x = rd((r.left + r.right) / 2 - nr.left);
    const top = r.top - nr.top;
    const bottom = r.bottom - nr.top;
    const col = Math.round(x / 4);
    if (bottom <= hubT + 1) {
      const cur = above.get(col);
      if (!cur || bottom > cur.y) above.set(col, { x, y: rd(bottom) });
    } else if (top >= hubB - 1) {
      const cur = below.get(col);
      if (!cur || top < cur.y) below.set(col, { x, y: rd(top) });
    }
  });

  const raw = [...group([...above.values()], hubL, hubR, rd(hubT), 1), ...group([...below.values()], hubL, hubR, rd(hubB), -1)];
  // centre-out: the lines nearest the box's axis start first
  const cx = (hubL + hubR) / 2;
  const order = raw.map((x, i) => ({ i, dist: Math.abs(x.entry[0] - cx) + Math.abs((x.port?.[0] ?? cx) - cx) })).sort((a, b) => a.dist - b.dist);
  const rank = new Map(order.map((o, r) => [o.i, r]));
  const wires = raw.map((x, i) => ({ ...x, delay: Math.floor((rank.get(i) ?? 0) / 2) * 0.09 }));
  return { w, h, wires, key: `${w}x${h}|${wires.map((x) => x.d).join("|")}` };
}

/** Renders inside the net (the cards' and the box's common parent); finds the box by `[data-rp-hub]`. */
export function Wires() {
  const svg = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useLayoutEffect(() => {
    const n = svg.current?.parentElement;
    const b = n?.querySelector<HTMLElement>("[data-rp-hub]");
    if (!n || !b) return;
    const run = () => {
      const g = measure(n, b);
      setGeo((cur) => (cur && cur.key === g.key ? cur : g));
    };
    run();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(run);
    ro.observe(n);
    ro.observe(b);
    return () => ro.disconnect();
  }, []);

  return (
    <svg
      ref={svg}
      className="rp-wires"
      data-testid="rp-wires"
      width={geo?.w ?? 0}
      height={geo?.h ?? 0}
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {geo?.wires.map((w, i) => (
        <g key={i} className="rp-wire-g" style={{ "--d": `${w.delay}s` } as CSSProperties}>
          <path className="rp-wire" d={w.d} pathLength={1} />
          {w.port && <circle className="rp-port" cx={w.port[0]} cy={w.port[1]} r={3} />}
          <circle className="rp-entry" cx={w.entry[0]} cy={w.entry[1]} r={2.5} />
        </g>
      ))}
    </svg>
  );
}
