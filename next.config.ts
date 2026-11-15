import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Text in two languages (messages/en.json and messages/ne.json).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
// Guides and trust pages are written as MDX files in content/.
const withMDX = createMDX({});

export default withMDX(withNextIntl(nextConfig));
