// Where a screen's image lives and its native CSS size. No three.js here, so page code (scenes,
// the DOM that follows the devices) can use it without pulling the Stage's chunk.

/** Native CSS px size of the recreated screens (src/screens/registry.ts SIZE). */
export const NATIVE = { web: { w: 1440, h: 900 }, phone: { w: 402, h: 874 } };

const base = import.meta.env.BASE_URL;

/** A screen id ("web-dashboard") or a file under public/ ("renders/day-s/phone-d-dot.webp") → its URL. */
export const screenUrl = (id: string) => (id.includes("/") || id.includes(".") ? base + id.replace(/^\//, "") : `${base}screens/${id}.webp`);

/** Native CSS px of a screen: by id, or by a file's name ("renders/day-s/web-hauling.webp" is a web screen shot at 2x). */
export function nativeSize(id: string, iw: number, ih: number) {
  const name = id.split("/").pop() ?? id;
  if (name.startsWith("web-")) return NATIVE.web;
  if (name.startsWith("phone-")) return NATIVE.phone;
  return { w: iw, h: ih };
}
