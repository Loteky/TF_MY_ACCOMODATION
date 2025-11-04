# ---------- builder ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# build tools for native addons like argon2
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# install deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# copy source
COPY . .

# prisma client + (re)build native addons + build Nest
RUN npx prisma generate
# ensure argon2 is compiled for this image
RUN npm rebuild argon2 --build-from-source
RUN npm run build

# ---------- runtime ----------
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# Ensure OpenSSL 3 is present so Prisma can detect it
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
