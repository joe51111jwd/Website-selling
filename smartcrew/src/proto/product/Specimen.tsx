import "@fontsource-variable/host-grotesk";
import "@fontsource-variable/funnel-display";
import "@fontsource-variable/funnel-sans";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/familjen-grotesk";

// Dev-only type specimen (?proto=product&specimen=1) used to pick the display/text pair.
const FACES = [
  ["Host Grotesk Variable", "Host Grotesk Variable"],
  ["Funnel Display Variable", "Funnel Sans Variable"],
  ["Hanken Grotesk Variable", "Hanken Grotesk Variable"],
  ["Instrument Sans Variable", "Instrument Sans Variable"],
  ["Familjen Grotesk Variable", "Hanken Grotesk Variable"],
];

export default function Specimen() {
  return (
    <div style={{ background: "#FCFAF8", color: "#1D1A16", padding: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      {FACES.map(([d, t]) => (
        <div key={d} style={{ borderTop: "1px solid #D8CCC0", paddingTop: 12 }}>
          <div style={{ font: `500 12px/1 ${t}`, color: "#7A6957", marginBottom: 10 }}>{d} / {t}</div>
          <div style={{ fontFamily: d, fontWeight: 620, fontSize: 52, lineHeight: 1, letterSpacing: "-0.035em" }}>
            See what every job is making, every day.
          </div>
          <div style={{ fontFamily: d, fontWeight: 600, fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.025em", marginTop: 14 }}>
            Driver logs a load. The job cost moves.
          </div>
          <p style={{ fontFamily: t, fontSize: 17, lineHeight: 1.5, color: "#67594C", maxWidth: 560, marginTop: 12 }}>
            GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it. $29,167 a year · 5–100 employees · 7:02 am
          </p>
        </div>
      ))}
    </div>
  );
}
