// Entry for dev.html: the REAL page (src/main.tsx renders App into #root, exactly as index.html
// does), with the O2 opening mounted in front of it in its own root. The opening drives the hero
// only through its public hooks (src/site/hero/fence/opening.ts) and reads the hero's DOM.
import "../../main";
import { mountO2 } from "./index";

mountO2(document.getElementById("o2-root")!);
