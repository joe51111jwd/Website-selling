// Small pieces both heroes use (./Hero.tsx on desktop, ./HeroPhone.tsx on phones).

import { motion } from "motion/react";

export const HERO_EASE = [0.22, 1, 0.36, 1] as const;
const ease = HERO_EASE;

export function Words({ text, delay, play }: { text: string; delay: number; play: boolean }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="hero-word-clip">
            <motion.span
              className="hero-word"
              initial={false}
              animate={play ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
              transition={{ duration: 0.9, ease, delay: delay + i * 0.055 }}
            >
              {w}
            </motion.span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

export function Dollar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.8" />
      <path d="M14.6 9.3c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2 0 2.6 5.3 1.4 5.3 4.2 0 1.2-1.2 2-2.7 2-1.3 0-2.4-.6-2.8-1.6M12 6.4v1.4M12 16v1.6" />
    </svg>
  );
}

