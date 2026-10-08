// The polite live region (brief 3.1). Render once (App does). announce() lives in
// src/system/announce.ts and is re-exported here. Owner: A1.

import { LIVE_REGION_ID } from '../system/announce';

export { announce } from '../system/announce';

export function AriaLive() {
  return <div id={LIVE_REGION_ID} className="sr-only" aria-live="polite" aria-atomic="true" />;
}

export default AriaLive;
