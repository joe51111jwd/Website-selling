// One stacking order shared by heads and windows: whatever you touch comes to the front.
let top = 10;
export function raise(el: HTMLElement) {
  el.style.zIndex = String(++top);
}
