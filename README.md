# Control de Stock

Sistema profesional de gestión de stock para pequeñas y medianas empresas: productos,
inventario, compras, ventas, clientes, proveedores, caja, reportes, usuarios y roles.

Ver `docs/ARQUITECTURA.md` para las decisiones técnicas y el detalle de cada fase.

## Stack

- **Frontend:** React 18 + TypeScript + Vite 8 + Tailwind CSS + React Router 7 + TanStack Query
- **Backend:** Node.js + TypeScript + Express, arquitectura modular (routes → controller → service)
- **Base de datos:** PostgreSQL + Prisma ORM
- **Testing:** Vitest, tests de integración contra una base de datos Postgres real y separada
- **Infraestructura:** Docker Compose (Postgres + Adminer) para desarrollo local
- **Monorepo:** npm workspaces (`apps/api`, `apps/web`, `packages/shared`)

## Estructura del proyecto

```
control-de-stock/
├── apps/
│   ├── api/              # Backend Express + Prisma
│   │   ├── prisma/       # schema.prisma, migraciones, seed
│   │   └── src/
│   │       ├── config/       # validación de variables de entorno
│   │       ├── lib/          # prisma client, logger, jwt
│   │       ├── common/       # errores, middlewares, utils compartidos
│   │       ├── test/         # helpers de tests de integración
│   │       └── modules/      # un módulo por dominio de negocio (ver src/modules/README.md)
│   └── web/               # Frontend React + Vite
│       └── src/
│           ├── app/           # router, providers globales, RequireAuth
│           ├── components/    # layout/ y ui/ (componentes reutilizables)
│           ├── features/      # lógica de UI por módulo de negocio
│           ├── pages/         # páginas por ruta
│           ├── services/      # cliente HTTP por módulo
│           ├── hooks/, lib/, store/
├── packages/
│   └── shared/            # tipos y schemas Zod compartidos entre api y web
├── docker/
│   └── docker-compose.yml # Postgres + Adminer para desarrollo local
└── docs/
    └── ARQUITECTURA.md    # decisiones técnicas y plan de fases
```

## Requisitos

- Node.js 18.18 o superior
- npm 10 o superior (incluido con Node)
- Docker Desktop (para levantar Postgres localmente sin instalarlo a mano)

## Puesta en marcha (desarrollo)

1. **Instalar dependencias** (una sola vez, en la raíz — npm workspaces instala todo):

   ```bash
   npm install
   ```

2. **Variables de entorno**. Copiar los `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

   Revisar especialmente `apps/api/.env`: `DATABASE_URL` y `JWT_SECRET`.

3. **Levantar la base de datos** con Docker:

   ```bash
   npm run docker:up
   ```

   Esto levanta Postgres en `localhost:5432` y Adminer (UI web para ver la base) en
   `http://localhost:8080`.

4. **Migrar la base de datos** y generar el cliente de Prisma:

   ```bash
   npm run prisma:migrate -- --name init
   ```

5. **Cargar datos de ejemplo** (roles, permisos, usuarios, catálogo y clientes demo):

   ```bash
   npm run db:seed
   ```

   Usuarios de prueba:

   | Rol | Email | Contraseña |
   |---|---|---|
   | ADMINISTRADOR | `admin@controldestock.local` | `Admin123!` |
   | ENCARGADO | `encargado@controldestock.local` | `Encargado123!` |
   | VENDEDOR | `vendedor@controldestock.local` | `Vendedor123!` |

6. **Levantar backend y frontend** (en dos terminales):

   ```bash
   npm run dev:api    # http://localhost:4000
   npm run dev:web    # http://localhost:5173
   ```

## Correr los tests

Los tests de `apps/api` son de integración: corren contra una base Postgres real,
separada de la de desarrollo (nunca se mockea Prisma). Antes de la primera corrida:

```bash
cp apps/api/.env.test.example apps/api/.env.test
```

Editar `DATABASE_URL` en `apps/api/.env.test` apuntando a una base **distinta** a la de
desarrollo (por convención, con `_test` en el nombre — el setup de tests lo verifica y
corta la ejecución si no lo encuentra, para no truncar datos reales por error). Crear esa
base y migrarla una vez:

```bash
createdb control_de_stock_test   # o el comando equivalente de tu gestor de Postgres
cd apps/api
DATABASE_URL="<la de .env.test>" npx prisma migrate deploy
```

Y correr los tests:

```bash
npm test -w @control-stock/api
```

