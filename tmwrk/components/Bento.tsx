"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { runNow } from "@/app/actions";
import type { Bento as B, Feature } from "@/lib/bento";

const n = (x: number) => Math.round(x).toLocaleString("en-US");

/** counts up to a number once, on mount */
function useCount(to: number, ms = 900) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to);
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(to * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
}

const KIND: Record<Feature["kind"], string> = { alert: "Alert today", held: "Still high", rising: "Rising", closest: "Closest to the line" };

export function Bento({ b }: { b: B }) {
  const [i, setI] = useState(0);
  const f = b.features[i];
  return (
    <div className="bento">
      {f ? <Player b={b} f={f} i={i} setI={setI} /> : <section className="tile tile--dark t-player"><p className="muted">No tracks yet.</p></section>}
      <Clock b={b} />
      {f && <Big f={f} />}
      {f && <Streak f={f} />}
      <Rings b={b} />
      <Alerts b={b} />
      <Tracks b={b} />
      <Week b={b} />
      {f && <Steps f={f} />}
      <Rule b={b} />
      <Count b={b} />
      <Run />
      <Search b={b} />
    </div>
  );
}

function Player({ b, f, i, setI }: { b: B; f: Feature; i: number; setI: (n: number) => void }) {
  const k = b.features.length;
  const p = Math.min(1, f.level / Math.max(f.line, 1));
  return (
    <section className="tile tile--dark t-player" style={{ ["--i" as string]: 0 }}>
      <div className={`cover cover--${f.kind === "closest" ? "quiet" : f.platform}`}>
        <span className="cover__x">{f.times}</span>
        <i className="cover__ring" />
      </div>
      <div className="player__meta">
        <div>
          <p className="player__kind">{KIND[f.kind]} · {f.platformLabel}</p>
          <h2>{f.title}</h2>
          <p className="player__artist">{f.artist}{f.year ? ` · ${f.year}` : ""}</p>
        </div>
        <span className="eq" aria-hidden="true"><i /><i /><i /><i /></span>
      </div>
      <div className="scrub" aria-label={`${n(f.level)} against an alert line of ${n(f.line)}`}>
        <span className="scrub__bar"><i style={{ width: `${p * 100}%` }} /><b style={{ left: `${p * 100}%` }} /></span>
        <span className="scrub__ends"><span>usual {n(f.usual)}</span><span>{n(f.level)} {f.platform === "tiktok" ? "videos" : "streams"}</span></span>
      </div>
      <p className="player__other">
        <span>{f.other.label}</span>
        <b>{n(f.other.level)}</b> <span>{f.other.usual > 0 ? (f.other.level / f.other.usual > 1.25 ? "up" : f.other.level / f.other.usual < 0.75 ? "down" : "steady") : ""} · usual {n(f.other.usual)}</span>
      </p>
      <div className="controls">
        <button aria-label="Previous" disabled={k < 2} onClick={() => setI((i - 1 + k) % k)}><svg viewBox="0 0 20 20"><path d="M6 5v10M15 5l-7 5 7 5z" /></svg></button>
        <a className="controls__play" href={f.link} target="_blank" rel="noopener" aria-label={`Open on ${f.platformLabel}`}>
          <svg viewBox="0 0 20 20"><path d="M7 5l9 5-9 5z" /></svg>
        </a>
        <button aria-label="Next" disabled={k < 2} onClick={() => setI((i + 1) % k)}><svg viewBox="0 0 20 20"><path d="M14 5v10M5 5l7 5-7 5z" /></svg></button>
      </div>
      {k > 1 && <p className="player__count">{i + 1} of {k}</p>}
    </section>
  );
}

