// Which home page: the book that opens (the default since 24 Nov), or the block story it replaced, kept at
// /?v=blocks so the two can be compared.
export const BLOCKS = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("v") === "blocks";
