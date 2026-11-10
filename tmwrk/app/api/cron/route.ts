import { NextResponse } from "next/server";
import { collect } from "@/lib/collect";

// Vercel Cron calls this once a day (vercel.json) with "Authorization: Bearer $CRON_SECRET".
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const run = await collect();
  return NextResponse.json(run, { status: run.ok ? 200 : 500 });
}
