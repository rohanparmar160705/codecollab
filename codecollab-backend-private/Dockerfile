# codecollab-backend Dockerfile (Optimized)
FROM node:18-slim AS builder

WORKDIR /app

# Install system dependencies (OpenSSL for Prisma)
RUN apt-get update -y && apt-get install -y openssl libssl-dev

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ---------------------------------------------
# Runner stage
# ---------------------------------------------
FROM node:18-slim

WORKDIR /app
ENV NODE_ENV=production

# Install runtime dependencies (OpenSSL + ca-certificates)
RUN apt-get update -y && apt-get install -y openssl libssl-dev ca-certificates

# Copy artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy .env for runtime configuration
COPY .env ./

EXPOSE 4000

CMD ["node", "dist/server.js"]
