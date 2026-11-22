import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [{ source: "/apply", destination: "/start", permanent: false }];
  },
  async headers() {
    // Preview deployments must never be indexed. Production on meetroger.ai is.
    if (process.env.VERCEL_ENV === "production") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default config;
