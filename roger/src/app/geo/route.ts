// Prototype stand-in for the country default. The live site already reads
// x-vercel-ip-country in src/components/circles/price.tsx; reuse that when porting.
export async function GET(req: Request) {
  return Response.json({ country: req.headers.get("x-vercel-ip-country") ?? null });
}
