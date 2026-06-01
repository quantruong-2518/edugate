import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  transpilePackages: ["ui", "shared"],
  images: {
    // Landing imagery is sourced from Unsplash in pha 1 (mock content). Pha 2
    // tenants upload their own to R2/MinIO — add that host here then.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // The shared + db packages live as TS sources resolved at build time, but
  // their internal re-exports carry `.js` extensions so the API (NodeNext
  // resolver) can import them. Tell webpack to fall back from `.js` to `.ts`
  // so the same source tree builds under both resolvers.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
