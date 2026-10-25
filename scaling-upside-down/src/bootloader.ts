// The bootloader is a Markdown file served from /bootloader.md, so Michael can
// replace it without touching the site. Every copy button copies the whole file.

let text: string | null = null;
let loading: Promise<string> | null = null;

export function loadBootloader(): Promise<string> {
  if (text !== null) return Promise.resolve(text);
  if (!loading) {
    // low priority: the first frames matter more while the page is loading
    loading = fetch(`${import.meta.env.BASE_URL}bootloader.md`, { priority: "low" } as RequestInit)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => (text = t))
      .catch(() => {
        loading = null;
        return "";
      });
  }
  return loading;
}

export const wordCount = (t: string) => (t.match(/\S+/g) ?? []).length;

export async function copyBootloader(): Promise<number> {
  const t = await loadBootloader();
  if (!t) throw new Error("bootloader unavailable");
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    // older app views refuse the async clipboard; fall back to a selection copy
    const prev = document.activeElement as HTMLElement | null;
    const area = document.createElement("textarea");
    area.value = t;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, t.length);
    const ok = document.execCommand("copy");
    area.remove();
    prev?.focus({ preventScroll: true });
    if (!ok) throw new Error("copy refused");
  }
  return wordCount(t);
}
