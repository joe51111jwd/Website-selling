// The bootloader is a Markdown file served from /bootloader.md, so Michael can
// replace it without touching the site. Every copy button copies the whole file.

let text: string | null = null;
let loading: Promise<string> | null = null;

export function loadBootloader(): Promise<string> {
  if (text !== null) return Promise.resolve(text);
  if (!loading) {
    loading = fetch(`${import.meta.env.BASE_URL}bootloader.md`)
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
    const area = document.createElement("textarea");
    area.value = t;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy refused");
  }
  return wordCount(t);
}
