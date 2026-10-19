FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./tsconfig.json
RUN npm run build

ENV NODE_ENV=production
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/index.js"]
