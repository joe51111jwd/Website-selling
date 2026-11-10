// Classic windows: a dithered title bar, _ □ ×, dragged by the title, raised on touch. One per id.

import { raise } from "./z";

const open = new Map<string, HTMLElement>();

export type WinOpts = {
  id: string;
  title: string;
  body: HTMLElement;
  x?: number;
  y?: number;
  width?: number;
  theme?: "classic" | "blue";
  onClose?: () => void;
};

export function openWindow(o: WinOpts) {
  const had = open.get(o.id);
  if (had) {
    // reopen with the new content (stop whatever the old content was playing)
    had.querySelectorAll("video").forEach((v) => v.pause());
    had.querySelector(".win__body")!.replaceChildren(o.body);
    had.querySelector(".win__title")!.textContent = o.title;
    raise(had);
    had.classList.remove("win--in");
    void had.offsetWidth;
    had.classList.add("win--in");
    return had;
  }
  const w = document.createElement("section");
  w.className = `win win--${o.theme ?? "classic"} win--in`;
  w.setAttribute("role", "dialog");
  w.setAttribute("aria-label", o.title);
  w.innerHTML = `<header class="win__bar"><span class="win__title">${o.title}</span><span class="win__btns">
      <button class="win__btn" data-a="min" aria-label="Minimise"><i class="g-min"></i></button>
      <button class="win__btn" data-a="max" aria-label="Maximise"><i class="g-max"></i></button>
      <button class="win__btn" data-a="close" aria-label="Close"><i class="g-close"></i></button></span></header>`;
  const content = document.createElement("div");
  content.className = "win__body";
  content.append(o.body);
  w.append(content);
  const vw = innerWidth, vh = innerHeight;
  const width = Math.min(o.width ?? 520, vw - 24);
  w.style.width = width + "px";
  w.style.left = Math.max(12, Math.min(vw - width - 12, o.x ?? (vw - width) / 2)) + "px";
  w.style.top = Math.max(12, Math.min(vh - 200, o.y ?? vh * 0.16)) + "px";
  document.getElementById("layer")!.append(w);
  raise(w);
  open.set(o.id, w);

  const close = () => {
    w.classList.add("win--out");
    open.delete(o.id);
    o.onClose?.();
    setTimeout(() => w.remove(), 180);
  };
  w.addEventListener("pointerdown", () => raise(w));
  w.querySelector('[data-a="close"]')!.addEventListener("click", close);
  w.querySelector('[data-a="min"]')!.addEventListener("click", close);
  w.querySelector('[data-a="max"]')!.addEventListener("click", () => w.classList.toggle("win--max"));
  w.addEventListener("keydown", (e) => e.key === "Escape" && close());

  // drag by the bar
  const bar = w.querySelector<HTMLElement>(".win__bar")!;
  bar.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("button") || w.classList.contains("win--max")) return;
    const sx = e.clientX - w.offsetLeft, sy = e.clientY - w.offsetTop;
    bar.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      w.style.left = Math.max(-width + 80, Math.min(innerWidth - 80, m.clientX - sx)) + "px";
      w.style.top = Math.max(0, Math.min(innerHeight - 40, m.clientY - sy)) + "px";
    };
    const up = () => { bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
  });
  return w;
}

export function closeWindow(id: string) {
  open.get(id)?.querySelector<HTMLElement>('[data-a="close"]')?.click();
}