function Clock({ b }: { b: B }) {
  return (
    <section className="tile tile--white t-clock" style={{ ["--i" as string]: 1 }}>
      <p className="tile__top"><span>Last check</span><span className={`live ${b.simulated ? "live--demo" : ""}`}><i />{b.simulated ? "Demo" : "Live"}</span></p>
      <p className="clock">{b.checkedAt ?? "--:--"}</p>
      <p className="tile__sub">{b.todayLong}</p>
      <p className="tile__foot"><b>UTC</b> · next check 1:17 PM</p>
    </section>
  );
}

function Big({ f }: { f: Feature }) {
  const v = useCount(f.level);
  const W = 520, H = 92;
  const max = Math.max(...f.series, f.line) * 1.05 || 1;
  const pts = f.series.map((y, i) => [(i / Math.max(1, f.series.length - 1)) * W, H - (y / max) * H] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  const ly = H - (f.line / max) * H;
  return (
    <section className="tile t-big" style={{ ["--i" as string]: 2 }}>
      <p className="tile__top">
        <span>{f.platform === "tiktok" ? "New TikTok videos a day" : "Spotify streams a day"} · {f.title}</span>
        <span className="pill pill--blue">{f.pct >= 0 ? "+" : ""}{n(f.pct)}%</span>
      </p>
      <p className="big">{n(v)}</p>
      <p className="tile__sub">usually {n(f.usual)} a day · alert at {n(f.line)}</p>
      <div className="spark__wrap">
        <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" x2={W} y1={ly} y2={ly} className="spark__line" />
          <path d={d} className="spark__path" />
        </svg>
        {last && <i className="spark__dot" style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }} />}
      </div>
    </section>
  );
}

function Streak({ f }: { f: Feature }) {
  return (
    <section className="tile t-streak" style={{ ["--i" as string]: 3 }}>
      <p className="tile__label">Days over the line</p>
      <p className="mid">{f.daysOver} <span>{f.daysOver === 1 ? "day" : "days"}</span></p>
      <div className="squares" aria-label="Last 7 days">
        {f.last7Over.map((on, i) => <i key={i} className={on ? "on" : ""} />)}
      </div>
      <p className="tile__foot">{f.title} on {f.platformLabel}, last 7 days</p>
    </section>
  );
}

function Rings({ b }: { b: B }) {
  const R = [52, 40, 28];
  return (
    <section className="tile tile--dark t-rings" style={{ ["--i" as string]: 4 }}>
      <svg viewBox="0 0 130 130" className="rings" aria-hidden="true">
        {b.rings.map((r, k) => {
          const c = 2 * Math.PI * R[k];
          return (
            <g key={k}>
              <circle cx="65" cy="65" r={R[k]} className="ring__bg" />
              <circle cx="65" cy="65" r={R[k]} className={`ring ring--${k}`} strokeDasharray={c} style={{ ["--off" as string]: c * (1 - Math.min(1, r.p)) , ["--c" as string]: c }} transform="rotate(-90 65 65)" />
            </g>
          );
        })}
      </svg>
      <p className="tile__label tile__label--light">How close to the alert line</p>
      <ul className="rings__key">
        {b.rings.map((r, k) => (
          <li key={k}><i className={`k k--${k}`} /><span className="rk__name">{r.title} <span>{r.platform}</span></span><b>{r.p >= 1 ? "over" : `${Math.round(r.p * 100)}%`}</b></li>
        ))}
      </ul>
    </section>
  );
}

function Alerts({ b }: { b: B }) {
  return (
    <section className="tile t-alerts" style={{ ["--i" as string]: 5 }}>
      <p className="tile__top"><span>Recent alerts</span><Link href="/outbox">Emails</Link></p>
      <ul className="notes">
        {b.alerts.map((a) => (
          <li key={a.id}>
            <Link href={`/track/${a.trackId}`} className="note">
              <span className={`appicon appicon--${a.platform}`}>{a.platform === "tiktok" ? <TikTok /> : <Spotify />}</span>
              <span className="note__txt"><b>{a.title}</b><span>{n(a.level)} {a.platform === "tiktok" ? "new videos" : "streams"} · {a.times} usual</span></span>
              <span className="note__when">{a.when}</span>
            </Link>
          </li>
        ))}
        {!b.alerts.length && <li className="muted">No alerts yet.</li>}
      </ul>
    </section>
  );
}

