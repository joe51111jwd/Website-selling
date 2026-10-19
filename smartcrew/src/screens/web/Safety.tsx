import { WebShell, Icon, Avatar, Select, type IconName, dateShort } from "../kit";
import { safetyItems, projectById, crewById, TODAY, type SafetyItem, type SafetyKind } from "../data";
import "./Safety.css";

// W15 Safety: the JSAs the foremen fill in before work, the toolbox talks and who signed them,
// and incident reports, in one list with the totals over it. Drawn in the Gen C manner of the
// equipment and materials pages (no capture of this page).

const KIND: Record<SafetyKind, { icon: IconName; tone: string }> = {
  JSA: { icon: "clipboardCheck", tone: "jsa" },
  "Toolbox Talk": { icon: "megaphone", tone: "talk" },
  Incident: { icon: "alert", tone: "inc" },
};

const daysAgo = (iso: string) => (Date.parse(TODAY.iso) - Date.parse(iso)) / 864e5;
const recent = (k: SafetyKind) => safetyItems.filter((s) => s.kind === k && daysAgo(s.date) <= 30);
const incidents = recent("Incident");
const talks = recent("Toolbox Talk");
const talkSigned = talks.reduce((a, s) => [a[0] + s.signed![0], a[1] + s.signed![1]], [0, 0]);
const KPIS: { icon: IconName; label: string; value: number; sub: string }[] = [
  { icon: "clipboardCheck", label: "JSAs this week", value: safetyItems.filter((s) => s.kind === "JSA" && s.date >= TODAY.weekStart).length, sub: TODAY.weekLabel },
  { icon: "megaphone", label: "Toolbox talks, 30 days", value: talks.length, sub: `${talkSigned[0]} of ${talkSigned[1]} signed` },
  { icon: "alert", label: "Incidents, 30 days", value: incidents.length, sub: incidents.map((s) => `1 ${s.severity!.toLowerCase()}`).join(" · ") },
  { icon: "clock", label: "Open", value: safetyItems.filter((s) => s.status === "Open").length, sub: "Waiting on a signature" },
];

const COLS = ["Type", "Title", "Submitted by", "Date", "Sign-offs", "Status"];

function Row({ s }: { s: SafetyItem }) {
  const k = KIND[s.kind];
  const who = crewById(s.byId);
  return (
    <div className="scsf-tr">
      <div>
        <span className={`scsf-kind scsf-kind--${k.tone}`}>
          <Icon name={k.icon} size={14} stroke={1.8} />
          {s.kind}
        </span>
      </div>
      <div className="scsf-what">
        <span className="sc-trunc">{s.title}</span>
        <span className="scsf-job sc-trunc">{s.projectId ? projectById(s.projectId).name : "All crews"}</span>
      </div>
      <div className="scsf-who">
        <Avatar name={who.name} single size={23.5} style={{ fontSize: 11.5 }} />
        <span className="sc-trunc">{who.name}</span>
      </div>
      <div>
        <span className="scsf-date">
          {dateShort(s.date)}, {s.time}
        </span>
      </div>
      <div>
        {s.signed ? (
          <span className={`scsf-sign${s.signed[0] < s.signed[1] ? " is-short" : ""}`}>
            <Icon name="users" size={14} stroke={1.7} />
            {s.signed[0]}/{s.signed[1]}
          </span>
        ) : (
          <span className="scsf-sev">{s.severity}</span>
        )}
      </div>
      <div>
        <span className={`scsf-st scsf-st--${s.status}`}>
          <i />
          {s.status}
        </span>
      </div>
    </div>
  );
}

export default function Safety() {
  return (
    <WebShell active="Reports" contentClassName="scsf">
      <div className="scsf-head">
        <h1 className="scsf-title">Safety</h1>
        <Select value="All Projects" width={170} />
        <span className="scsf-add">
          <Icon name="plus" size={15} stroke={2} />
          New JSA
        </span>
      </div>

      <div className="scsf-kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="scsf-kpi">
            <span className="scsf-kpi-ic">
              <Icon name={k.icon} size={18} stroke={1.7} />
            </span>
            <div className="scsf-kpi-body">
              <span className="scsf-kpi-label">{k.label}</span>
              <span className="scsf-kpi-value">{k.value}</span>
              <span className="scsf-kpi-sub">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="scsf-card">
        <div className="scsf-toolbar">
          <div className="scsf-tabs">
            {["All", "JSAs", "Toolbox Talks", "Incidents", "Inspections"].map((t) => (
              <span key={t} className={t === "All" ? "is-active" : undefined}>
                {t}
              </span>
            ))}
          </div>
          <div className="scsf-search">
            <Icon name="search" size={18} stroke={1.7} />
            <span>Search</span>
          </div>
          <span className="scsf-btn">
            <Icon name="filter" size={16} stroke={1.6} />
            Filters
          </span>
        </div>
        <div className="scsf-tr scsf-tr--head">
          {COLS.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>
        {safetyItems.map((s) => (
          <Row key={s.id} s={s} />
        ))}
      </div>
    </WebShell>
  );
}
