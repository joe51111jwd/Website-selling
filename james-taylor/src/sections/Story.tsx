import type { CSSProperties, ReactNode } from "react";
import { CHAPTERS, type Chapter } from "../content";
import { Clip, Doodle, Label, Note, Piece, Print, Scrap, Spread } from "../ui/collage";
import { Ticket } from "../ui/Ticket";
import "./Story.css";

const ch = (id: Chapter["id"]) => CHAPTERS.find((c) => c.id === id)!;

/** His career as five scrapbook pages: where he cooked, what it looked like, the tickets he fired. */
export function Story() {
  return (
    <div id="story" className="story">
      <header className="story-head wrap">
        <p className="eyebrow">The story</p>
        <h2 className="display">
          How he got
          <br />
          to the <span className="story-fire">fire</span>
        </h2>
        <Note color="biro" className="story-sub">
          five pages, one rail of tickets
        </Note>
      </header>

      {/* 01: TGI Fridays */}
      <Page c={ch("fridays")} h="94vh" mh="150svh">
        <Piece at={{ x: 5, y: 6, w: 40, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head c={ch("fridays")} />
        </Piece>
        <Piece at={{ x: 48, y: 7, w: 45, r: 2.5, z: 2 }} m={{ x: 3, y: 17, w: 94, r: 2, z: 2 }} depth={0.1} order={1}>
          <Print id="fridays" caption="TGI Fridays" tape="corners" />
        </Piece>
        <Piece at={{ x: 7, y: 40, w: 32, r: -1.5, z: 4 }} m={{ x: 5, y: 43, w: 86, r: -1.5, z: 4 }} depth={0.04} order={2}>
          <Body c={ch("fridays")} />
        </Piece>
        <Piece at={{ x: 34, y: 70, w: 32, r: -6, z: 5 }} m={{ x: 6, y: 71, w: 74, r: -5, z: 5 }} depth={0.18} drag order={3}>
          <Print id="fridays-sign" frame="bare" tape="side" />
        </Piece>
        <Piece at={{ x: 76, y: 58, w: 15, r: 7, z: 6 }} m={{ x: 52, y: 79, w: 44, r: 7, z: 6 }} depth={0.24} drag order={4}>
          <Ticket no="001" small />
        </Piece>
        <Piece at={{ x: 12, y: 80, w: 20, r: -4, z: 6 }} m={{ x: 4, y: 86, w: 44, r: -4, z: 6 }} depth={0.3} order={5}>
          <Note>he was five.</Note>
          <Doodle kind="underline" className="w-80" />
        </Piece>
      </Page>

      {/* 02: Chicago */}
      <Page c={ch("chicago")} h="108vh" mh="168svh">
        <Piece at={{ x: 56, y: 7, w: 40, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head c={ch("chicago")} />
        </Piece>
        <Piece at={{ x: 4, y: 6, w: 48, r: -2, z: 2 }} m={{ x: 2, y: 12, w: 96, r: -2, z: 2 }} depth={0.1} order={1}>
          <Print id="chicago-l" frame="copy" caption="the L, downtown Chicago" tape="top" />
        </Piece>
        <Piece at={{ x: 58, y: 36, w: 33, r: 1, z: 4 }} m={{ x: 5, y: 37, w: 88, r: 1, z: 4 }} depth={0.04} order={2}>
          <Body c={ch("chicago")} />
        </Piece>
        <Piece at={{ x: 37, y: 49, w: 20, r: -4, z: 5 }} m={{ x: 24, y: 51, w: 64, r: -4, z: 5 }} depth={0.16} drag order={3}>
          <Clip id="cuts" caption="rib steaks, 1950s butcher film" />
        </Piece>
        <Piece at={{ x: 59, y: 66, w: 15, r: -6, z: 5 }} m={{ x: 3, y: 74, w: 46, r: -6, z: 5 }} depth={0.2} drag order={4}>
          <Ticket no="018" small />
        </Piece>
        <Piece at={{ x: 77, y: 63, w: 15, r: 5, z: 5 }} m={{ x: 51, y: 76, w: 46, r: 5, z: 5 }} depth={0.26} drag order={5}>
          <Ticket no="BB3" small />
        </Piece>
        <Piece at={{ x: 4, y: 82, w: 28, r: -3, z: 6 }} m={{ x: 6, y: 92, w: 88, r: -3, z: 6 }} depth={0.3} order={6}>
          <Note>where the steaks got serious</Note>
          <Doodle kind="arrow" className="story-arrow-r" />
        </Piece>
      </Page>

      {/* 03: Roister, then Alinea */}
      <Page c={ch("alinea")} h="118vh" mh="170svh">
        <Piece at={{ x: 5, y: 5, w: 38, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head c={ch("alinea")} />
        </Piece>
        <Piece at={{ x: 45, y: 5, w: 36, r: -3, z: 2 }} m={{ x: 3, y: 13, w: 92, r: -3, z: 2 }} depth={0.1} order={1}>
          <Print id="alinea-balloon" caption="Alinea, Chicago: three Michelin stars" tape="top" />
        </Piece>
        <Piece at={{ x: 83, y: 13, w: 14, r: 8, z: 3 }} m={{ x: 60, y: 33, w: 37, r: 8, z: 3 }} depth={0.2} drag order={2}>
          <Print id="alinea-menu" frame="border" tape="top" />
        </Piece>
        <Piece at={{ x: 6, y: 33, w: 31, r: -1, z: 4 }} m={{ x: 4, y: 35, w: 56, r: -1, z: 4 }} depth={0.04} order={3}>
          <Body c={ch("alinea")} />
        </Piece>
        <Piece at={{ x: 34, y: 55, w: 26, r: 4, z: 3 }} m={{ x: 4, y: 58, w: 62, r: 4, z: 3 }} depth={0.16} drag order={4}>
          <Print id="alinea-dessert" frame="polaroid" caption="dessert, broken open on the table" tape="none" />
        </Piece>
        <Piece at={{ x: 63, y: 58, w: 30, r: -2, z: 5 }} m={{ x: 28, y: 76, w: 68, r: -2, z: 5 }} depth={0.08} order={5}>
          <Scrap tone="lined" className="story-quote">
            <p className="hand">“{ch("alinea").quote}”</p>
            <p className="type story-by">James Taylor</p>
          </Scrap>
        </Piece>
        <Piece at={{ x: 6, y: 74, w: 14, r: -6, z: 6 }} m={{ x: 2, y: 88, w: 45, r: -6, z: 6 }} depth={0.24} drag order={6}>
          <Ticket no="R★1" small />
        </Piece>
        <Piece at={{ x: 19, y: 79, w: 14, r: 4, z: 6 }} m={{ x: 52, y: 89, w: 45, r: 4, z: 6 }} depth={0.3} drag order={7}>
          <Ticket no="A★3" small />
        </Piece>
        <Piece at={{ x: 80, y: 2, w: 9, r: 12, z: 6 }} m={{ x: 80, y: 10, w: 18, r: 12, z: 6 }} depth={0.4} order={8}>
          <div className="story-stars" aria-hidden>
            <Doodle kind="star" />
            <Doodle kind="star" />
            <Doodle kind="star" />
          </div>
        </Piece>
      </Page>

      {/* 04: Miami */}
      <Page c={ch("miami")} h="104vh" mh="150svh">
        <Piece at={{ x: 56, y: 8, w: 40, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head c={ch("miami")} />
        </Piece>
        <Piece at={{ x: 5, y: 8, w: 44, r: -3, z: 2 }} m={{ x: 3, y: 17, w: 94, r: -3, z: 2 }} depth={0.1} order={1}>
          <Print id="ocean-drive" caption="Ocean Drive after dark" tape="corners" />
        </Piece>
        <Piece at={{ x: 45, y: 56, w: 18, r: 6, z: 4 }} m={{ x: 52, y: 39, w: 44, r: 6, z: 4 }} depth={0.2} drag order={2}>
          <Print id="lifeguard" frame="polaroid" caption="South Beach" tape="none" />
        </Piece>
        <Piece at={{ x: 61, y: 38, w: 30, r: 1, z: 4 }} m={{ x: 5, y: 41, w: 46, r: 1, z: 4 }} depth={0.04} order={3}>
          <Body c={ch("miami")} />
        </Piece>
        <Piece at={{ x: 14, y: 60, w: 26, r: -3, z: 5 }} m={{ x: 4, y: 62, w: 74, r: -3, z: 5 }} depth={0.14} drag order={4}>
          <Clip id="miami-1955" frame="border" caption="Miami Beach from a helicopter, 1955" tape="top" />
        </Piece>
        <Piece at={{ x: 72, y: 66, w: 15, r: -5, z: 5 }} m={{ x: 50, y: 84, w: 44, r: -5, z: 5 }} depth={0.24} drag order={5}>
          <Ticket no="MIA" small />
        </Piece>
      </Page>

      {/* 05: Española Way */}
      <Page c={ch("espanola")} h="112vh" mh="165svh">
        <Piece at={{ x: 5, y: 5, w: 42, z: 3 }} m={{ x: 4, y: 1, w: 92, z: 3 }}>
          <Head c={ch("espanola")} />
        </Piece>
        <Piece at={{ x: 48, y: 5, w: 46, r: 2, z: 2 }} m={{ x: 3, y: 14, w: 94, r: 2, z: 2 }} depth={0.1} order={1}>
          <Print id="espanola" caption="Española Way, Miami Beach" tape="corners" />
        </Piece>
        <Piece at={{ x: 6, y: 36, w: 33, r: -1, z: 4 }} m={{ x: 5, y: 38, w: 88, r: -1, z: 4 }} depth={0.04} order={2}>
          <Body c={ch("espanola")} />
        </Piece>
        <Piece at={{ x: 40, y: 54, w: 22, r: -5, z: 3 }} m={{ x: 3, y: 62, w: 52, r: -5, z: 3 }} depth={0.18} drag order={3}>
          <Print id="espanola-film" frame="polaroid" caption="the street, on film" tape="none" />
        </Piece>
        <Piece at={{ x: 63, y: 56, w: 18, r: 4, z: 4 }} m={{ x: 54, y: 64, w: 43, r: 4, z: 4 }} depth={0.22} drag order={4}>
          <Print id="bun" frame="border" caption="The Window: burgers" tape="top" />
        </Piece>
        <Piece at={{ x: 82, y: 60, w: 14, r: -6, z: 5 }} m={{ x: 3, y: 84, w: 45, r: -6, z: 5 }} depth={0.26} drag order={5}>
          <Ticket no="WIN" small />
        </Piece>
        <Piece at={{ x: 8, y: 74, w: 15, r: 5, z: 6 }} m={{ x: 51, y: 85, w: 45, r: 5, z: 6 }} depth={0.3} drag order={6}>
          <Ticket no="JOY" small />
        </Piece>
      </Page>
    </div>
  );
}

function Page({ c, h, mh, children }: { c: Chapter; h: string; mh: string; children: ReactNode }) {
  return (
    <Spread className="ch" label={`${c.when}: ${c.title}`} style={{ "--h": h, "--mh": mh } as CSSProperties}>
      <span className="ch-n display" aria-hidden>
        {c.n}
      </span>
      {children}
    </Spread>
  );
}

function Head({ c }: { c: Chapter }) {
  return (
    <div className="ch-head">
      <Label tone={c.id === "espanola" ? "red" : "black"}>{c.when}</Label>
      <h3 className="ch-title display">{c.title}</h3>
    </div>
  );
}

function Body({ c }: { c: Chapter }) {
  return (
    <Scrap tone="newsprint" className="ch-body">
      <p className="type">{c.body}</p>
      {c.quote && c.id !== "alinea" && (
        <blockquote className="ch-quote hand">
          “{c.quote}”<span className="type story-by">James Taylor</span>
        </blockquote>
      )}
    </Scrap>
  );
}
