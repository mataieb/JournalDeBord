FROM node:18-alpine

WORKDIR /app

# 1. Build Client
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# 2. Setup Server
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
COPY --from=0 /app/client/dist ./client/dist

# 3. Prisma Setup
WORKDIR /app/server
RUN npx prisma generate

# 4. Expose and Run
EXPOSE 3001
CMD ["npm", "start"]
