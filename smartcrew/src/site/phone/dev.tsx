// Dev only (./dev.html): the phone kit on one page. Tap the phone to replay its tap → after state.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "../../styles/base.css";
import { PhoneFrame } from "./PhoneFrame";
import { LaptopFrame } from "./LaptopFrame";
import { useArrive, useSteps } from "./useArrive";
import { stateScreen } from "../day/states/registry";

document.documentElement.classList.add("sc-page");

function Demo() {
  const [n, setN] = useState(1);
  const [ref, arrived] = useArrive<HTMLDivElement>();
  const step = useSteps(arrived, [300, 820]);
  const key = `${n}-${step}`;
  return (
    <div ref={ref} key={key} style={{ display: "grid", gap: 28, padding: 20, justifyItems: "center", background: "var(--dawn)" }}>
      <button type="button" onClick={() => setN((v) => v + 1)} style={{ width: 210 }}>
        <PhoneFrame
          screens={["phone-home", stateScreen("phone-d-clockedin")]}
          index={step >= 2 ? 1 : 0}
          tap={{ box: [118.5, 383.3, 165, 165], n: step >= 1 ? n : 0 }}
          sizes="210px"
          loading="eager"
          alt="Clock in"
        />
      </button>
      <div style={{ width: 150 }}>
        <PhoneFrame screens={[stateScreen("phone-d-dot-sent")]} tone="dark" sizes="150px" loading="eager" />
      </div>
      <div style={{ width: 340 }}>
        <LaptopFrame screens={["web-dashboard"]} ring={[339, 694, 1057, 66]} sizes="340px" loading="eager" />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
