# ─── Build Stage ──────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY server/package.json server/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY server/ ./
RUN pnpm prisma generate
RUN pnpm build

# ─── Production Stage ──────────────────────
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["pnpm", "start"]
