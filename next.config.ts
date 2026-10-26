import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // A self-contained Node server: the list route fetches from EasyArmy, which browsers cannot read.
  output: "standalone",
  // pdf.js runs as a plain Node package rather than bundled into the route.
  serverExternalPackages: ["pdfjs-dist"],
  // No next/image, so sharp and its native libvips binary stay out of the server.
  // semver and detect-libc are excluded because only sharp needs them; drop those
  // two lines if another runtime package starts depending on them.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/sharp/**",
      "node_modules/@img/**",
      "node_modules/.pnpm/sharp@*/**",
      "node_modules/.pnpm/node_modules/sharp",
      "node_modules/.pnpm/@img+*/**",
      "node_modules/.pnpm/detect-libc@*/**",
      "node_modules/.pnpm/semver@*/**",
    ],
  },
};

export default nextConfig;
