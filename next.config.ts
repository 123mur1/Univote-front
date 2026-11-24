import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
<<<<<<< HEAD
    agentUpgrade: "security",
=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
