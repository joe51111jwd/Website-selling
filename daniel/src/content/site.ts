/**
 * Everything about Daniel lives here. All of it is placeholder copy until the
 * real copy arrives; swap the strings and the whole site follows.
 */
export const site = {
  name: "Daniel",
  role: "Designer & Developer",
  /** Shown under the giant name in the hero. Words wrapped in *stars* are set in the italic serif. */
  intro: "I design and build websites that feel *effortless* on the surface, and are engineered all the way down.",
  location: "New York, NY",
  timeZone: "America/New_York",
  email: "hello@example.com",
  availability: "Booking projects for early 2027",
  socials: [
    { label: "Instagram", url: "" },
    { label: "LinkedIn", url: "" },
    { label: "GitHub", url: "" },
    { label: "Read.cv", url: "" },
  ],
  about: {
    statement:
      "Every site has two layers. The *surface* is what people feel: the type, the motion, the pace. The *structure* is what makes it hold: clean code, fast pages, nothing wasted. I care about both, equally, and I build them together.",
    paragraphs: [
      "I work with founders, studios and small teams who want a site that does more than exist. Most projects run from first sketch to launch with me, so nothing gets lost between design and code.",
      "When I'm not building, I'm taking other people's websites apart to see how they work.",
    ],
  },
  capabilities: [
    { title: "Design", items: ["Art direction", "Web & interface design", "Design systems", "Prototyping"] },
    { title: "Development", items: ["React & Next.js", "Headless CMS", "Performance", "Accessibility"] },
    { title: "Motion", items: ["Interaction design", "Scroll choreography", "Page transitions", "Micro-interactions"] },
    { title: "3D & WebGL", items: ["three.js", "Custom shaders", "Real-time scenes", "Creative coding"] },
  ],
  process: [
    { title: "Discover", body: "We pin down who the site is for and the one thing it has to do." },
    { title: "Design", body: "Art direction first, then every page and state, in motion." },
    { title: "Build", body: "Hand-written code, tuned until it holds 60fps on a mid-range phone." },
    { title: "Launch", body: "Shipped, measured, and handed over with a CMS your team can run." },
  ],
  marquee: ["Design", "Development", "Motion", "WebGL", "Art direction", "Front-end"],
};

/** Splits "*word*" markup into plain and italic runs. */
export function emphasis(text: string): { text: string; em: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith("*") ? { text: part.slice(1, -1), em: true } : { text: part, em: false }));
}
