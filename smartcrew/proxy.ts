// Vercel Routing Middleware for /robots.txt only (vercel.json "proxy"). Static files are the
// same on every host, so this answers the path itself and sets Vary: Host. *.vercel.app gets
// Disallow. smartcrewhq.com and www.smartcrewhq.com get the public rules.

import { robotsForHost } from "./src/seo/robots.js";

function requestHost(request: Request): string {
  const raw = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return raw.split(",")[0].trim();
}

export default function proxy(request: Request): Response {
  return new Response(robotsForHost(requestHost(request)), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      Vary: "Host",
    },
  });
}
