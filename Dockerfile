# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies with proper GPG key setup
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    gnupg \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY build.js ./

# Install dependencies
RUN npm install
RUN npm install -g sonolus-pack
# Copy client package files first
COPY client/package*.json ./client/

# Install client dependencies separately
WORKDIR /app/client
RUN npm install --legacy-peer-deps

# Back to app root
WORKDIR /app

# Copy source code and other directories
COPY src/ ./src/
COPY lib/ ./lib/
COPY client/src/ ./client/src/
COPY source/ ./source/
COPY .env ./

COPY pack/ ./pack/
COPY client/index.html ./client/
COPY client/tsconfig.json ./client/
COPY client/vite.config.ts ./client/
COPY client/package.json ./client/
COPY client/tsconfig.node.json ./client/

# Build TypeScript
RUN npm run build
# Production stage
FROM node:20-slim

WORKDIR /app

# Install FFmpeg and clean up
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy built files, dependencies, lib and public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/public ./public
COPY --from=builder /app/pack ./pack
COPY --from=builder /app/.env ./

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]