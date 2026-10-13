// SmartCrew logo, inline SVG so it can be animated. Generated from the brand kit
// (scratchpad design/v2/brand/final/build.py + gen_tsx.py); the static files live in /public/brand.
//
//   <Logo />                                 lockup: orange mark + ink "SmartCrew"
//   <Logo tone="white" />                    lockup for dark grounds (mark stays orange)
//   <Logo variant="mark" />                  the hard hat on the pin, orange
//   <Logo variant="mark" tone="white" />     one-colour mark (also "ink", "current")
//   <Logo variant="wordmark" tone="ink" />
//   <Logo mono tone="ink" />                 one-colour lockup (stickers, stamps, fax)
//   <Logo variant="mark" ridge={false} />    drop the ridge cut below ~24 px tall
//   <Logo variant="mark" fence />            adds the geofence outline for an animation to draw
//
// Size it with CSS height (default 1em, width follows the aspect ratio).
//
// Animation hooks (class / data-part; every part has transform-box: fill-box and a centred
// origin, so scale/rotate act on the part itself):
//   .logo-mark  > .logo-hat (dome + brim, ridge cut)  .logo-jaw (the pin's chin)  .logo-fence
//   .logo-word  > .logo-letter x9, style --i: 0..8 for staggers, data-letter="S" ...
// .logo-hat, .logo-jaw, .logo-fence and the letters carry pathLength=1, so a stroke draw is
// stroke-dasharray: 1; stroke-dashoffset: 1 -> 0. The fence starts and ends at the pin's tip.
// Pass idPrefix to also get ids: <prefix>-hat, <prefix>-jaw, <prefix>-fence, <prefix>-word.
// Colours are fill attributes, so any CSS rule (e.g. .footer .logo-mark { fill: ... }) wins.

import type { CSSProperties, SVGProps } from "react";
import "./logo.css";

export type LogoVariant = "lockup" | "mark" | "wordmark";
export type LogoTone = "ink" | "white" | "orange" | "current";

export const LOGO_COLORS = {
  orange: "#FF7A01",
  ink: "#17130F",
  white: "#FFFFFF",
  current: "currentColor",
} as const;

