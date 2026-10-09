import { useRef, type ElementType, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import { emphasis } from "../content/site";
import { usePageReady } from "../lib/transition";
import { ease } from "../lib/ticker";

type RevealProps = {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Start without waiting to scroll into view. */
  immediate?: boolean;
};

/**
 * Words slide up out of their own masks, one after another, the first time
 * the line scrolls into view. Words in *stars* are set in the italic serif.
 */
export function Reveal({ text, as: Tag = "p", className, delay = 0, stagger = 0.035, immediate }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const ready = usePageReady();
  const go = ready && (immediate || seen);
  let i = 0;
  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text.replace(/\*/g, "")}</span>
      {emphasis(text).map((run, r) =>
        run.text.split(/(\s+)/).map((word, w) => {
          if (!word.trim()) return " ";
          const n = i++;
          return (
            <span className="mask" key={`${r}-${w}`} aria-hidden>
              <motion.span
                className={run.em ? "em" : undefined}
                initial={{ y: "110%" }}
                animate={go ? { y: "0%" } : undefined}
                transition={{ duration: 1, ease, delay: delay + n * stagger }}
              >
                {word}
              </motion.span>
            </span>
          );
        }),
      )}
    </Tag>
  );
}

/** Letters rise one by one. Used for big names. Words never break apart. */
export function Chars({
  text,
  className,
  delay = 0,
  stagger = 0.04,
  play,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  play: boolean;
}) {
  let i = 0;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, w) => (
        <span className="chars-word" key={w} aria-hidden>
          {w > 0 && <span className="chars-space"> </span>}
          {[...word].map((ch) => {
            const n = i++;
            return (
              <span className="mask" key={n}>
                <motion.span
                  initial={{ y: "105%" }}
                  animate={play ? { y: "0%" } : undefined}
                  transition={{ duration: 1.1, ease, delay: delay + n * stagger }}
                >
                  {ch}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/** Renders "*word*" markup without animation. */
export function Em({ text }: { text: string }) {
  return (
    <>
      {emphasis(text).map((run, i) =>
        run.em ? (
          <span className="em" key={i}>
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </>
  );
}

/** A mono label like "(02) Selected work". */
export function Label({ index, children, className }: { index?: string; children: ReactNode; className?: string }) {
  return (
    <p className={`label${className ? ` ${className}` : ""}`}>
      {index && <span className="label-index">({index})</span>}
      {children}
    </p>
  );
}

/** A label whose text slides up to a copy of itself on hover. */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll" data-text={children}>
      <span>{children}</span>
    </span>
  );
}
