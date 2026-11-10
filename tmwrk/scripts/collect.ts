// npm run collect — the daily job from the command line (same as /api/cron).
import { collect } from "../lib/collect";

collect().then((r) => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
});
