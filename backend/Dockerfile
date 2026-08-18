# Build context is the repo root (needed for the @paristats/shared workspace).
FROM node:20-slim AS build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY shared/types/package.json shared/types/package.json
COPY frontend/package.json frontend/package.json
COPY mobile/package.json mobile/package.json
RUN npm ci --workspace=backend --workspace=@paristats/shared

COPY shared/types shared/types
COPY backend backend
RUN npm run build -w backend

FROM node:20-slim AS runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/shared/types ./shared/types
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
