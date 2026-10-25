import { useEffect, useState } from "react";
import { getCopy, useCopy } from "../copyStore";

// The page's live region: every copy, from any button, is announced once, and a repeat copy is
// announced again (the region is cleared first so screen readers notice the same words). The use
// notice has its own copy of it, because an open modal hides the rest of the page from them.
export function Announcer() {
  const { seq, errors } = useCopy();
  const [msg, setMsg] = useState("");
  const say = (text: string) => {
    setMsg("");
    return window.setTimeout(() => {
      setMsg(text);
      window.setTimeout(() => setMsg((m) => (m === text ? "" : m)), 5000); // no stale words for the next reader
    }, 50);
  };
  useEffect(() => {
    if (!seq) return;
    const w = getCopy().words;
    const t = say(`Prompt copied${w ? `, ${w.toLocaleString()} words` : ""}. Paste it into your AI assistant.`);
    return () => window.clearTimeout(t);
  }, [seq]);
  useEffect(() => {
    if (!errors) return;
    const t = say("Couldn't copy. Download the file instead.");
    return () => window.clearTimeout(t);
  }, [errors]);
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {msg}
    </div>
  );
}