function Tracks({ b }: { b: B }) {
  const [who, setWho] = useState("all");
  const shown = b.tracks.filter((t) => who === "all" || t.artistId === who);
  return (
    <section className="tile t-tracks" style={{ ["--i" as string]: 6 }}>
      <div className="seg" role="tablist" aria-label="Artist">
        {[{ id: "all", name: "All" }, ...b.artists].map((a) => (
          <button key={a.id} role="tab" aria-selected={who === a.id} onClick={() => setWho(a.id)}>{a.name.replace(" (TBC)", "")}</button>
        ))}
      </div>
      <ul className="meters">
        {shown.map((t) => (
          <li key={t.id}>
            <Link href={`/track/${t.id}`}>
              <span className="meters__row"><span><b>{t.title}</b> <span>{t.artist}</span></span><span className={t.hot ? "meters__x meters__x--hot" : "meters__x"}>{t.hot && <Bolt />}{t.times} <em>{t.platform}</em></span></span>
              <span className="meter"><i className={t.hot ? "hot" : ""} style={{ width: `${Math.max(3, t.p * 100)}%` }} /></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="tile__foot">Bar: how far each track is from its usual to its alert line, on its busier platform.</p>
    </section>
  );
}

function Week({ b }: { b: B }) {
  return (
    <section className="tile tile--white t-week" style={{ ["--i" as string]: 7 }}>
      <p className="tile__top"><span>{b.weekTitle.split(" · ")[0]}</span><span>{b.weekTitle.split(" · ")[1]}</span></p>
      <ol className="days">
        {b.week.map((d) => (
          <li key={d.date} className={`${d.today ? "today" : ""} ${d.alerts ? "has" : ""}`} title={d.alerts ? `${d.alerts} alert${d.alerts > 1 ? "s" : ""}` : "No alerts"}>
            <span>{d.label}</span><b>{d.day}</b><i />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Steps({ f }: { f: Feature }) {
  const items = f.platform === "tiktok"
    ? ["Open the sound and look at who's posting", "Check it's many creators, not one big account", "Put Spark Ads behind the best videos", "Make sure the sound links to the official track"]
    : ["Find what changed (a playlist add, a sync, a post)", "Pitch it while it's moving", "Run a Marquee or Showcase campaign"];
  const key = `tmwrk-steps:${f.id}:${f.platform}`;
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(key) || "null"); if (Array.isArray(v)) setDone(items.map((_, i) => !!v[i])); } catch { /* fine */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const toggle = (i: number) => {
    const next = done.map((x, k) => (k === i ? !x : x));
    setDone(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* fine */ }
  };
  return (
    <section className="tile t-steps" style={{ ["--i" as string]: 8 }}>
      <p className="tile__top"><span>Next steps · {f.title}</span><span>{done.filter(Boolean).length} of {items.length} done</span></p>
      <ul className="checks">
        {items.map((s, i) => (
          <li key={s}>
            <button className={done[i] ? "on" : ""} onClick={() => toggle(i)} aria-pressed={done[i]}>
              <i>{done[i] && <svg viewBox="0 0 20 20"><path d="M5 10.5 8.5 14 15 6.5" /></svg>}</i><span>{s}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Rule({ b }: { b: B }) {
  const [p, setP] = useState<"tiktok" | "spotify">("tiktok");
  const r = b.rule[p];
  return (
    <section className="tile t-rule" style={{ ["--i" as string]: 9 }}>
      <div className="seg seg--two">
        <button aria-selected={p === "tiktok"} onClick={() => setP("tiktok")}>TikTok</button>
        <button aria-selected={p === "spotify"} onClick={() => setP("spotify")}>Spotify</button>
      </div>
      <p className="rule"><b>{r.times}</b> <span>its usual</span></p>
      <p className="tile__sub">and at least {n(r.extra)} more {p === "tiktok" ? "new videos" : "streams"} in a day</p>
      <Link className="pill pill--blue rule__edit" href="/settings">Alert rules</Link>
    </section>
  );
}

function Count({ b }: { b: B }) {
  const v = useCount(b.count, 700);
  return (
    <Link href="/tracks" className="tile t-count" style={{ ["--i" as string]: 10 }}>
      <span className="count__icon"><svg viewBox="0 0 20 20"><path d="M8 15.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm0 0V5l9-1.5v10M17 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg></span>
      <b>{Math.round(v)}</b>
      <span>tracks watched</span>
    </Link>
  );
}

function RunButton() {
  const s = useFormStatus();
  const [done, setDone] = useState(false);
  const prev = useRef(false);
  useEffect(() => {
    const was = prev.current;
    prev.current = s.pending;
    if (was && !s.pending) {
      setDone(true);
      const t = setTimeout(() => setDone(false), 2400);
      return () => clearTimeout(t);
    }
  }, [s.pending]);
  return (
    <button className={`run ${s.pending ? "run--busy" : ""} ${done ? "run--done" : ""}`} disabled={s.pending}>
      <i className="run__fill" />
      <span>{s.pending ? "Checking…" : done ? "Checked" : "Run the check"}</span>
    </button>
  );
}

function Run() {
  return (
    <section className="tile t-run" style={{ ["--i" as string]: 11 }}>
      <form action={runNow}><RunButton /></form>
      <p className="tile__foot">Reads every track now instead of waiting for tomorrow.</p>
    </section>
  );
}

function Search({ b }: { b: B }) {
  const [q, setQ] = useState("");
  const [k, setK] = useState(0);
  const router = useRouter();
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? b.tracks.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(s)) : b.tracks.filter((t) => t.hot)).slice(0, 4);
  }, [q, b.tracks]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); document.getElementById("find")?.focus(); } };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, []);
  return (
    <section className="tile t-search" style={{ ["--i" as string]: 12 }}>
      <div className="find">
        <label className="find__box">
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3 3" /></svg>
          <input id="find" value={q} placeholder="Find a track" autoComplete="off"
            onChange={(e) => { setQ(e.target.value); setK(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setK((k + 1) % Math.max(1, hits.length)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setK((k - 1 + hits.length) % Math.max(1, hits.length)); }
              if (e.key === "Enter" && hits[k]) router.push(`/track/${hits[k].id}`);
            }} />
          <kbd>⌘K</kbd>
        </label>
        <ul>
          {hits.map((t, i) => (
            <li key={t.id}><Link href={`/track/${t.id}`} className={i === k ? "on" : ""}>{t.title} <span>{t.artist}</span>{i === k && <em>↵</em>}</Link></li>
          ))}
          {!hits.length && <li className="muted">{q ? "No track by that name." : "Nothing moving right now."}</li>}
        </ul>
      </div>
    </section>
  );
}

const Bolt = () => <svg className="bolt" viewBox="0 0 20 20"><path d="M11 2 4 11h5l-1 7 7-9h-5z" /></svg>;
const TikTok = () => <svg viewBox="0 0 20 20"><path d="M12.5 3c.3 1.9 1.5 3.1 3.5 3.3v2.4c-1.3 0-2.5-.4-3.5-1.1v4.9a4.3 4.3 0 1 1-4.3-4.3h.5v2.5a1.8 1.8 0 1 0 1.3 1.8V3z" /></svg>;
const Spotify = () => <svg viewBox="0 0 20 20"><path d="M5 7.5c3.5-1 7-.7 10 1M5.6 10.4c2.9-.8 5.7-.5 8.1.9M6.3 13.1c2.2-.6 4.3-.4 6.1.7" /></svg>;
