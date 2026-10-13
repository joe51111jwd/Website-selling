// Herolab c2 · the intro's LAST frame, rebuilt for the harness: the jobsite map at night (the same
// map and camera as index.html #topo), the three SmartCrew notifications at their places and the
// white logo. In the page these are the real #topo / #intro elements (painted before any JS); the
// hero contracts them into the sign. Positions follow index.html's CSS exactly (same --fx/--fy/--z
// camera, same card offsets), so the hand-over starts from a pixel-identical frame.

import type { CSSProperties } from "react";
import { TOPO_INNER, ROAD } from "./frame-data";

export type Cam = { fx: number; fy: number; z: number };
export type Box = { x: number; y: number; w: number; h: number };
export type NoteId = "clockin" | "load" | "profit";

/** The intro's night camera (landscape / portrait) and the day camera the map settles to. */
export const NIGHT_LAND: Cam = { fx: 1010, fy: 470, z: 1.5 };
export const NIGHT_PORT: Cam = { fx: 1060, fy: 547, z: 1.15 };
export const DAY: Cam = { fx: 800, fy: 500, z: 1.06 };

const HEX = "978,392 1148,362 1238,428 1220,548 1062,580 962,508";

/** Map units → px (the map covers the viewport like "slice"). */
export const mapScale = (W: number, H: number) => Math.max(W / 1600, H / 1000);

/** The CSS transform that puts map point (fx, fy) at the viewport centre, zoomed z. */
export function camTransform(W: number, H: number, c: Cam) {
  const ms = mapScale(W, H);
  return `translate(${(-c.fx * ms * c.z).toFixed(2)}px, ${(-c.fy * ms * c.z).toFixed(2)}px) scale(${c.z})`;
}

/** Where the intro's notifications sit at its last frame (index.html .i-n1/2/3). */
export function noteBoxes(W: number, H: number): Record<NoteId, Box> {
  const port = W / H <= 1;
  const phone = W <= 760;
  const c = port ? NIGHT_PORT : NIGHT_LAND;
  const k = mapScale(W, H) * c.z;
  const w = phone ? 322 : 324;
  const h = phone ? 60 : 64;
  const at = (px: number, py: number, ox: number, oy: number): Box => ({ x: W / 2 + (px - c.fx) * k + ox, y: H / 2 + (py - c.fy) * k + oy, w, h });
  return port
    ? { clockin: at(1215, 411, -279, -132), load: at(1266, 905, -14 - w, -30), profit: at(1062, 580, -170, 18) }
    : { clockin: at(1215, 411, 22, -30), load: at(600, 336, -17, -80), profit: at(1062, 580, 40 - w, 16) };
}

/** The topo map as one SVG (night or day styling comes from the parent's class). */
export function MapSvg({ W, H, cam, night, className, style }: { W: number; H: number; cam: Cam; night?: boolean; className?: string; style?: CSSProperties }) {
  const ms = mapScale(W, H);
  const port = W / H <= 1;
  return (
    <svg
      className={className}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ width: 1600 * ms, height: 1000 * ms, transform: camTransform(W, H, cam), ...style }}
    >
      <g className="hl2-topo" dangerouslySetInnerHTML={{ __html: TOPO_INNER }} />
      {night && (
        <g className="hl2-places" data-a="places">
          <path className="hl2-road" d={ROAD} />
          <path className="hl2-road-c" d={ROAD} />
          {port ? (
            <g>
              <path className="hl2-haul" d="M1268 896C1271.7 880 1287.3 836 1290 800C1292.7 764 1293.3 719.7 1284 680C1274.7 640.3 1242.3 581.7 1234 562" />
              <g className="hl2-pit" transform="translate(1266 905) rotate(-16)">
                <ellipse rx="40" ry="25" />
                <ellipse rx="27" ry="16" />
                <ellipse rx="14" ry="8" />
              </g>
              <circle className="hl2-pin" cx="1266" cy="905" r="5" />
            </g>
          ) : (
            <g>
              <path className="hl2-haul" d="M606 344C621.7 354 662.7 383.7 700 404C737.3 424.3 787 450.3 830 466C873 481.7 936.7 492.7 958 498" />
              <g className="hl2-pit" transform="translate(600 336) rotate(-16)">
                <ellipse rx="40" ry="25" />
                <ellipse rx="27" ry="16" />
                <ellipse rx="14" ry="8" />
              </g>
              <circle className="hl2-pin" cx="600" cy="336" r="5" />
              <text className="hl2-mlabel is-sm" x="648" y="341">
                Hollis pit
              </text>
            </g>
          )}
          <polygon className="hl2-zone" points={HEX} />
          <polygon className="hl2-fence" points={HEX} />
          <text className="hl2-mlabel" x="962" y="404" textAnchor="end" style={port ? { fontSize: 17 } : undefined}>
            Hwy 9 Culvert
          </text>
          <g transform={`translate(1150 450) scale(${port ? 1.35 : 1})`}>
            <circle className="hl2-truck-ring" r="18" />
            <circle className="hl2-truck" r="14.5" />
            <text className="hl2-truck-t" textAnchor="middle" y="4">
              MB
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}

function Truck() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M2.8 15.8V9.6l9.6-2.4v8.6M12.4 9.6h4.4l3.6 3.6v2.6" />
      <circle cx="6.4" cy="17.4" r="1.9" />
      <circle cx="17.2" cy="17.4" r="1.9" />
      <path d="M8.3 17.4h7M2.8 15.8h1.7M19.1 15.8h1.3" />
    </svg>
  );
}

function DollarIc() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.8" />
      <path d="M14.6 9.3c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2 0 2.6 5.3 1.4 5.3 4.2 0 1.2-1.2 2-2.7 2-1.3 0-2.4-.6-2.8-1.6M12 6.4v1.4M12 16v1.6" />
    </svg>
  );
}

/** The three notifications, the intro's own cards (index.html .sc-note markup). */
export function Notes({ boxes }: { boxes: Record<NoteId, Box> }) {
  const pos = (b: Box): CSSProperties => ({ left: b.x, top: b.y, width: b.w });
  return (
    <>
      <div className="hl2-note" style={pos(boxes.clockin)} data-note="clockin">
        <span className="hl2-note-av">MB</span>
        <span className="hl2-note-tx">
          <b>Marcus Bell clocked in</b>
          <span>Hwy 9 Culvert · Pipe Laying</span>
        </span>
        <span className="hl2-note-time">6:42 AM</span>
      </div>
      <div className="hl2-note" style={pos(boxes.load)} data-note="load">
        <span className="hl2-note-ic">
          <Truck />
        </span>
        <span className="hl2-note-tx">
          <b>Load #14 logged</b>
          <span>12 yd³ select fill · Hollis pit</span>
        </span>
        <span className="hl2-note-time">9:20 AM</span>
      </div>
      <div className="hl2-note is-money" style={pos(boxes.profit)} data-note="profit">
        <span className="hl2-note-ic">
          <DollarIc />
        </span>
        <span className="hl2-note-tx">
          <b>+$4,120 today</b>
          <span>Hwy 9 Culvert · job profit</span>
        </span>
        <span className="hl2-note-time">5:00 PM</span>
      </div>
    </>
  );
}
