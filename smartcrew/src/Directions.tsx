// The index of design directions, shown by the `directions` build (npm run build:directions).

const ABOUT: Record<string, { title: string; line: string }> = {
  template: { title: "A · Andrew's template, done properly", line: "The look Andrew picked, cleaned up. Features as one list that drives the product screen." },
  founder: { title: "B · The plain-spoken founder page", line: "Andrew talking to a fellow contractor. Every feature in one paragraph you can tap." },
  product: { title: "C · Field to office", line: "What the crew does on the phone, and what shows up in the office, moment by moment." },
};

export default function Directions({ names }: { names: string[] }) {
  return (
    <main style={{ minHeight: "100svh", background: "#FCFAF8", color: "#1D1A16", font: "16px/1.5 system-ui, sans-serif", padding: "64px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p style={{ color: "#7A6B5D", margin: 0 }}>SmartCrew product page · design directions</p>
        <h1 style={{ fontSize: 32, lineHeight: 1.15, margin: "8px 0 32px", letterSpacing: "-0.02em" }}>Three ways to turn ad clicks into booked calls</h1>
        {names.map((n) => (
          <a key={n} href={`?proto=${n}`} style={{ display: "block", padding: "20px 0", borderTop: "1px solid #EEE5DD", color: "inherit", textDecoration: "none" }}>
            <strong style={{ fontSize: 18 }}>{ABOUT[n]?.title ?? n}</strong>
            <span style={{ display: "block", color: "#67594C" }}>{ABOUT[n]?.line}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
