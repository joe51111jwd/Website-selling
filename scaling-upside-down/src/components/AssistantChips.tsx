import { useEffect, useId, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { ASSISTANTS, remember, remembered, type AssistantId } from "../assistants";
import { copyNow, peek } from "../bootloader";
import { useCopy } from "../copyStore";

const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

// "Copy + open in": each chip copies the prompt and then opens the assistant.
// They are real links. The copy runs inside the click, and the link's own navigation is the
// "then open" step, so no popup blocker gets involved and phones can hand over to the app.
export function AssistantChips({ variant, lead }: { variant: "paper" | "ink"; lead?: ReactNode }) {
  const { seq } = useCopy();
  const [mine, setMine] = useState<AssistantId | null>(remembered);
  const [armed, setArmed] = useState<AssistantId | null>(null);
  const label = useId();
  useEffect(() => {
    const on = (e: Event) => setMine((e as CustomEvent<AssistantId>).detail);
    window.addEventListener("susd:assistant", on);
    return () => window.removeEventListener("susd:assistant", on);
  }, []);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: AssistantId) => {
    if (!peek() && armed !== id) {
      // rare: the file hasn't arrived yet. Copy now; the next tap opens the assistant either way.
      e.preventDefault();
      void copyNow("chip", { assistant: id }).then(
        () => setArmed(id),
        () => setArmed(id),
      );
      return;
    }
    void copyNow("chip", { assistant: id, sync: coarse }).catch(() => {});
    remember(id);
  };

  return (
    <div className={`chips chips-${variant}${seq > 0 ? " is-after" : ""}`} role="group" aria-labelledby={label}>
      <span className="chips-l" id={label}>
        {lead ?? (seq > 0 ? "Now open" : "Copy + open in")}
      </span>
      <span className="chips-row">
        {ASSISTANTS.map((a, i) => (
          <a
            key={a.id}
            className={`chip${mine === a.id ? " is-mine" : ""}`}
            href={a.url}
            target="_blank"
            rel="noopener"
            draggable={false}
            style={{ "--i": i } as CSSProperties}
            onClick={(e) => go(e, a.id)}
          >
            {armed === a.id ? `Open ${a.name}` : a.name}
            <span aria-hidden="true"> ↗</span>
            <span className="sr-only"> (copies the prompt, opens in a new tab)</span>
          </a>
        ))}
      </span>
    </div>
  );
}
