const fs = require('fs');
const content = `import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/image-reducer',
        destination: '/ireducer',
        permanent: true,
      },
      {
        source: '/deeplink-opener',
        destination: '/deeplink',
        permanent: true,
      },
    ]
  },
  webpack: (config) => {
    // Ignore node-specific modules to prevent Vercel 250MB limit error due to onnxruntime-node
    config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node$": false,
    }
    return config;
  },
};

export default pwaConfig(nextConfig);
`;
fs.writeFileSync('next.config.ts', content);
