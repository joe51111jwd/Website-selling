import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { COPY } from "../copy";
import { BOOK_COPY as T, YEARS, SYSTEMS } from "../bookcopy";
import { LEAVES, TOTAL, filmAt, lerp, startOf } from "../bookfilm";
import { APPENDIX_URL, optinLive, sendOptin, validEmail } from "../optin";
import { LINKS } from "../links";
import { holdHero } from "../herohold";
import { lenis } from "../lenis";
import { openNotice } from "./NoticeDialog";

// The home page as the book itself (James, 24 Nov: "take like the Apple AirPods website that won awards and
// basically make it out of a book ... you can open it up. You can show the pages ... charts and diagrams to
// explain the point of the book"). One pinned stage: the hardcover, drawn in the browser from the cover's own
// flat art (public/cover), is opened by the scroll; each spread sets Michael's words on the left page and one
// diagram on the right; then it closes and stands beside the one sign-up. src/bookfilm.ts is the timeline.

const BASE = import.meta.env.BASE_URL;
const art = (name: string) => `${BASE}cover/${name}`;
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// the book, in its own units (the stage scales it to the screen)
const W = 720;
const H = 1080;
const D = 72;
const GAP = 1.2; // between leaves, so no two share a plane

const vars = (o: Record<string, string | number>) => o as CSSProperties;

function Folio({ n, side }: { n: number; side: "l" | "r" }) {
  return (
    <>
      <span className={`pg-head pg-${side}`} aria-hidden="true">
        {side === "l" ? T.running.title : T.running.author}
      </span>
      <span className={`pg-folio pg-${side}`} aria-hidden="true">
        {n}
      </span>
    </>
  );
}

function Words({ n, kicker, headline, body, tone }: { n: number; kicker?: string; headline: string; body?: string; tone?: string }) {
  return (
    <div className="pg pg-words">
      <Folio n={n} side="l" />
      {kicker && <p className={`pg-kicker ${tone ? `is-${tone}` : ""}`}>{kicker}</p>}
      <h2 className="pg-headline">{headline}</h2>
      {body && <p className="pg-body">{body}</p>}
    </div>
  );
}

