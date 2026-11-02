// The focus version (/focus, or ?focus=1 locally): one thing on screen at a time. The book alone on
// landing; then the picture alone, centred; at each pause the picture steps back behind the paper and
// one line takes the screen, then the picture comes back. Same story, same words, same sign-up.
export const FOCUS = typeof window !== "undefined" && (/^\/focus\/?$/.test(window.location.pathname) || new URLSearchParams(window.location.search).has("focus"));
