import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // standalone output: the image ships server.js plus only the files it needs
  output: "standalone",
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async rewrites() {
    // The browser talks to this origin only. Next forwards /api and the Sanctum CSRF
    // cookie route to the API container by its internal hostname (a network alias on the
    // platform). Same origin means the session cookie needs no cross site settings.
    const target = process.env.API_INTERNAL_URL || "http://bondhon-api:8080";
    return [
      { source: "/api/:path*", destination: `${target}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${target}/sanctum/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
