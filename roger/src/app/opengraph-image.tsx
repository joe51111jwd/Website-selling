import { ImageResponse } from "next/og";

export const alt = "Roger: Your AI agents, smarter every Monday";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const levels = ["#5b9cdb", "#4db790", "#9a88e6", "#df7aab", "#e29a3d"];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0c0c0e", color: "#f5f5f7", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "#9A5226", display: "flex" }} />
          Roger
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 1.02 }}>
          <span>Your AI agents,</span>
          <span>smarter every Monday.</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: 27 }, (_, w) => (
            <div key={w} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[0, 1, 2].map((r) => (
                <div key={r} style={{ width: 30, height: 30, borderRadius: 7, background: levels[Math.min(4, Math.floor((w + r * 2) / 6))] }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
