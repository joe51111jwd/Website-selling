// Andrew's new logo (his file "Orange + White 19.png", Oct 20): the hard-hat pin and SMART CREW inside the
// orange track. He wasn't sure about the track yet, so ?logo=plain shows the same logo without it.
// The white copy is for dark grounds (footer, the Replace hub, the header over Watch it work).
import tracksInk from "./assets/smartcrew-logo.webp";
import tracksWhite from "./assets/smartcrew-logo-white.webp";
import plainInk from "./assets/smartcrew-logo-plain.webp";
import plainWhite from "./assets/smartcrew-logo-plain-white.webp";

const PLAIN = typeof location !== "undefined" && new URLSearchParams(location.search).get("logo") === "plain";

export function BrandLogo({ className, tone = "ink", alt = "" }: { className?: string; tone?: "ink" | "white"; alt?: string }) {
  const src = PLAIN ? (tone === "white" ? plainWhite : plainInk) : tone === "white" ? tracksWhite : tracksInk;
  return (
    <img
      className={`brand-logo${PLAIN ? " is-plain" : ""}${className ? ` ${className}` : ""}`}
      src={src}
      alt={alt}
      width={PLAIN ? 931 : 601}
      height={110}
      decoding="async"
      draggable={false}
    />
  );
}
