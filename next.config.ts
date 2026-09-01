import type { NextConfig } from "next";

// The bare "/" redirect lives in app/page.tsx so it can follow the default
// language chosen in the admin settings instead of being frozen at build time.
const nextConfig: NextConfig = {};

export default nextConfig;