/** Raw geometry, for canvas / WebGL / custom SVG. Mark units: the mark is 75 x 71.18. */
export const LOGO_DATA = {
  mark: {
    viewBox: "0 0 75 71.18",
    width: 75,
    height: 71.18,
    /** dome + brim with the ridge cut (counter-wound hole) */
    hat: "M2.5 38A2.5 2.5 0 0 1 0 35.5L0 32.5A2.5 2.5 0 0 1 2.5 30L5 30A30 30 0 0 1 65 30L72.5 30A2.5 2.5 0 0 1 75 32.5L75 35.5A2.5 2.5 0 0 1 72.5 38ZM47 30L53 30A18 30 0 0 0 48.5 10.16A24 24 0 0 0 42.86 7.32A12 30 0 0 1 47 30Z",
    /** dome + brim without the ridge, for sizes under ~24 px */
    hatPlain: "M2.5 38A2.5 2.5 0 0 1 0 35.5L0 32.5A2.5 2.5 0 0 1 2.5 30L5 30A30 30 0 0 1 65 30L72.5 30A2.5 2.5 0 0 1 75 32.5L75 35.5A2.5 2.5 0 0 1 72.5 38Z",
    jaw: "M8.47 44A30 30 0 0 0 13.79 51.21L32.88 70.31A3 3 0 0 0 37.12 70.31L56.21 51.21A30 30 0 0 0 61.53 44L53.33 44A18.5 18.5 0 0 1 16.67 44Z",
    /** the pin silhouette as one stroke path from the tip, round the dome, back to the tip */
    fence: "M35 72.43L13.79 51.21A30 30 0 1 1 56.21 51.21L35 72.43",
    /** x of the pin's axis (also the mark's centre of mass) */
    axis: 35,
  },
  word: {
    viewBox: "0 -69.88 584.52 71.08",
    /** baseline at y = 0; cap height 68.68 */
    letters: [
    ["S", "M33.97 1.2Q26.99 1.2 20.82 0.11Q14.65 -0.99 9.98 -3.54Q5.3 -6.09 2.65 -10.34Q0 -14.59 0 -20.88Q0 -21.25 0.02 -21.68Q0.04 -22.11 0.1 -22.4H15.94Q15.88 -22.08 15.84 -21.57Q15.81 -21.06 15.81 -20.57Q15.81 -17.41 17.96 -15.38Q20.11 -13.34 24.12 -12.37Q28.13 -11.41 33.49 -11.41Q36.26 -11.41 38.77 -11.67Q41.28 -11.94 43.4 -12.49Q45.51 -13.04 47.08 -13.91Q48.66 -14.79 49.52 -16.01Q50.38 -17.23 50.38 -18.8Q50.38 -21.36 48.34 -22.94Q46.3 -24.52 42.82 -25.58Q39.35 -26.63 35 -27.45Q30.65 -28.27 26.02 -29.23Q21.39 -30.19 17.04 -31.68Q12.7 -33.18 9.22 -35.47Q5.75 -37.75 3.71 -41.29Q1.67 -44.84 1.67 -49.89Q1.67 -54.95 3.98 -58.72Q6.28 -62.49 10.56 -64.97Q14.83 -67.45 20.68 -68.66Q26.53 -69.88 33.61 -69.88Q40.59 -69.88 46.3 -68.63Q52.01 -67.37 56.12 -64.84Q60.22 -62.31 62.43 -58.54Q64.64 -54.77 64.65 -49.74V-48.39H49.01V-49.37Q49.01 -51.79 47.16 -53.58Q45.31 -55.38 41.96 -56.41Q38.62 -57.45 34.1 -57.45Q28.73 -57.45 25.17 -56.63Q21.61 -55.82 19.86 -54.34Q18.1 -52.86 18.1 -50.9Q18.1 -48.62 20.14 -47.16Q22.18 -45.7 25.66 -44.75Q29.13 -43.79 33.48 -42.99Q37.83 -42.19 42.46 -41.21Q47.09 -40.23 51.44 -38.79Q55.78 -37.36 59.26 -35.06Q62.73 -32.75 64.77 -29.32Q66.81 -25.88 66.81 -20.95Q66.81 -12.96 62.6 -8.08Q58.38 -3.19 50.97 -0.99Q43.56 1.2 33.97 1.2Z"],
    ["m", "M75.23 0V-52.68H87.3L88.38 -44.66H89.18Q91.41 -47.81 94.34 -49.84Q97.27 -51.88 100.75 -52.88Q104.23 -53.88 107.87 -53.88Q113.99 -53.88 118.27 -51.66Q122.55 -49.44 124.68 -44.66H125.48Q127.75 -47.81 130.73 -49.84Q133.72 -51.88 137.25 -52.88Q140.79 -53.88 144.49 -53.88Q150.53 -53.88 154.76 -51.79Q158.99 -49.71 161.23 -45.32Q163.47 -40.94 163.47 -34.06V0H148.74V-31.59Q148.74 -34.37 148.05 -36.36Q147.37 -38.34 146.11 -39.54Q144.86 -40.74 143.05 -41.31Q141.24 -41.88 139.04 -41.88Q135.67 -41.88 132.87 -40.27Q130.07 -38.66 128.39 -35.85Q126.72 -33.03 126.72 -29.3V0H112.02V-31.59Q112.02 -34.37 111.34 -36.36Q110.65 -38.34 109.4 -39.54Q108.15 -40.74 106.34 -41.31Q104.52 -41.88 102.29 -41.88Q98.92 -41.88 96.1 -40.27Q93.29 -38.66 91.63 -35.85Q89.97 -33.03 89.97 -29.3V0Z"],
    ["a", "M191.26 1.2Q187.6 1.2 184.08 0.54Q180.55 -0.13 177.71 -1.78Q174.86 -3.42 173.19 -6.39Q171.52 -9.36 171.52 -13.97Q171.52 -19.89 174.44 -23.49Q177.35 -27.09 182.71 -28.93Q188.06 -30.77 195.39 -31.41Q202.72 -32.04 211.48 -32.04V-35.03Q211.48 -37.77 210.31 -39.58Q209.15 -41.39 206.64 -42.29Q204.13 -43.19 199.91 -43.19Q196.3 -43.19 193.69 -42.52Q191.09 -41.85 189.72 -40.66Q188.35 -39.46 188.35 -37.82V-36.71H173.77Q173.67 -37.15 173.65 -37.56Q173.63 -37.98 173.63 -38.54Q173.63 -43.18 176.78 -46.63Q179.92 -50.09 185.9 -51.99Q191.88 -53.88 200.41 -53.88Q208.75 -53.88 214.5 -52.07Q220.24 -50.25 223.23 -46.46Q226.22 -42.67 226.22 -36.63V-13.62Q226.22 -11.79 227.12 -10.84Q228.03 -9.89 229.62 -9.89H233.82V-0.52Q232.71 -0.06 230.27 0.55Q227.83 1.16 224.67 1.16Q220.95 1.16 218.5 0.21Q216.05 -0.74 214.69 -2.44Q213.33 -4.14 212.77 -6.32H212.06Q209.78 -4.06 206.68 -2.34Q203.58 -0.62 199.72 0.29Q195.87 1.2 191.26 1.2ZM195.66 -9.61Q198.45 -9.61 201.25 -10.33Q204.04 -11.06 206.36 -12.42Q208.67 -13.78 210.08 -15.8Q211.48 -17.81 211.48 -20.36V-23.2Q203.46 -23.2 197.83 -22.44Q192.19 -21.69 189.27 -19.91Q186.35 -18.13 186.35 -15.03Q186.35 -13.04 187.59 -11.86Q188.84 -10.67 190.97 -10.14Q193.1 -9.61 195.66 -9.61Z"],
    ["r", "M239.53 0V-52.68H251.6L252.68 -44.01H253.44Q254.61 -46.78 256.5 -49.03Q258.39 -51.27 261.14 -52.59Q261.24 -52.63 261.34 -52.68H276.32V-40.08H273.42V-40.04H267.52Q264.07 -40.04 261.57 -39Q259.06 -37.95 257.45 -35.99Q255.83 -34.04 255.05 -31.4Q254.27 -28.77 254.27 -25.6V0Z"],
    ["t", "M297.41 1.2Q291.87 1.2 288.37 -0.48Q284.87 -2.16 283.23 -5.55Q281.59 -8.93 281.59 -13.98V-40.08H273.32V-41.59H273.3V-52.68H282.04L284.94 -67.93H296.32V-52.68H308.24V-41.59H308.22V-40.08H296.32V-16.12Q296.32 -13.08 297.59 -11.49Q298.86 -9.89 302.45 -9.89H308.24V-0.49Q306.98 -0.03 305.04 0.36Q303.09 0.75 301.05 0.97Q299.02 1.2 297.41 1.2Z"],
    ["C", "M354.86 1.2Q342.49 1.2 334 -2.7Q325.52 -6.6 321.18 -14.51Q316.84 -22.41 316.84 -34.36Q316.84 -51.89 326.68 -60.88Q336.52 -69.88 354.84 -69.88Q365.04 -69.88 372.94 -66.69Q380.85 -63.5 385.36 -57.35Q389.87 -51.2 389.87 -42.24H373.97Q373.97 -46.98 371.55 -50.26Q369.13 -53.55 364.82 -55.27Q360.52 -56.98 354.76 -56.98Q347.79 -56.98 343 -54.48Q338.22 -51.98 335.79 -47.25Q333.36 -42.51 333.36 -35.79V-32.97Q333.36 -26.2 335.8 -21.44Q338.23 -16.68 342.99 -14.19Q347.75 -11.7 354.72 -11.7Q360.82 -11.7 365.24 -13.36Q369.65 -15.01 372.06 -18.28Q374.47 -21.55 374.47 -26.24H389.9Q389.9 -17.41 385.49 -11.27Q381.07 -5.14 373.19 -1.97Q365.31 1.2 354.86 1.2Z"],
    ["r", "M397.83 0V-52.68H409.9L410.98 -44.01H411.74Q412.91 -46.78 414.8 -49.03Q416.69 -51.27 419.44 -52.59Q422.19 -53.9 425.7 -53.9Q427.48 -53.9 429.06 -53.61Q430.64 -53.32 431.72 -52.89V-40.04H425.82Q422.37 -40.04 419.87 -39Q417.36 -37.95 415.75 -35.99Q414.13 -34.04 413.35 -31.4Q412.57 -28.77 412.57 -25.6V0Z"],
    ["e", "M464.13 1.2Q454.62 1.2 447.91 -1.74Q441.19 -4.69 437.63 -10.79Q434.07 -16.9 434.07 -26.32Q434.07 -35.67 437.58 -41.77Q441.09 -47.87 447.73 -50.88Q454.37 -53.88 463.7 -53.88Q473 -53.88 479.4 -50.94Q485.8 -48 489.08 -42.07Q492.35 -36.15 492.35 -27.09V-23.04H449.29Q449.51 -18.41 451.21 -15.39Q452.92 -12.36 456.2 -10.92Q459.49 -9.49 464.29 -9.49Q466.67 -9.49 468.98 -10.05Q471.28 -10.61 473.14 -11.72Q475.01 -12.84 476.17 -14.52Q477.33 -16.21 477.44 -18.46H492.19Q492.19 -13.87 490.21 -10.21Q488.22 -6.55 484.52 -4.01Q480.81 -1.48 475.64 -0.14Q470.47 1.2 464.13 1.2ZM449.39 -32.13H476.92Q476.92 -34.97 475.96 -37.04Q474.99 -39.11 473.25 -40.48Q471.51 -41.85 469.15 -42.5Q466.79 -43.15 463.97 -43.15Q459.63 -43.15 456.51 -41.91Q453.39 -40.67 451.63 -38.21Q449.88 -35.74 449.39 -32.13Z"],
    ["w", "M514.07 0 494.93 -52.68H510.57L518.44 -27.14Q519.13 -25.08 519.69 -22.89Q520.25 -20.7 520.72 -18.92Q521.19 -17.14 521.41 -16.19H522.13Q522.52 -17.73 523.02 -19.69Q523.51 -21.65 524.07 -23.65Q524.63 -25.65 525.08 -27.22L532.37 -52.68H548.28L555.65 -27.17Q556.01 -26.04 556.51 -24.07Q557 -22.09 557.56 -19.99Q558.12 -17.88 558.52 -16.19H559.23Q559.6 -17.69 560.12 -19.66Q560.64 -21.63 561.21 -23.61Q561.78 -25.58 562.16 -27.04L569.99 -52.68H584.52L565.37 0H550.49L543.58 -23.77Q543 -25.79 542.33 -28.15Q541.66 -30.51 541.09 -32.71Q540.51 -34.92 540.13 -36.42H539.49Q539.24 -35.26 538.71 -33.26Q538.17 -31.26 537.52 -28.8Q536.87 -26.34 536.11 -23.72L529.17 0Z"],
    ] as ReadonlyArray<readonly [string, string]>,
  },
  lockup: {
    viewBox: "0 -87.48 733.34 111.26",
    /** mark placement inside the lockup: translate(0, markY) scale(markScale) */
    markScale: 1.56304,
    markY: -87.484,
    /** word placement: translate(wordX, 0) */
    wordX: 148.822,
  },
} as const;

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, "children" | "viewBox" | "fill"> {
  variant?: LogoVariant;
  /** Wordmark colour for lockup/wordmark, mark colour for mark. Default: ink (orange for mark). */
  tone?: LogoTone;
  /** Lockup only: paint the mark in the tone too (default: the mark stays orange). */
  mono?: boolean;
  /** Keep the ridge cut in the dome (default true; turn off below ~24 px tall). */
  ridge?: boolean;
  /** Render the geofence outline (.logo-fence) for an animation to draw. */
  fence?: boolean;
  /** Accessible name. Default "SmartCrew". */
  title?: string;
  /** Hide from assistive tech (e.g. when a parent link already has a label). */
  decorative?: boolean;
  idPrefix?: string;
}

