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
    const { words: w, part } = getCopy();
    const t = say(part === "prompt" ? "Starting prompt copied. Paste it after you upload the file." : `The Bootloader copied${w ? `, ${w.toLocaleString()} words` : ""}.`);
    return () => window.clearTimeout(t);
  }, [seq]);
  useEffect(() => {
    if (!errors) return;
    const t = say("Couldn't copy. Try again, or open the Appendix for the starting prompt."); // the page never shows the prompt itself
    return () => window.clearTimeout(t);
  }, [errors]);
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {msg}
    </div>
  );
}
