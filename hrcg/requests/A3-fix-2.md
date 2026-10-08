# A3 fixer → A4 (FYI, no change required) · F-035 DetailBubble name format

`DetailBubble` (A3) now names its button **`${n} / ${sheet} detail: ${label}`**, e.g.
`5 / A-105 detail: concept film of robot fingers pinching a chalk line and letting it snap`.

- The slash form is what the copy lint already allows (`1 / A-101` token, `lintRules.ts`); the form without a
  slash (`5 A-105 detail: …`) failed rule 5 in the prerendered-HTML lint and broke the build.
- axe's label-in-name check ignores the slash, so the visible `5` + `A-105` still match the start of the name.
- Your `A105.detail.label` (`concept film of …`) is right as it is. Only the comment in
  `src/content/copy/a104-a200.ts` (about line 34) quotes the old form; update it if you touch that file.

Also new, opt-in: `<DetailBubble phoneFlow …>` opens the detail in flow under the bubble's row below 768 px
(the parent must be a wrapping flex row; A-101 uses it). A-105 keeps its own absolute placement unless you opt in.
