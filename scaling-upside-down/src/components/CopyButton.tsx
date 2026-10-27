import { useEffect, useRef, useState, type ButtonHTMLAttributes, type Ref } from "react";
import { copyNow } from "../bootloader";
import { useCopy, type CopyPart, type CopySource } from "../copyStore";

type Phase = "idle" | "copying" | "done" | "error";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> & {
  source: CopySource;
  /** what is copied: the file's starting prompt (default), or the whole file */
  part?: CopyPart;
  label?: string;
  size?: "sm" | "md" | "lg";
  /** after any copy this visit the idle label reads "Copy again" (the big buttons) */
  again?: boolean;
  /** how long "Copied" stays up */
  flashMs?: number;
  /** replaces the plain copy (the desk runs its own); must call copyNow() synchronously */
  run?: () => Promise<number>;
  ref?: Ref<HTMLButtonElement>;
};

export function CopyButton({ source, part = "prompt", label = "Copy the starting prompt", size = "md", again = size === "lg", flashMs = 2600, run, className = "", ref, ...rest }: Props) {
  const { seq, words, part: lastPart } = useCopy();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);
  const seen = useRef(seq);
  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);

  // any successful copy of the same thing, from any button, flashes "Copied" here too
  useEffect(() => {
    if (seq === seen.current) return;
    seen.current = seq;
    if (lastPart !== part) return;
    clear();
    setPhase("done");
    later(flashMs, () => setPhase("idle"));
  }, [seq, flashMs, lastPart, part]);

  const onClick = () => {
    const p = run ? run() : copyNow(source, { part }); // first, inside the click
    clear();
    later(300, () => setPhase((s) => (s === "idle" || s === "error" ? "copying" : s)));
    p.catch(() => {
      clear();
      setPhase("error");
      later(4000, () => setPhase((s) => (s === "error" ? "idle" : s)));
    });
  };

  const text =
    phase === "done"
      ? `Copied${part === "file" && words ? ` · ${words.toLocaleString()} words` : ""}`
      : phase === "copying"
        ? "Copying…"
        : phase === "error"
          ? "Couldn't copy. Try again."
          : again && seq > 0
            ? "Copy again"
            : label;

  return (
    <button ref={ref} type="button" className={`copy copy-${size} is-${phase} ${className}`} onClick={onClick} {...rest}>
      <span className="copy-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          {phase === "done" ? (
            <path d="M3 8.6l3.1 3L13 4.6" />
          ) : (
            <>
              <rect x="5.2" y="5.2" width="8.3" height="8.3" rx="1.2" />
              <path d="M10.6 2.5H3.7c-.66 0-1.2.54-1.2 1.2v6.9" />
            </>
          )}
        </svg>
      </span>
      <span className="copy-label">{text}</span>
    </button>
  );
}
