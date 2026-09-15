# Arquitectura — Control de Stock

## 1. Decisiones técnicas y por qué

**Monorepo con npm workspaces** en lugar de pnpm/Turborepo. Con tres paquetes
(`api`, `web`, `shared`) no hace falta un orquestador de builds: npm workspaces viene
incluido con Node, no agrega una herramienta más que instalar, y alcanza para compartir
tipos y validaciones entre frontend y backend sin publicar un paquete npm real.

**Backend: Express + TypeScript**, no NestJS ni Fastify. Se evaluó NestJS por su
sistema de módulos/guards, que calza bien con roles y permisos — pero agrega una curva
de aprendizaje (decoradores, DI, módulos) que no se justifica para el tamaño de este
proyecto, y Express sigue siendo el framework Node más documentado y estable. Se
compensa la falta de estructura "de fábrica" de Nest con una convención propia y
explícita por módulo (`routes → controller → service`, ver `apps/api/src/modules/README.md`)
que da el mismo orden sin el overhead. Fastify se descartó por ser marginalmente más
rápido pero con un ecosistema de middlewares más chico; en un sistema de gestión (no
alto tráfico) esa diferencia de performance no es relevante.

**Validación: Zod**, compartido entre backend y frontend vía `packages/shared`. La
misma definición de "qué es un producto válido" se usa para validar el `POST /api/products`
en el servidor y para validar el formulario en React — evita que las reglas de negocio
diverjan entre las dos capas y cumple el requisito de "nunca confiar solo en el frontend"
sin duplicar código.

**Base de datos: PostgreSQL + Prisma.** Postgres por ser relacional, con transacciones
ACID reales (imprescindible para que una venta descuente stock de forma atómica) y
soporte maduro de constraints/índices. Prisma como ORM porque genera tipos TypeScript
a partir del schema (errores de tipos entre la base y el código se detectan en
compilación) y maneja migraciones versionadas de forma simple.

**Stock como campo cacheado + tabla de movimientos**, no solo un `SUM()` sobre
movimientos calculado al vuelo. `Product.currentStock` es la fuente rápida de lectura
(listados, alertas), pero **nunca se escribe directamente**: todo cambio de stock pasa
por `InventoryMovement`, insertado en la misma transacción de Prisma que actualiza
`currentStock`. Esto da lecturas rápidas sin sacrificar la trazabilidad completa que
pide el punto 6 del brief ("el stock no debe modificarse sin registrar un movimiento").

**Autenticación: JWT stateless** (Fase 2), no sesiones en base de datos. Para una app
de una sola instancia esto simplifica el backend (sin store de sesiones) a costa de no
poder revocar un token individual antes de que expire — aceptable dado el tamaño del
equipo de usuarios (dueño + un puñado de empleados). Los passwords se hashean con
bcrypt, nunca se guardan en texto plano ni se loguean.

**Permisos: roles + tabla de permisos configurable**, no roles hardcodeados en el
código. `Role` y `Permission` son tablas (`role_permissions` es N:M), sembradas con los
tres roles del brief (ADMINISTRADOR, ENCARGADO, VENDEDOR) y sus permisos por defecto
(`packages/shared/src/enums.ts → DEFAULT_ROLE_PERMISSIONS`). Esto permite en el futuro
ajustar permisos desde la UI sin tocar código, tal como pide la sección 14.

**Frontend: Tailwind CSS + componentes propios**, no una librería de componentes
completa (MUI, Ant Design, etc.). Da control total sobre la identidad visual "SaaS
minimalista" pedida en el brief y evita pelear contra el theming de una librería ajena;
el costo es construir a mano los componentes base (`Button`, `Card`, `EmptyState`,
`StatCard`, y los que se agreguen: `Table`, `Modal`, `Toast`, `Input`), lo cual ya
arrancó en la Fase 1 en `apps/web/src/components/ui/`.

**TanStack Query** para todo el estado de servidor (listados, detalle, mutaciones) en
vez de manejarlo a mano con `useState`/`useEffect`: da cache, revalidación, estados de
carga/error consistentes en toda la app "gratis". **Zustand** (liviano, sin boilerplate)
queda reservado para el poco estado de cliente real que hace falta — sesión del usuario
logueado y, más adelante, el carrito de la pantalla de ventas.

## 2. Modelo de datos

Ver `apps/api/prisma/schema.prisma` — es la fuente de verdad. Resumen de entidades y
relaciones principales:

```
Role 1──N User
Role N──N Permission   (vía RolePermission)

Category 1──N Product
Brand    1──N Product
Supplier 1──N Product        (proveedor preferido, opcional)
Supplier 1──N Purchase

Product 1──N InventoryMovement
Product 1──N PurchaseItem
Product 1──N SaleItem

Purchase 1──N PurchaseItem
Sale     1──N SaleItem

Customer 1──N Sale (opcional)
User     1──N Sale, Purchase, InventoryMovement, CashRegister, CashMovement, AuditLog

CashRegister 1──N Sale (ventas asociadas a la caja abierta al momento de vender)
CashRegister 1──N CashMovement (ingresos/egresos manuales)

BusinessConfig — fila única con configuración general (moneda, permite stock negativo, etc.)
AuditLog — bitácora de acciones importantes, referenciando cualquier entidad por (entity, entityId)
```

Reglas de integridad ya modeladas en el schema:

- `sku` y `barcode` de `Product` son únicos (`barcode` nullable-único).
- Todos los montos monetarios usan `Decimal(12,2)`, nunca `Float`, para evitar errores
  de redondeo en totales de venta/compra.