const part = (name: string, prefix?: string) =>
  prefix ? { id: `${prefix}-${name}`, "data-part": name } : { "data-part": name };

function Mark({
  fill,
  ridge,
  fence,
  idPrefix,
}: {
  fill: string;
  ridge: boolean;
  fence: boolean;
  idPrefix?: string;
}) {
  const m = LOGO_DATA.mark;
  return (
    <g className="logo-mark" fill={fill} {...part("mark", idPrefix)}>
      <path className="logo-part logo-hat" d={ridge ? m.hat : m.hatPlain} pathLength={1} {...part("hat", idPrefix)} />
      <path className="logo-part logo-jaw" d={m.jaw} pathLength={1} {...part("jaw", idPrefix)} />
      {fence && (
        <path
          className="logo-part logo-fence"
          d={m.fence}
          pathLength={1}
          fill="none"
          stroke={fill}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...part("fence", idPrefix)}
        />
      )}
    </g>
  );
}

function Word({ fill, idPrefix }: { fill: string; idPrefix?: string }) {
  return (
    <g className="logo-word" fill={fill} {...part("word", idPrefix)}>
      {LOGO_DATA.word.letters.map(([ch, d], i) => (
        <path
          key={i}
          className="logo-part logo-letter"
          data-letter={ch}
          d={d}
          pathLength={1}
          style={{ "--i": i } as CSSProperties}
        />
      ))}
    </g>
  );
}

