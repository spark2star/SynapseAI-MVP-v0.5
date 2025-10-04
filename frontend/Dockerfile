## Multi-stage Dockerfile for Next.js 14 (standalone)

# ------------------------------
# Development image (no type-check/build)
# ------------------------------
FROM node:18-alpine AS dev

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Create non-root user for dev runtime
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs \
    && chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ------------------------------
# Base builder image
# ------------------------------
FROM node:18-alpine AS builder

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build standalone output
RUN npm run build

# ------------------------------
# Production runner image
# ------------------------------
FROM node:18-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

WORKDIR /app

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy only the necessary artifacts for standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]