- `InventoryMovement` guarda `previousStock` y `resultingStock` explícitos (no solo la
  cantidad del movimiento), para que el historial sea auditable sin tener que
  recalcular sumas.
- Los `onDelete: Cascade` se usan solo en relaciones "de detalle" (`PurchaseItem`,
  `SaleItem`, `CashMovement`, `RolePermission`) — nunca en entidades de catálogo, para
  no borrar productos o clientes en cascada por accidente.

## 3. Plan de fases

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Arquitectura, monorepo, base de datos, configuración inicial | ✅ Completa |
| 2 | Autenticación (JWT), usuarios, roles y permisos | ✅ Completa |
| 3 | Productos, categorías, marcas, proveedores | ✅ Completa |
| 4 | Inventario, movimientos, alertas de stock | Pendiente |
| 5 | Compras | Pendiente |
| 6 | Ventas | Pendiente |
| 7 | Clientes y caja | Pendiente |
| 8 | Dashboard y reportes | Pendiente |
| 9 | Testing, seguridad, optimización | Pendiente |
| 10 | Docker de producción, deployment, documentación final | Pendiente |

Al cerrar cada fase: se corren pruebas/typecheck, se revisan errores, se verifica la
integración con lo ya construido, y se explica brevemente qué se agregó antes de pasar
a la siguiente.

## 4. Fase 2 — Autenticación, usuarios y roles

**JWT stateless** firmado con `JWT_SECRET`/`JWT_EXPIRES_IN`. El middleware `authenticate`
no confía solo en el payload del token: en cada request vuelve a leer el usuario (con su
rol y permisos) desde la base, así un usuario desactivado o con el rol cambiado pierde
acceso inmediatamente sin esperar a que expire el token.

**Permisos por clave de recurso** (`hasPermission` en `packages/shared/src/permissions.ts`),
evaluados siempre en el backend (`authorize('<recurso>:*'|'<recurso>:read')`) — el frontend
(`usePermission`) solo usa la misma función para ocultar navegación y bloquear rutas por
UX, nunca como única barrera. `ADMINISTRADOR` tiene `'*'` y no se puede editar desde
`PUT /api/roles/:id/permissions`.

**Passwords con bcrypt** (10 rounds). El login compara siempre contra un hash (real o uno
dummy fijo si el email no existe) para que el tiempo de respuesta no revele si un email
está registrado. Rate limiting propio y más estricto en `/api/auth/login` (10 intentos /
15 min) además del límite general de `/api`.

**Auto-protecciones**: un usuario no puede desactivar su propia cuenta (`users.service.ts`),
validado en el backend incluso si se llama a la API directamente. Todo login, alta,
cambio de rol/estado y cambio de contraseña queda en `AuditLog` (`common/utils/audit.ts`),
sin romper el flujo principal si el log fallara.

**UI**: primitivos nuevos (`Input`, `Select`, `Modal`, `Badge`, `Toast`) reutilizables desde
acá para todos los módulos siguientes. `RequireAuth` valida el token contra `/auth/me` al
refrescar la página antes de dejar pasar a cualquier ruta protegida.

## 5. Fase 3 — Productos, categorías, marcas, proveedores

**`Decimal` de Prisma serializa como string en JSON** (usa el `toJSON` de
decimal.js): sin convertirlo explícitamente a `Number` en el service antes de
responder, el frontend recibe `"1400.00"` en vez de `1400` y rompe cualquier
`.toFixed()` o cálculo aritmético sobre el valor. Se corrigió en
`products.service.ts` y `settings.service.ts` (`serializeProduct`/`serialize`);
**hay que repetir el mismo patrón en Compras, Ventas y Caja (Fases 5-7)**, que
también tienen campos `Decimal`.

**Categorías y marcas se gestionan dentro de la pantalla de Productos** (tabs),
no como ítems de navegación propios — son catálogos de apoyo, no módulos de
negocio independientes. Proveedores sí tiene su propia página porque en fases
siguientes (Compras) va a mostrar historial de compras y productos asociados.

**Listado de productos paginado y filtrable** en el backend (`page`, `pageSize`,
`search`, `categoryId`, `brandId`, `supplierId`, `status`, `sortBy`, `sortDir`)
en vez de traer todo el catálogo al frontend — necesario ya que un comercio
real puede tener miles de productos.

**Import/export CSV sin dependencias nuevas**: parser/writer propios en
`common/utils/csv.ts` (alcanza para el formato simple que necesitamos) y el
import lee el archivo como texto en el navegador (`File.text()`) en vez de
subir un `multipart/form-data`, evitando agregar `multer` solo para esto.
Categoría/Marca se crean automáticamente si no existen (por nombre); Proveedor
debe existir ya, para no crear proveedores duplicados por un nombre mal tipeado.

## 6. Deuda técnica conocida (a revisar en Fase 9)

`npm audit` reporta vulnerabilidades en `vite`/`esbuild` (moderate/high, servidor de
desarrollo) y `vitest` (critical, solo se ejecuta en tests) y `react-router-dom`
(moderate, open redirect). Las tres requieren un bump de versión mayor (Vite 5→8,
Vitest 2→5, React Router 6→7) que puede romper APIs ya usadas en el código — no se
aplica en Fase 1 para no mezclar una migración mayor no planeada con la verificación
de arquitectura. Se resuelve en Fase 9 (testing/seguridad) con el tiempo para migrar y
probar cada breaking change correctamente.