Cubren los cálculos y reglas de negocio críticas: stock (entradas/salidas/ajustes,
límite de stock negativo), ventas y compras (totales, precio siempre del servidor,
anular/recibir), login y permisos.

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Levanta backend / frontend en modo desarrollo |
| `npm run build` | Compila `shared`, `api` y `web` en orden |
| `npm run lint` | Lint de todo el monorepo |
| `npm test -w @control-stock/api` | Corre los tests de integración del backend |
| `npm run prisma:studio` | Abre Prisma Studio para inspeccionar la base de datos |
| `npm run prisma:migrate -- --name <nombre>` | Crea y aplica una migración |
| `npm run db:seed` | Vuelve a correr el seed |
| `npm run docker:up` / `npm run docker:down` | Levanta / baja Postgres y Adminer |

## Endpoints principales

Todos bajo `/api`, requieren `Authorization: Bearer <token>` salvo `POST /auth/login` y
`GET /health`. Respuestas siempre `{ success: true, data }` o `{ success: false, error }`.

| Recurso | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Usuarios | `GET/POST /users`, `GET/PUT /users/:id`, `PUT /users/:id/password` |
| Roles | `GET /roles`, `GET /roles/permissions/catalog`, `PUT /roles/:id/permissions` |
| Configuración | `GET/PUT /settings` |
| Categorías / Marcas | `GET/POST /categories`, `PUT /categories/:id` (igual para `/brands`) |
| Proveedores | `GET/POST /suppliers`, `GET/PUT /suppliers/:id` |
| Productos | `GET/POST /products`, `GET/PUT /products/:id`, `GET /products/export`, `POST /products/import` |
| Inventario | `GET /inventory/movements`, `POST /inventory/movements`, `GET /inventory/alerts`, `GET /inventory/movements/export` |
| Compras | `GET/POST /purchases`, `GET /purchases/:id`, `PUT /purchases/:id/receive`, `PUT /purchases/:id/cancel` |
| Clientes | `GET/POST /customers`, `GET/PUT /customers/:id` |
| Ventas | `GET/POST /sales`, `GET /sales/:id`, `PUT /sales/:id/cancel` |
| Caja | `GET /cashregister/current`, `GET /cashregister/history`, `POST /cashregister/open`, `PUT /cashregister/:id/close`, `POST /cashregister/:id/movements` |
| Reportes | `GET /reports/dashboard`, `/reports/sales-by-period`, `/reports/top-products`, `/reports/purchases-by-supplier`, `/reports/profit`, `/reports/payment-methods` (los dos primeros con `/export` para CSV) |
| Auditoría | `GET /audit`, `GET /audit/filters` (solo Administrador) |

## Despliegue en producción (Docker)

Tres imágenes: `postgres` (oficial), `api` (Node + Express, compilado) y `web` (build
estático de React servido por Nginx, que además hace de proxy a `/api`). Los
Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`) se corren con el **contexto en
la raíz del repo** porque necesitan `package-lock.json` y `packages/shared` del monorepo.

1. Copiar y completar las variables de entorno de producción:

   ```bash
   cp .env.prod.example .env.prod
   ```

   Generar `JWT_SECRET` con `openssl rand -base64 48` y una contraseña fuerte para
   `POSTGRES_PASSWORD`. Poner en `CORS_ORIGIN` el dominio real desde el que se va a
   servir el frontend.

2. Construir y levantar todo el stack:

   ```bash
   docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

   El contenedor de `api` corre `prisma migrate deploy` automáticamente antes de
   arrancar el servidor, así que las migraciones quedan aplicadas en cada despliegue.

3. La app queda en `http://localhost` (o el `WEB_PORT` que hayas configurado) y la API
   en `http://localhost:4000` (`API_PORT`). Para cargar el seed inicial en producción
   (solo la primera vez, con datos reales — no el catálogo demo):

   ```bash
   docker compose -f docker/docker-compose.prod.yml exec api npm run db:seed
   ```

   revisando antes `apps/api/prisma/seed.ts`, ya que tal como está pensado siembra
   datos de ejemplo (útiles para una demo, no para arrancar un negocio real desde cero).

> **Nota:** los Dockerfiles y el compose de producción se armaron siguiendo las
> convenciones estándar de Docker/Node/Nginx para este tipo de stack, pero no pudieron
> construirse ni levantarse en este entorno de desarrollo (no tiene Docker instalado —
> ver decisión registrada al arrancar el proyecto). Antes de un despliegue real, correr
> el `docker compose ... up --build` una vez en un entorno con Docker y confirmar que
> los tres servicios levantan y la app responde en el navegador.

## Estado del proyecto

**Fases 1 a 10 completas**: arquitectura, auth/roles, catálogo, inventario, compras,
ventas/clientes, caja, dashboard/reportes, testing/seguridad, Docker de producción — ver
`docs/ARQUITECTURA.md` para el detalle de cada una.
