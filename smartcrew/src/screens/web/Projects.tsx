import { useId } from "react";
import { WebShell, Kpi, MapPanel, Card, Segmented, money } from "../kit";
import "./Projects.css";
import { projects, projectStatuses, projectTotals, type Project } from "../data";

// W2 Projects → Board View (Gen C): revenue / expenses / profit KPI column, jobsite map,
// and the Accepted · In Progress · On Hold · Completed kanban (the last column runs off the
// right edge of the board, as in the app).

const MAP = { w: 803, h: 293.5, center: { x: 800, y: 486 }, zoom: 0.405 };

/** Same text, position and style as the kit map's own labels (kit/MapPanel.tsx). */
const TOP_LABELS = [
  { text: "Cedar Ridge", x: 725, y: 446, size: 13, weight: 600, color: "#3b3f45", italic: false },
  { text: "Millbrook", x: 1258, y: 774, size: 12, weight: 600, color: "#3b3f45", italic: false },
  { text: "Oak Grove Lake", x: 1192, y: 364, size: 10, weight: 500, color: "#2d7fa3", italic: true },
];

/** Columns list their projects oldest start date first. */
const byStart = (a: Project, b: Project) => a.startDate.localeCompare(b.startDate);

/** Google-style red location markers for every open job, drawn over the kit map in its world units. */
function ProjectMarkers() {
  const sh = `scp-mk${useId().replace(/:/g, "")}`;
  const k = 1 / MAP.zoom;
  const vw = MAP.w * k;
  const vh = MAP.h * k;
  const open = projects.filter((p) => p.status !== "Completed").sort((a, b) => a.map.y - b.map.y);
  return (
    <svg viewBox={`${MAP.center.x - vw / 2} ${MAP.center.y - vh / 2} ${vw} ${vh}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={sh} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy={k} stdDeviation={1.4 * k} floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      {open.map((p) => (
        <g key={p.id} transform={`translate(${p.map.x} ${p.map.y}) scale(${k * 0.84})`} filter={`url(#${sh})`}>
          <path d="M0 0 C -2 -6 -10 -11 -10 -19 A 10 10 0 1 1 10 -19 C 10 -11 2 -6 0 0 Z" fill="#ea4335" stroke="#b3261e" strokeWidth={0.8} />
          <circle cx={0} cy={-19} r={3.6} fill="#7a1b14" />
        </g>
      ))}
      {/* place names that sit under a marker are repeated above it so they stay readable */}
      {TOP_LABELS.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          fontSize={l.size * k}
          fontWeight={l.weight}
          fontStyle={l.italic ? "italic" : undefined}
          fill={l.color}
          textAnchor="middle"
          stroke="#fff"
          strokeWidth={3 * k}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ fontFamily: "var(--sc-font)" }}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <div className="scp-pcard">
      <div className="scp-pcard-title sc-trunc">{p.name}</div>
      <div className="scp-pcard-line sc-trunc">
        <b>Client:</b> {p.client}
      </div>
      <div className="scp-pcard-line sc-trunc">
        <b>Address:</b> {p.address}
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <WebShell active="Projects" contentClassName="scp">
      <div className="scp-top">
        <div className="scp-kpis">
          <Kpi size="lg" icon="cash" label="Total revenue" value={money(projectTotals.revenue)} className="scp-kpi" />
          <Kpi size="lg" icon="trendingUp" label="Total expenses" value={money(projectTotals.expenses)} className="scp-kpi" />
          <Kpi size="lg" icon="dollarCircle" label="Total profit" value={money(projectTotals.profit)} className="scp-kpi" />
        </div>
        <MapPanel width={MAP.w} height={MAP.h} center={MAP.center} zoom={MAP.zoom} radius={16} className="scp-map">
          <ProjectMarkers />
        </MapPanel>
      </div>

      <Card className="scp-board">
        <div className="scp-board-bar">
          <Segmented items={["List View", "Board View", "Activity Logs"]} value="Board View" className="scp-tabs" />
        </div>
        <div className="scp-cols">
          {projectStatuses.map((status) => {
            const list = projects.filter((p) => p.status === status).sort(byStart);
            return (
              <div key={status} className="scp-col">
                <div className="scp-col-head">
                  <span className="scp-col-title">{status}</span>
                  <span className="scp-col-count">{list.length}</span>
                </div>
                {list.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </WebShell>
  );
}
