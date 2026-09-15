# Control de Stock

Sistema profesional de gestión de stock para pequeñas y medianas empresas: productos,
inventario, compras, ventas, clientes, proveedores, caja, reportes, usuarios y roles.

Este README se completa fase a fase (ver `docs/ARQUITECTURA.md` para las decisiones
técnicas y el plan completo de fases). Lo que sigue es válido a partir de la Fase 1.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query
- **Backend:** Node.js + TypeScript + Express, arquitectura modular (routes → controller → service)
- **Base de datos:** PostgreSQL + Prisma ORM
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
│   │       ├── lib/          # prisma client, logger
│   │       ├── common/       # errores, middlewares, utils compartidos
│   │       └── modules/      # un módulo por dominio de negocio (ver src/modules/README.md)
│   └── web/               # Frontend React + Vite
│       └── src/
│           ├── app/           # router, providers globales
│           ├── components/    # layout/ y ui/ (componentes reutilizables)
│           ├── pages/         # páginas por ruta
│           ├── services/      # cliente HTTP
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

5. **Cargar datos de ejemplo** (roles, permisos y un usuario administrador):

   ```bash
   npm run db:seed
   ```

   Usuario de prueba: `admin@controldestock.local` / `Admin123!`

6. **Levantar backend y frontend** (en dos terminales):

   ```bash
   npm run dev:api    # http://localhost:4000
   npm run dev:web    # http://localhost:5173
   ```

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Levanta backend / frontend en modo desarrollo |
| `npm run build` | Compila `shared`, `api` y `web` en orden |
| `npm run lint` | Lint de todo el monorepo |
| `npm run prisma:studio` | Abre Prisma Studio para inspeccionar la base de datos |
| `npm run prisma:migrate -- --name <nombre>` | Crea y aplica una migración |
| `npm run db:seed` | Vuelve a correr el seed |
| `npm run docker:up` / `npm run docker:down` | Levanta / baja Postgres y Adminer |

## Estado del proyecto

El desarrollo avanza por fases (ver `docs/ARQUITECTURA.md`). **Fase 1 completa:**
arquitectura, monorepo, schema de base de datos completo, configuración inicial,
layout de la app y navegación (con módulos en placeholder hasta su fase correspondiente).

Las fases siguientes (autenticación, productos, inventario, compras, ventas, clientes,
caja, dashboard/reportes, testing/seguridad, Docker de producción) se documentan y
construyen una por una.
