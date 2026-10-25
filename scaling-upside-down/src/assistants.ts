// Where "Copy + open in" sends the visitor. Plain links: on phones they open the installed app.
export const ASSISTANTS = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app" },
] as const;

export type AssistantId = (typeof ASSISTANTS)[number]["id"];

const KEY = "susd:assistant";

export function remembered(): AssistantId | null {
  try {
    const v = localStorage.getItem(KEY);
    return ASSISTANTS.some((a) => a.id === v) ? (v as AssistantId) : null;
  } catch {
    return null;
  }
}

export function remember(id: AssistantId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private windows can refuse storage; the chip still works */
  }
  window.dispatchEvent(new CustomEvent("susd:assistant", { detail: id })); // every chip row follows
}
