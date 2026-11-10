import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, valid } from "./lib/auth";

// Everything is private except the login page and the cron endpoint (which checks its own secret).
export async function proxy(req: NextRequest) {
  if (await valid(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = req.nextUrl.pathname === "/" ? "" : `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/cron|api/login|_next/|favicon|icon).*)"],
};
