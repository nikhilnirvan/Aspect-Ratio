# Production Dockerfile with Native FFmpeg and FFprobe support
# Suitable for Google Cloud Run, Railway, Render, Fly.io, or VPS
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install native ffmpeg & build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy application code and build
COPY . .
RUN npm run build

# Verify ffmpeg is available
RUN ffmpeg -version && ffprobe -version

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.cjs"]
