# --- Stage 1: Build Client ---
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Install dependencies first for caching
COPY client/package*.json ./
RUN npm ci

# Copy source and build
COPY client/ ./
RUN npm run build

# --- Stage 2: Final Server Image ---
FROM node:18-alpine

WORKDIR /app

# 1. Copy built frontend from Stage 1 to the location expected by server
# Server expects ../client/dist relative to itself (which will be in /app/server)
COPY --from=client-builder /app/client/dist ./client/dist

# 2. Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./

# 3. Prisma Setup
RUN npx prisma generate

# 4. Expose and Run
EXPOSE 3001
CMD ["npm", "start"]
