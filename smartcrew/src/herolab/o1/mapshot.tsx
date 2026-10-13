// The source of ./map-hwy9.webp (see ./mapshot.html): the job's map, live, at its native size,
// drawn taller than its window by MAP_PAD above and below (the opening slides it to put the culvert
// in the geofence). Re-shoot after the map or the demo data change: tools/mapshot.cjs in the
// opening's scratch folder.
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "../../screens/screens.css";
import { MapPanel } from "../../screens/kit/MapPanel";
import { MAP, MAP_AT, MAP_PAD, ZOOM } from "./screen";
import "./o1.css";

function ClockMap() {
  return (
    <div className="sc o1-mapw" style={{ width: MAP.w, height: MAP.h + MAP_PAD * 2 }}>
      <MapPanel width={MAP.w} height={MAP.h + MAP_PAD * 2} center={{ x: MAP_AT.x + 6, y: MAP_AT.y + 4 }} zoom={ZOOM} controls="none" radius={0} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<ClockMap />);
