// Mirrors src/data/zack.ts in Peter's repo. The four live files are version 1.9.
// The files themselves are not in this prototype; the links point at the paths the live site serves.
export const zackVersion = "1.9";

export const zackAgents = [
  { slug: "claude", name: "Claude" },
  { slug: "duet", name: "Duet" },
  { slug: "grok-bot", name: "Grok Bot" },
  { slug: "hark", name: "Hark" },
] as const;

export type ZackAgent = (typeof zackAgents)[number];

export const zackFile = (slug: string) => `/zack/zack-the-collector-${slug}.md`;

export const zackRunPrompt = "Run Zack the Collector now from the attached file and create a .md output file.";

export const zackAdaptPrompt =
  "Read the attached Zack the Collector file. It was written for Hark. Rewrite it so it works for you, keeping every rule about removing private details, then run it now and create a .md output file.";
