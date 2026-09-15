# Build multi-stage: se corre con contexto en la RAÍZ del repo, ej:
#   docker build -f apps/web/Dockerfile -t control-stock-web .

FROM node:20-alpine AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=@control-stock/web --workspace=@control-stock/shared --include-workspace-root

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/web apps/web
# En runtime el navegador llama a /api (mismo origen que sirve Nginx), que
# proxea al servicio `api` — no hace falta una URL absoluta acá.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w @control-stock/shared
RUN npm run build -w @control-stock/web

# --- production: Nginx sirviendo los estáticos + proxy de /api ---
FROM nginx:1.27-alpine AS production
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
