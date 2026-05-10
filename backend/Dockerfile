# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ---- Stage 2: Run ----
FROM node:20-alpine AS production

# Security: non-root user
RUN addgroup -g 1001 -S nexus && \
    adduser -S nexus -u 1001 -G nexus

WORKDIR /app

# Copy only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built code
COPY --from=builder /app/dist ./dist

# Own the app dir
RUN chown -R nexus:nexus /app

USER nexus

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

# Read-only filesystem (volumes needed for /tmp if required)
CMD ["node", "dist/index.js"]
