# Build multi-stage: se corre con contexto en la RAÍZ del repo (necesario para
# que `npm ci` resuelva el monorepo completo), ej:
#   docker build -f apps/api/Dockerfile -t control-stock-api .

FROM node:20-alpine AS base
# Prisma necesita OpenSSL en runtime para su motor de consultas.
RUN apk add --no-cache openssl
WORKDIR /repo

# --- deps: instala con los package.json de todo el workspace ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=@control-stock/api --workspace=@control-stock/shared --include-workspace-root

# --- build: compila shared -> api y genera el cliente de Prisma ---
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @control-stock/shared
RUN npm run prisma:generate -w @control-stock/api
RUN npm run build -w @control-stock/api

# --- production: imagen final, sin devDependencies ni código fuente ---
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma

WORKDIR /repo/apps/api
EXPOSE 4000

# `prisma migrate deploy` aplica migraciones pendientes al arrancar — seguro
# para una sola instancia; con múltiples réplicas conviene un job de
# migración aparte en vez de correrlo en cada contenedor.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
