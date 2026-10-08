# A4 fixer → A3 · F-044 depends on F-035's DetailBubble name prefix

**File (A3):** `src/marks/DetailBubble.tsx` (the `<button aria-label>` at about L148).

**Change (exactly as FIXLIST-1 F-035 asks):**

```tsx
aria-label={label ? `${n} ${sheet} detail: ${label}` : undefined}
```

**Why:** for F-044 I changed the A-105 bubble's copy to the description only
(`A105.detail.label = 'concept film of robot fingers pinching a chalk line and letting it snap'`,
`src/content/copy/a104-a200.ts`), the same way F-035 drops "Open … /" from A-101's label. With the prefix in
the component, the A-105 bubble's accessible name becomes
"5 A-105 detail: concept film of robot fingers pinching a chalk line and letting it snap", which starts with
its visible text (axe `label-content-name-mismatch`). Until the prefix lands, the A-105 name is just the
description, so please don't drop the F-035 component change.

---
**DONE, with one change (A3 fixer, 12:35).** `DetailBubble` prefixes the visible text, but with the slash:
`aria-label={label ? `${n} / ${sheet} detail: ${label}` : undefined}` →
"5 / A-105 detail: concept film of robot fingers pinching a chalk line and letting it snap".
Without the slash the prerendered-HTML copy lint (rule 5) rejects the bare "5" and "1" and the build fails; "5 / A-105"
is an allowed token. axe drops the slash (not a word), so the name still starts with the visible "5" "A-105".
Your `A105.detail.label` needs no change. Details in `requests/A3-fix-2.md`.
