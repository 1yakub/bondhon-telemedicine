import { NextRequest, NextResponse } from "next/server";

/**
 * Content Security Policy with a per request nonce, the pattern from the Next.js CSP
 * guide (docs/app/guides/content-security-policy). Next attaches the nonce to its own
 * script tags. Agora's Web SDK talks to the domains listed in Agora's firewall reference
 * (docs.agora.io/en/video-calling/reference/firewall); media itself runs over WebRTC.
 */
const agora = [
  "https://*.agora.io",
  "wss://*.agora.io",
  "https://*.sd-rtn.com",
  "wss://*.sd-rtn.com",
  "https://*.rtnsvc.com",
  "wss://*.rtnsvc.com",
  "https://*.rtesvc.com",
  "wss://*.rtesvc.com",
].join(" ");

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    media-src 'self' blob:;
    worker-src 'self' blob:;
    font-src 'self';
    connect-src 'self' ${agora};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      // pages only: the API and Sanctum rewrites, static files and the favicon are skipped
      source: "/((?!api|sanctum|_next/static|_next/image|favicon.ico|fonts|images).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
