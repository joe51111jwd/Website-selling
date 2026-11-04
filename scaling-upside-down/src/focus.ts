// The focus version (/focus, or ?focus=1 locally): one thing on screen at a time, and the picture needs
// no words (src/components/FocusPage.tsx). The book alone; then the film alone (render/loadpath.py), with
// no words over it; then the words alone; then the book and its sign-up.
export const FOCUS = typeof window !== "undefined" && (/^\/focus\/?$/.test(window.location.pathname) || new URLSearchParams(window.location.search).has("focus"));
