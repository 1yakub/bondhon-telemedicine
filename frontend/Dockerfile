# syntax=docker/dockerfile:1.7
# Bondhon web image: Next.js standalone output on a small Node runtime, unprivileged user.
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Browser calls go to the same origin; Next rewrites /api/* to the API container at run time.
ENV NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_DEMO=true
ENV NEXT_PUBLIC_DEMO=$NEXT_PUBLIC_DEMO
ARG NEXT_PUBLIC_SITE_URL=https://bondhon.yakubhossain.dev
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# internal hostname of the API container on the platform network (Coolify network alias)
ARG API_INTERNAL_URL=http://bondhon-api:8080
ENV API_INTERNAL_URL=$API_INTERNAL_URL
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
