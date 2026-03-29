# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Ensure data directory exists
RUN mkdir -p data

# ─── Runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy from base
COPY --from=base /app /app

# Expose port
EXPOSE 3000

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "app.js"]
