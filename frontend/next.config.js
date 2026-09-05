/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output: the image ships server.js plus only the files it needs
  output: "standalone",
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async rewrites() {
    // The browser talks to /api on this same origin and Next forwards to the API container.
    // Rewrites are fixed at build time, so the target is a build argument with the internal
    // hostname the API container carries on the platform network (a network alias).
    // Same origin means the session cookie needs no cross site settings and no CORS surface.
    const target = process.env.API_INTERNAL_URL || "http://bondhon-api:8080";
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