/** Chapter 17's exhibit: three small charts on one time axis, each from zero */
function Inversion() {
  const x = (i: number) => 60 + i * 150;
  const panels = [
    { key: "revenue", label: T.inversion.revenue, tone: "up", max: 6, v: YEARS.map((r) => r.revenueM), text: YEARS.map((r) => r.revenue) },
    { key: "margin", label: T.inversion.margin, tone: "down", max: 30, v: YEARS.map((r) => r.marginPct), text: YEARS.map((r) => r.margin) },
    { key: "take", label: T.inversion.take, tone: "down", max: 1350, v: YEARS.map((r) => r.takeK), text: YEARS.map((r) => r.take) },
  ];
  const PH = 150;
  return (
    <div className="pg pg-chart">
      <Folio n={3} side="r" />
      <h3 className="pg-title">{T.inversion.title}</h3>
      <svg className="inv" viewBox="0 0 560 640" role="img" aria-label={T.inversion.alt}>
        {panels.map((p, k) => {
          const top = 34 + k * 200;
          const y = (v: number) => top + PH - (v / p.max) * PH;
          const d = p.v.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v).toFixed(1)}`).join(" ");
          return (
            <g key={p.key} className={`inv-panel is-${p.tone}`}>
              <text className="inv-label" x={0} y={top - 16}>
                {p.label}
              </text>
              <line className="inv-base" x1={0} x2={560} y1={top + PH} y2={top + PH} />
              <path className="inv-line" d={d} pathLength={1} />
              {p.v.map((v, i) => (
                <g key={i} className="inv-pt" style={vars({ "--at": i / 3 })}>
                  <circle cx={x(i)} cy={y(v)} r={i === 0 || i === 3 ? 7 : 4.5} />
                  {(i === 0 || i === 3) && (
                    <text className="inv-value" x={x(i)} y={y(v) - 16} textAnchor="middle">
                      {p.text[i]}
                    </text>
                  )}
                </g>
              ))}
            </g>
          );
        })}
        {YEARS.map((r, i) => (
          <text key={r.year} className="inv-year" x={x(i)} y={628} textAnchor="middle">
            {r.year}
          </text>
        ))}
      </svg>
      <p className="pg-caption">{T.inversion.caption}</p>
    </div>
  );
}

/** everyone who has to talk to everyone: n(n-1)/2 lines, at each of the exhibit's four team sizes */
function Pathways({ year }: { year: number }) {
  const { nodes, groups } = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      pts.push([280 + Math.cos(a) * 172, 280 + Math.sin(a) * 172]);
    }
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 - Math.PI / 2 + 0.12;
      pts.push([280 + Math.cos(a) * 268, 280 + Math.sin(a) * 268]);
    }
    // a line belongs to the first year both of its people are on the team
    const sizes = YEARS.map((r) => r.team);
    const g: string[] = sizes.map(() => "");
    for (let a = 0; a < 25; a++)
      for (let b = a + 1; b < 25; b++) {
        const k = sizes.findIndex((n) => b < n);
        g[k] += `M${pts[a][0].toFixed(1)} ${pts[a][1].toFixed(1)}L${pts[b][0].toFixed(1)} ${pts[b][1].toFixed(1)}`;
      }
    return { nodes: pts.map((p, i) => ({ p, k: sizes.findIndex((n) => i < n) })), groups: g };
  }, []);
  const row = YEARS[year];
  return (
    <div className="pg pg-chart pw" data-year={year}>
      <Folio n={5} side="r" />
      <div className="pw-stats" aria-hidden="true">
        <div>
          <b>{row.team}</b>
          <span>{T.pathways.team}</span>
        </div>
        <div className="is-hot">
          <b>{row.lines}</b>
          <span>{T.pathways.lines}</span>
        </div>
        <div>
          <b>{row.take}</b>
          <span>{T.inversion.take}</span>
        </div>
      </div>
      <svg className="pw-net" viewBox="0 0 560 560" role="img" aria-label={T.pathways.alt}>
        {groups.map((d, k) => (
          <path key={k} className={`pw-lines pw-g${k}`} d={d} />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} className={`pw-node pw-g${n.k}`} cx={n.p[0]} cy={n.p[1]} r={9} />
        ))}
      </svg>
      <p className="pw-years" aria-hidden="true">
        {YEARS.map((r, i) => (
          <span key={r.year} className={i === year ? "on" : ""}>
            {r.year}
          </span>
        ))}
      </p>
    </div>
  );
}

/** the cycle as the back cover draws it: up, across, a little down, and again; against the trap's one spike */
function Cycle() {
  const pts: [number, number][] = [
    [0, 420], [95, 290], [180, 290], [225, 330], [320, 190], [405, 190], [450, 230], [545, 90], [560, 90],
  ];
  const tone = ["up", "side", "down"];
  return (
    <div className="pg pg-chart cy">
      <Folio n={9} side="r" />
      <svg className="cy-chart" viewBox="-6 60 580 380" role="img" aria-label={T.cycle.alt}>
        <line className="inv-base" x1={0} x2={560} y1={420} y2={420} />
        <g className="cy-trap">
          <path d="M0 420 C 70 410 110 380 150 230 C 175 320 195 395 230 420" />
          <text x={8} y={212}>
            {T.cycle.trap}
          </text>
        </g>
        {pts.slice(1).map((p, i) => (
          <path key={i} className={`cy-seg is-${tone[i % 3]}`} style={vars({ "--k": i })} pathLength={1} d={`M${pts[i][0]} ${pts[i][1]}L${p[0]} ${p[1]}`} />
        ))}
      </svg>
      <ol className="cy-list">
        {T.cycle.steps.map((s, i) => (
          <li key={s.tone} className={`is-${s.tone}`} style={vars({ "--k": i })}>
            <i aria-hidden="true" />
            {s.line}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Systems() {
  return (
    <div className="pg pg-chart sy">
      <Folio n={11} side="r" />
      <div className="sy-grid">
        {SYSTEMS.map((row, r) => (
          <div key={row.tone} className={`sy-row is-${row.tone}`}>
            <span className="sy-phase">{row.phase}</span>
            {row.items.map((name, c) => (
              <span key={name} className="sy-tile" style={vars({ "--k": r * 4 + c })}>
                {name}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="pg-caption">{T.systems.caption}</p>
    </div>
  );
}

type FormState = "idle" | "busy" | "sent" | "joined" | "soon" | "bad" | "failed";
function Join() {
  const b = COPY.closed.block;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [sentTo, setSentTo] = useState("");
  useEffect(() => {
    void optinLive(); // ask early, so the first press answers at once
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "busy") return;
    if (!validEmail(email)) return setState("bad");
    setState("busy");
    try {
      const r = await sendOptin(email, "home");
      setSentTo(email.trim());
      setState(r.emailed ? "sent" : r.already ? "joined" : "soon");
    } catch (err) {
      setState((err as Error).message === "email" ? "bad" : "failed");
    }
  };
  const done = state === "sent" || state === "joined";
  const message =
    state === "sent" ? b.sentTo.replace("{email}", sentTo) : state === "joined" ? b.already : state === "soon" ? b.soon : state === "bad" ? b.badEmail : state === "failed" ? b.sendFailed : "";
  return (
    <form className={`join is-${state}`} onSubmit={submit} noValidate>
      <div className="join-row">
        <label className="sr-only" htmlFor="join-email">
          {b.email}
        </label>
        <input
          id="join-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={b.placeholder}
          value={email}
          disabled={done}
          aria-invalid={state === "bad"}
          aria-describedby="join-status"
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "idle" && state !== "busy") setState("idle");
          }}
        />
        <button type="submit" disabled={state === "busy" || done}>
          {state === "busy" ? b.sending : state === "sent" ? b.sent : state === "joined" ? b.joined : COPY.hero.join}
        </button>
      </div>
      <p id="join-status" className="join-status" role="status">
        {message}
      </p>
    </form>
  );
}

export function BookPage() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const book = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const spine = useRef<HTMLDivElement>(null);
  const leaves = useRef<(HTMLDivElement | null)[]>([]);
  const [year, setYear] = useState(0);
  const [phase, setPhase] = useState<"hero" | "read" | "end">("hero");

  // one fast scroll that starts on the closed book stops on it (Michael, 13 Nov)
  useEffect(() => {
    const stop = () => {
      const el = section.current;
      if (!el) return 0;
      const vh = (stage.current?.offsetHeight ?? window.innerHeight) / 100;
      return Math.round(el.getBoundingClientRect().top + window.scrollY + startOf("hero") + 28 * vh);
    };
    return holdHero(stop, () => lenis);
  }, []);

  useEffect(() => {
    let raf = 0;
    let lastYear = 0;
    let lastPhase = "hero";
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const sec = section.current;
      const st = stage.current;
      if (!sec || !st || !rig.current || !book.current || !cover.current) return;
      const vw = st.offsetWidth;
      const vh = st.offsetHeight;
      const narrow = vw / vh < 0.85;
      const y = (window.scrollY - sec.offsetTop) / (vh / 100);
      const f = filmAt(Math.max(0, Math.min(TOTAL, y)), narrow);

      // sizes: the closed book on the hero, the open spread (or one page, on a phone), the closed book beside the form
      const sHero = narrow ? Math.min((0.5 * vh) / H, (0.66 * vw) / W) : Math.min((0.64 * vh) / H, (0.5 * vw) / W);
      const sRead = narrow ? Math.min((0.9 * vw) / W, (0.72 * vh) / H) : Math.min((0.94 * vw) / (2 * W + 40), (0.8 * vh) / H);
      const sEnd = narrow ? Math.min((0.3 * vh) / H, (0.4 * vw) / W) : Math.min((0.56 * vh) / H, (0.3 * vw) / W);
      const a = f.approach;
      const c = f.close;
      const idle = reduced ? 0 : 1 - a;
      const sway = Math.sin((now - t0) / 2300) * 4 * idle;
      const bob = 0;
      const s = lerp(lerp(sHero, sRead, a), sEnd, c);
      const rx = lerp(lerp(4, narrow ? 12 : 20, a), 4, c);
      const ry = lerp(lerp(27, 0, a), 27, c) + sway;
      const tx = lerp(0, narrow ? 0 : -0.24 * vw, c);
      const ty = lerp(lerp(-0.07 * vh, 0.012 * vh, a), narrow ? -0.27 * vh : -0.01 * vh, c) + bob;
      rig.current.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${s.toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${f.spin.toFixed(2)}deg)`;
      book.current.style.transform = `translate3d(${(-f.pan * W * 0.5).toFixed(1)}px, 0, ${(-D / 2).toFixed(1)}px)`;

      // the cover comes off the top of the block and lies down on the table
      const top = D + GAP * (LEAVES + 2);
      cover.current.style.transform = `translateZ(${lerp(top, GAP, f.cover).toFixed(2)}px) rotateY(${(-180 * f.cover).toFixed(2)}deg)`;
      cover.current.style.setProperty("--turn", Math.sin(Math.PI * f.cover).toFixed(3));
      if (spine.current) spine.current.style.opacity = (1 - f.cover * 4).toFixed(2);
      for (let i = 0; i < LEAVES; i++) {
        const el = leaves.current[i];
        if (!el) continue;
        const p = f.leaf[i];
        const z = lerp(D + GAP * (LEAVES - i), 9 + GAP * (i + 2), p); // turned, it lies on the opened cover's board (7 thick)
        el.style.transform = `translateZ(${z.toFixed(2)}px) rotateY(${(-180 * p).toFixed(2)}deg)`;
        el.style.setProperty("--turn", Math.sin(Math.PI * p).toFixed(3));
      }
      const css = st.style;
      // the light: one key lamp above and a little to the right of the camera. Each face of the book is as
      // bright as it is turned towards it (the page turn's own shading is --turn, above)
      const cx = Math.cos((rx * Math.PI) / 180);
      const sx = Math.sin((rx * Math.PI) / 180);
      const cy = Math.cos((ry * Math.PI) / 180);
      const sy = Math.sin((ry * Math.PI) / 180);
      const lit = (x: number, y: number, z: number) => {
        const X = x * cy + z * sy;
        const Z0 = -x * sy + z * cy;
        const Y = y * cx - Z0 * sx;
        const Z = y * sx + Z0 * cx;
        return (1 - (0.5 + 0.5 * Math.max(0, X * 0.15 - Y * 0.5 + Z * 0.85))) * 0.92;
      };
      css.setProperty("--d-front", lit(0, 0, 1).toFixed(3));
      css.setProperty("--d-back", lit(0, 0, -1).toFixed(3));
      css.setProperty("--d-spine", lit(-1, 0, 0).toFixed(3));
      css.setProperty("--d-fore", lit(1, 0, 0).toFixed(3));
      css.setProperty("--d-head", lit(0, -1, 0).toFixed(3));
      css.setProperty("--d-tail", lit(0, 1, 0).toFixed(3));
      css.setProperty("--sheen", ((ry - 6) * 3.2).toFixed(1));
      css.setProperty("--stand", Math.max(1 - a, c).toFixed(3));
      // a leaf standing up throws its shadow on the page under it
      const shadow = (p: number) => (p < 0.5 ? Math.sin(Math.PI * p) : Math.sin(Math.PI * p) * (1 - (p - 0.5) * 2));
      for (let i = 0; i < LEAVES; i++) leaves.current[i]?.style.setProperty("--cast", shadow(i ? f.leaf[i - 1] : f.cover).toFixed(3));
      css.setProperty("--cast-last", shadow(f.leaf[LEAVES - 1]).toFixed(3));
      css.setProperty("--hero", f.hero.toFixed(3));
      css.setProperty("--end", f.end.toFixed(3));
      css.setProperty("--c1", f.c1.toFixed(4));
      css.setProperty("--c4", f.c4.toFixed(4));
      css.setProperty("--c5", f.c5.toFixed(4));
      css.setProperty("--open", f.cover.toFixed(3));
      if (f.year !== lastYear) setYear((lastYear = f.year));
      const ph = f.end > 0.5 ? "end" : f.hero > 0.5 ? "hero" : "read";
      if (ph !== lastPhase) setPhase((lastPhase = ph) as "hero" | "read" | "end");
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const h = COPY.hero;
  const e = COPY.closed;
  const leaf = (i: number, front: ReactNode, back: ReactNode) => (
    <div
      className="leaf"
      ref={(el) => {
        leaves.current[i] = el;
      }}
    >
      <div className="face front">
        {front}
        <i className="shade" />
        <i className="cast" />
      </div>
      <div className="face back">
        {back}
        <i className="shade" />
      </div>
    </div>
  );

  return (
    <>
      <header className={`bk-nav is-${phase}`}>
        <a className="bk-brand" href="#top" aria-label="Scaling Up-Side-Down, back to the top">
          <span className="mark" aria-hidden="true">
            <i className="up" />
            <i className="side" />
            <i className="down" />
          </span>
          <span>Scaling Up-Side-Down</span>
        </a>
        <nav aria-label="Site">
          <a href={APPENDIX_URL}>{T.nav.appendix}</a>
          <a className="bk-nav-join" href="#join">
            {T.nav.join}
          </a>
        </nav>
      </header>
      <main>
        <section className="bk" id="top" ref={section} style={vars({ "--total": TOTAL })} data-phase={phase}>
          <span className="bk-anchor" id="join" style={{ top: `${startOf("end") + 30}svh` }} />
          <div className="bk-stage" ref={stage}>
            <div className="bk-glow" aria-hidden="true" />
            <div className="bk-scene">
              <div className="bk-enter">
                <div className="bk-rig" ref={rig}>
                  <div className="bk-floor" aria-hidden="true" />
                  <div className="bk-book" ref={book}>
                    <div className="bk-table" aria-hidden="true">
                      <i className="tl" />
                      <i className="tr" />
                    </div>
                    <div className="board back-board">
                      <img src={art("back.webp")} alt="" width={1000} height={1500} />
                      <i className="stock" />
                      <i className="groove" />
                      <i className="lit" />
                    </div>
                    <div className="rim rim-fore" />
                    <div className="rim rim-head" />
                    <div className="rim rim-tail" />
                    <div className="pastedown" />
                    <div className="edge edge-fore" />
                    <div className="edge edge-head" />
                    <div className="edge edge-tail" />
                    <div className="spine" ref={spine}>
                      <img src={art("spine.webp")} alt="" />
                      <i className="stock" />
                    </div>
                    <div className="last">
                      <Systems />
                      <i className="shade" />
                      <i className="cast" />
                    </div>
                    {leaf(
                      4,
                      <Cycle />,
                      <Words n={10} kicker={T.systems.kicker} headline={T.systems.headline} body={T.systems.body} />,
                    )}
                    {leaf(
                      3,
                      <div className="pg pg-shout is-flipped">
                        <p>{T.upside.b}</p>
                      </div>,
                      <Words n={8} kicker={T.cycle.kicker} headline={T.cycle.headline} body={T.cycle.body} />,
                    )}
                    {leaf(
                      2,
                      <Pathways year={year} />,
                      <div className="pg pg-shout">
                        <p>{T.upside.a}</p>
                      </div>,
                    )}
                    {leaf(1, <Inversion />, <Words n={4} kicker={T.pathways.kicker} tone="down" headline={T.pathways.headline} />)}
                    {leaf(
                      0,
                      <div className="pg pg-for">
                        <p>{h.detail}</p>
                        <span>{T.running.author}</span>
                      </div>,
                      <Words n={2} kicker={T.grow.kicker} tone="up" headline={T.grow.headline} body={T.grow.body} />,
                    )}
                    <div className="leaf cover" ref={cover}>
                      <div className="face front">
                        <img src={art("front.webp")} alt={h.cover} width={1000} height={1500} fetchPriority="high" />
                        <i className="stock" />
                        <i className="groove" />
                        <i className="sheen" />
                        <i className="lit" />
                      </div>
                      <div className="rim rim-fore" />
                      <div className="rim rim-head" />
                      <div className="rim rim-tail" />
                      <div className="face back endpaper">
                        <i className="shade" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bk-grain" aria-hidden="true" />
            <div className="bk-hero" inert={phase !== "hero"}>
              <h1 className="sr-only">
                {h.title.replace("\n", " ")}. {h.sub}
              </h1>
              <a className="bk-cta" href="#join">
                {h.join}
              </a>
              <p className="bk-free">{h.free}</p>
              <p className="bk-cue" aria-hidden="true">
                {T.cue}
              </p>
            </div>

            <div className="bk-end" inert={phase !== "end"}>
              <p className="bk-kicker">{e.copy.kicker}</p>
              <h2>{e.copy.headline}</h2>
              <p className="bk-deck">{e.copy.deck}</p>
              <Join />
              <p className="bk-offer">{e.copy.offer}</p>
              <p className="bk-links">
                {LINKS.preorder ? <a href={LINKS.preorder}>{e.book.button}</a> : <span>{e.book.soon}</span>}
                <a href={APPENDIX_URL}>{e.block.appendix}</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="bk-foot">
        <p className="bk-foot-line">{COPY.footer.line}</p>
        <p className="bk-foot-meta">
          <span>Scaling Up-Side-Down · Michael Wentz</span>
          <a href={APPENDIX_URL}>{T.nav.appendix}</a>
          <button type="button" onClick={(ev) => openNotice(ev.currentTarget)}>
            {COPY.notice.title}
          </button>
        </p>
      </footer>
    </>
  );
}
