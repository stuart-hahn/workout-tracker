FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# --- deps (includes build tooling for native addons like better-sqlite3) ---
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# --- build ---
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# --- runtime ---
FROM base AS runner
WORKDIR /app

ENV PORT=3000
ENV DATABASE_URL="file:/data/sqlite.db"

RUN useradd -m -u 1001 nodejs
RUN mkdir -p /data && chown -R nodejs:nodejs /data

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated ./src/generated

EXPOSE 3000
USER nodejs

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]

