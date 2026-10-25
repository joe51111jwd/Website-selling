import { useEffect, useRef, useState } from "react";
import { copyBootloader } from "../bootloader";

type State = "idle" | "done" | "error";

export function CopyButton({ className = "", label = "Copy the prompt", copied, size = "md" }: { className?: string; label?: string; copied?: string; size?: "sm" | "md" | "lg" }) {
  const [state, setState] = useState<State>("idle");
  const [words, setWords] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    try {
      setWords(await copyBootloader());
      setState("done");
    } catch {
      setState("error");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2600);
  };

  return (
    <>
      <button type="button" className={`copy copy-${size} is-${state} ${className}`} onClick={onClick}>
        <span className="copy-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            {state === "done" ? (
              <path d="M3 8.6l3.1 3L13 4.6" />
            ) : (
              <>
                <rect x="5.2" y="5.2" width="8.3" height="8.3" rx="1.2" />
                <path d="M10.6 2.5H3.7c-.66 0-1.2.54-1.2 1.2v6.9" />
              </>
            )}
          </svg>
        </span>
        <span className="copy-label">
          {state === "done" ? (copied ?? `Copied${words ? ` · ${words.toLocaleString()} words` : ""}`) : state === "error" ? "Couldn't copy. Try again." : label}
        </span>
      </button>
      <span className="sr-only" role="status">
        {state === "done" ? "Prompt copied. Paste it into your AI assistant." : state === "error" ? "Couldn't copy the prompt. Try again, or download the file." : ""}
      </span>
    </>
  );
}
