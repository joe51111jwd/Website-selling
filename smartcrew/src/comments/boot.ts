// Comment mode's switch, imported by both pages (src/main.tsx, src/book/main.tsx). James, Oct 20:
// "we need a comment mode". Andrew opens the review link (?comment=KEY): the key is kept in this
// browser, taken out of the address bar, and the comment tools (./CommentMode, their own chunk) load
// on every page he opens until he leaves comment mode. ?comment=off leaves it too. Real visitors
// never have a key, so for them this file is the whole cost: a storage read.

export const KEY_STORE = "sc-comment-key";

function readKey(): string | null {
  try {
    const q = new URLSearchParams(location.search);
    const asked = q.get("comment");
    if (asked !== null) {
      if (asked === "off") localStorage.removeItem(KEY_STORE);
      else if (asked) localStorage.setItem(KEY_STORE, asked);
      q.delete("comment");
      const rest = q.toString();
      history.replaceState(history.state, "", `${location.pathname}${rest ? `?${rest}` : ""}${location.hash}`);
    }
    return localStorage.getItem(KEY_STORE);
  } catch {
    return null;
  }
}

const key = typeof window === "undefined" ? null : readKey();
if (key) void import("./CommentMode").then((m) => m.startCommentMode(key));
