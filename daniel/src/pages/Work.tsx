import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { pad, still, work, type Project } from "../content/work";
import { GLMedia } from "../components/GLMedia";
import { Link } from "../components/Link";
import { ProjectList } from "../components/ProjectList";
import { Chars, Label, Reveal } from "../components/Text";
import { ease } from "../lib/ticker";
import { usePageReady } from "../lib/transition";

type View = "list" | "grid";

/** Every project. New entries in content/work.ts show up here on their own. */
export function Work() {
  const ready = usePageReady();
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<View>("list");
  const categories = useMemo(() => ["All", ...Array.from(new Set(work.map((p) => p.category)))], []);
  const items = filter === "All" ? work : work.filter((p) => p.category === filter);

  return (
    <div className="work-page" data-theme="paper">
      <header className="work-head wrap" data-x="header.work-head">
        <Label index="—">Index of work</Label>
        <h1 className="work-title">
          <Chars text="Work" play={ready} />
          <motion.sup initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 0.6, duration: 0.8 }}>
            ({pad(work.length)})
          </motion.sup>
        </h1>
        <Reveal className="work-intro" text={`Sites I've designed and built, *${work.at(-1)?.year}–${work[0].year}.* The three at the top get the full case study; everything else is just as live.`} immediate delay={0.3} />
      </header>

      <div className="work-controls wrap" data-x="div.controls">
        <LayoutGroup id="filters">
          <ul className="chips" aria-label="Filter by category">
            {categories.map((c) => {
              const count = c === "All" ? work.length : work.filter((p) => p.category === c).length;
              return (
                <li key={c}>
                  <button type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
                    {filter === c && <motion.span layoutId="chip" className="chip-bg" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                    <span className="chip-text">
                      {c} <sup>{pad(count)}</sup>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
        <div className="view-toggle" role="group" aria-label="View">
          {(["list", "grid"] as View[]).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
              {v === "list" ? "List" : "Grid"}
            </button>
          ))}
        </div>
      </div>

      <div className="wrap work-body">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${view}-${filter}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease }}
          >
            {view === "list" ? <ProjectList items={items} /> : <Grid items={items} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Grid({ items }: { items: Project[] }) {
  return (
    <ul className="wgrid" data-x="ul.grid">
      {items.map((p, i) => (
        <li key={p.slug} className={i % 2 ? "wgrid-item wgrid-item--low" : "wgrid-item"}>
          <Link
            to={`/work/${p.slug}`}
            className="wgrid-link"
            data-cursor="view"
            expand={(a) => ({ el: a.querySelector<HTMLElement>(".media") ?? undefined, media: still(p), zoom: 1.02 })}
          >
            <GLMedia media={still(p)} className="wgrid-media" options={{ reveal: true, hover: true, zoom: 1.02, radius: 3 }} />
            <span className="wgrid-caption">
              <span className="label">{pad(work.indexOf(p) + 1)}</span>
              <span className="wgrid-name">{p.name}</span>
              <span className="wgrid-meta">
                {p.category} · {p.year}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
