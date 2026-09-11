import type { NextConfig } from "next";

// Nothing to configure. There used to be a note here about the bare "/"
// redirect living in app/page.tsx so it could follow the default language
// chosen in the admin settings; the store is Arabic only now, "/" is the home
// page itself, and that setting is gone.
const nextConfig: NextConfig = {};

export default nextConfig;