export function Logo({
  variant = "lockup",
  tone,
  mono = false,
  ridge = true,
  fence = false,
  title = "SmartCrew",
  decorative = false,
  idPrefix,
  className,
  style,
  ...rest
}: LogoProps) {
  const t: LogoTone = tone ?? (variant === "mark" ? "orange" : "ink");
  const toneFill = LOGO_COLORS[t];
  const markFill = variant === "mark" || mono ? toneFill : LOGO_COLORS.orange;
  const vbox =
    variant === "mark" ? LOGO_DATA.mark.viewBox : variant === "wordmark" ? LOGO_DATA.word.viewBox : LOGO_DATA.lockup.viewBox;
  const [, , w, h] = vbox.split(" ").map(Number);
  const a11y = decorative
    ? { "aria-hidden": true as const, focusable: "false" as const }
    : { role: "img", "aria-label": title };
  const L = LOGO_DATA.lockup;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={vbox}
      className={["logo", `logo--${variant}`, `logo--${t}`, className].filter(Boolean).join(" ")}
      style={{ aspectRatio: `${w} / ${h}`, ...style }}
      data-variant={variant}
      data-tone={t}
      {...a11y}
      {...rest}
    >
      {variant === "mark" && <Mark fill={markFill} ridge={ridge} fence={fence} idPrefix={idPrefix} />}
      {variant === "wordmark" && <Word fill={toneFill} idPrefix={idPrefix} />}
      {variant === "lockup" && (
        <>
          <g transform={`translate(0 ${L.markY}) scale(${L.markScale})`}>
            <Mark fill={markFill} ridge={ridge} fence={fence} idPrefix={idPrefix} />
          </g>
          <g transform={`translate(${L.wordX} 0)`}>
            <Word fill={toneFill} idPrefix={idPrefix} />
          </g>
        </>
      )}
    </svg>
  );
}

export default Logo;
