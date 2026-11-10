"use client";
import { useFormStatus } from "react-dom";

export function Submit({ children, pending, className = "btn" }: { children: React.ReactNode; pending?: string; className?: string }) {
  const s = useFormStatus();
  return (
    <button className={className} disabled={s.pending} aria-busy={s.pending}>
      {s.pending ? pending ?? children : children}
    </button>
  );
}
