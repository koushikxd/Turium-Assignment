import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";

import { ENV } from "./src/env";

const withVarlock = varlockNextConfigPlugin();
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  // Proxy API calls to the Express server so the browser stays same-origin (no CORS).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${ENV.SERVER_URL.replace(/\/$/, "")}/:path*` }];
  },
};

export default withVarlock(nextConfig);
