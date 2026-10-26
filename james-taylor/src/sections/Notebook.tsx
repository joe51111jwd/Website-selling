import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { DISHES, type Dish } from "../content";
import { Clip, Clipping, Cutout, Doodle, Label, Note, Piece, Print, Scrap, Spread } from "../ui/collage";
import { Counter } from "../ui/Counter";
import "./Notebook.css";

const dish = (id: Dish["id"]) => DISHES.find((d) => d.id === id)!;

/** The signatures as pages of a chef's notebook: what goes in, how it's cooked, what people said.
 * Ingredients, not plates: these are his dishes in his words, not someone else's photo of them. */
export function Notebook() {
  return (
    <div id="menu" className="book-pages">
      <header className="nb-head wrap">
        <p className="eyebrow">Signatures</p>
        <h2 className="display">
          The <span className="hand nb-scrawl">notebook</span>
        </h2>
        <p className="nb-sub type">Five dishes from The Joyce, taken apart.</p>
      </header>

      {/* 01 ribeye */}
      <Page id="ribeye" h="104vh" mh="165svh">
        <Piece at={{ x: 5, y: 6, w: 44, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head d={dish("ribeye")} />
        </Piece>
        <Piece at={{ x: 50, y: 4, w: 46, r: -6, z: 4 }} m={{ x: 4, y: 17, w: 92, r: -6, z: 4 }} depth={0.22} drag order={1}>
          <Cutout id="rib-cooked" />
        </Piece>
        <Piece at={{ x: 6, y: 42, w: 30, r: -1, z: 3 }} m={{ x: 5, y: 44, w: 72, r: -1, z: 3 }} depth={0.04} order={2}>
          <Specs d={dish("ribeye")} />
        </Piece>
        <Piece at={{ x: 55, y: 62, w: 18, r: -5, z: 5 }} m={{ x: 50, y: 18, w: 46, r: -5, z: 5 }} depth={0.3} order={3}>
          <Note>broiled from ABOVE</Note>
          <Doodle kind="arrowDown" className="nb-up" />
        </Piece>
        <Piece at={{ x: 75, y: 58, w: 21, r: 5, z: 5 }} m={{ x: 30, y: 66, w: 64, r: 5, z: 5 }} depth={0.26} drag order={4}>
          <Clip id="carving" caption="carving the rib, 1950s film" />
        </Piece>
        <Piece at={{ x: 24, y: 70, w: 30, r: -2, z: 6 }} m={{ x: 6, y: 86, w: 88, r: -2, z: 6 }} depth={0.12} order={5}>
          <Clipping outlet="The Infatuation" when="March 2026" rating="8.0">
            {dish("ribeye").quote!.text}
          </Clipping>
        </Piece>
      </Page>

      {/* 02 burger */}
      <Page id="burger" h="124vh" mh="190svh">
        <Piece at={{ x: 50, y: 4, w: 46, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head d={dish("burger")} />
        </Piece>
        <Piece at={{ x: 5, y: 5, w: 30, r: -4, z: 3 }} m={{ x: 4, y: 14, w: 66, r: -4, z: 3 }} depth={0.16} drag order={1}>
          <Print id="bun" frame="polaroid" caption="the bun that made the cut: brioche" tape="none" />
        </Piece>
        <Piece at={{ x: 52, y: 30, w: 38, r: 2, z: 4 }} m={{ x: 4, y: 37, w: 92, r: 2, z: 4 }} depth={0.06} order={2}>
          <Scrap tone="newsprint" className="dict">
            <p className="dict-word">
              <b>burg·er·a·bil·i·ty</b> <i>noun.</i>
            </p>
            <p className="dict-def">“…what I call ‘burgerability’, meaning a burger that holds together…”</p>
            <p className="type story-by">James Taylor</p>
          </Scrap>
        </Piece>
        <Piece at={{ x: 6, y: 47, w: 40, r: -1, z: 3 }} m={{ x: 4, y: 53, w: 92, r: -1, z: 3 }} depth={0.04} order={3}>
          <Scrap tone="grid" className="buns">
            <p className="type buns-title">Bun trials</p>
            <BunGrid />
            <Note color="biro" className="buns-note">
              “at least twenty different buns”
            </Note>
          </Scrap>
        </Piece>
        <Piece at={{ x: 54, y: 56, w: 36, r: -2, z: 5 }} m={{ x: 6, y: 76, w: 88, r: -2, z: 5 }} depth={0.1} order={4}>
          <Scrap tone="white" className="nb-quote">
            <p className="serif">
              “We use a brioche bun, American cheese because it melts the best, and all-beef patties with a 75:25 ratio.”
            </p>
            <p className="type story-by">James Taylor, World Red Eye</p>
          </Scrap>
        </Piece>
        <Piece at={{ x: 52, y: 82, w: 42, r: 1, z: 6 }} m={{ x: 4, y: 91, w: 92, r: 1, z: 6 }} depth={0.2} order={5}>
          <dl className="nb-stats">
            <div>
              <dt className="display">
                <Counter to={3} />
              </dt>
              <dd className="type">years to get it right</dd>
            </div>
            <div>
              <dt className="display">100s</dt>
              <dd className="type">of iterations</dd>
            </div>
            <div>
              <dt className="display">
                <Counter to={20} suffix="+" />
              </dt>
              <dd className="type">buns tried</dd>
            </div>
          </dl>
        </Piece>
      </Page>

      {/* 03 caviar & latkes */}
      <Page id="latkes" h="80vh" mh="118svh">
        <Piece at={{ x: 5, y: 8, w: 44, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head d={dish("latkes")} />
        </Piece>
        <Piece at={{ x: 52, y: 6, w: 27, r: 8, z: 4 }} m={{ x: 6, y: 25, w: 56, r: 8, z: 4 }} depth={0.24} drag order={1}>
          <Cutout id="caviar" />
        </Piece>
        <Piece at={{ x: 64, y: 52, w: 30, r: -12, z: 5 }} m={{ x: 50, y: 50, w: 50, r: -12, z: 5 }} depth={0.3} drag order={2}>
          <Cutout id="potato" />
        </Piece>
        <Piece at={{ x: 6, y: 46, w: 32, r: -1, z: 3 }} m={{ x: 5, y: 64, w: 82, r: -1, z: 3 }} depth={0.04} order={3}>
          <Specs d={dish("latkes")} />
        </Piece>
        <Piece at={{ x: 42, y: 70, w: 18, r: -4, z: 6 }} m={{ x: 56, y: 40, w: 40, r: -4, z: 6 }} depth={0.34} order={4}>
          <Note>fried till it shatters</Note>
        </Piece>
      </Page>

      {/* 04 firecracker chicken */}
      <Page id="chicken" h="84vh" mh="120svh">
        <Piece at={{ x: 50, y: 8, w: 46, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head d={dish("chicken")} />
        </Piece>
        <Piece at={{ x: 6, y: 6, w: 36, r: -14, z: 4 }} m={{ x: 8, y: 28, w: 70, r: -14, z: 4 }} depth={0.24} drag order={1}>
          <Cutout id="chiles" />
        </Piece>
        <Piece at={{ x: 52, y: 46, w: 34, r: 1.5, z: 3 }} m={{ x: 5, y: 64, w: 86, r: 1.5, z: 3 }} depth={0.04} order={2}>
          <Specs d={dish("chicken")} />
        </Piece>
        <Piece at={{ x: 10, y: 66, w: 30, r: -3, z: 5 }} m={{ x: 6, y: 88, w: 88, r: -3, z: 5 }} depth={0.3} order={3}>
          <Note>Sundays: crab rangoon, General Tso's, beef &amp; broccoli</Note>
        </Piece>
      </Page>

      {/* 05 sour orange pie */}
      <Page id="pie" h="84vh" mh="112svh">
        <Piece at={{ x: 5, y: 8, w: 44, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head d={dish("pie")} />
        </Piece>
        <Piece at={{ x: 56, y: 6, w: 25, r: 0, z: 4 }} m={{ x: 8, y: 26, w: 52, r: 0, z: 4 }} depth={0.22} drag order={1}>
          <Cutout id="orange" />
        </Piece>
        <Piece at={{ x: 79, y: 34, w: 15, r: 38, z: 5 }} m={{ x: 62, y: 38, w: 32, r: 38, z: 5 }} depth={0.32} drag order={2}>
          <Cutout id="orange" />
        </Piece>
        <Piece at={{ x: 6, y: 46, w: 32, r: -1, z: 3 }} m={{ x: 5, y: 62, w: 84, r: -1, z: 3 }} depth={0.04} order={3}>
          <Specs d={dish("pie")} />
        </Piece>
        <Piece at={{ x: 52, y: 68, w: 30, r: -4, z: 6 }} m={{ x: 6, y: 90, w: 88, r: -3, z: 6 }} depth={0.3} order={4}>
          <Note>{dish("pie").blurb}</Note>
        </Piece>
      </Page>
    </div>
  );
}

function Page({ id, h, mh, children }: { id: Dish["id"]; h: string; mh: string; children: ReactNode }) {
  const d = dish(id);
  return (
    <Spread className="nb" id={id === "burger" ? "burger" : `dish-${id}`} label={d.name} style={{ "--h": h, "--mh": mh } as CSSProperties}>
      {children}
    </Spread>
  );
}

function Head({ d }: { d: Dish }) {
  return (
    <div className="nb-dish">
      <Label tone="red">No. {d.no}</Label>
      <h3 className="display">{d.name}</h3>
      <p className="hand nb-subline">{d.sub}</p>
    </div>
  );
}

function Specs({ d }: { d: Dish }) {
  return (
    <Scrap tone="white" className="specs">
      <p className="type specs-blurb">{d.blurb}</p>
      <dl>
        {d.specs.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Scrap>
  );
}

// twenty buns, drawn in biro; nineteen get crossed out
function BunGrid() {
  return (
    <div className="bun-grid" aria-label="Twenty buns tried, nineteen crossed out, the brioche circled">
      {Array.from({ length: 20 }, (_, i) => {
        const keep = i === 13;
        const w = 0.8 + ((i * 37) % 9) / 30;
        const h = 0.5 + ((i * 53) % 7) / 28;
        return (
          <div key={i} className={`bun ${keep ? "keep" : ""}`}>
            <svg viewBox="0 0 60 40" aria-hidden>
              <path
                d={`M${30 - 26 * w} 30 Q ${30 - 26 * w} ${30 - 26 * h}, 30 ${30 - 26 * h} T ${30 + 26 * w} 30 Z`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {i % 3 === 0 && <path d="M18 18 l2 -1 M28 14 l2 0 M38 17 l2 1" stroke="currentColor" strokeWidth="1.6" />}
              <path d={`M${30 - 24 * w} 33 L ${30 + 24 * w} 33`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {keep ? (
              <Doodle kind="circle" className="bun-ring" />
            ) : (
              <motion.span
                className="bun-x"
                initial={{ opacity: 0, scale: 1.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 + i * 0.05, type: "spring", stiffness: 500, damping: 20 }}
              >
                <Doodle kind="cross" width={8} />
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}
