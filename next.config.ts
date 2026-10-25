import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // A self-contained Node server: the list route fetches from EasyArmy, which browsers cannot read.
  output: "standalone",
  // pdf.js runs as a plain Node package rather than bundled into the route.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
