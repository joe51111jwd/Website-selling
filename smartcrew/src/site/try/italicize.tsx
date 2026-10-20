import type { ReactNode } from "react";

/** The headline with Andrew's italic word (his doc: "Your Crew Will *Actually* Use It"). */
export function italicize(text: string, word: string): ReactNode[] {
  return text.split(word).flatMap((part, i) => (i === 0 ? [part] : [<em key={i}>{word}</em>, part]));
}
