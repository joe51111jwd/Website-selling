// Which version of the page this visit sees, for the agency owner's side-by-side:
//   "ride"  (default): One Day plays as the React/3D "Enjoy the ride" film;
//   "video" (?v=video): One Day is Andrew's own walkthrough video, full screen until it ends.
// ?v=… sticks for the session, so the popup's round trip to /book and back keeps the version.

export type Version = "ride" | "video";

function read(): Version {
  if (typeof window === "undefined") return "ride";
  const q = new URLSearchParams(location.search).get("v");
  if (q === "video" || q === "ride") {
    try {
      sessionStorage.setItem("sc-version", q);
    } catch {
      /* private mode: the query alone decides */
    }
    return q;
  }
  try {
    return sessionStorage.getItem("sc-version") === "video" ? "video" : "ride";
  } catch {
    return "ride";
  }
}

export const VERSION: Version = read();
