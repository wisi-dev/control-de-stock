# Módulos del backend

Cada módulo de negocio vive en su propia carpeta con esta forma:

```
modules/<nombre>/
  <nombre>.routes.ts       # definición de endpoints Express
  <nombre>.controller.ts   # parsea request, llama al service, arma la respuesta
  <nombre>.service.ts      # lógica de negocio y acceso a datos (Prisma)
  <nombre>.types.ts        # tipos internos del módulo (si hacen falta más allá de @control-stock/shared)
```

La validación de entrada usa los schemas de Zod definidos en `@control-stock/shared`
(compartidos con el frontend), y los controllers se envuelven con `asyncHandler`
para que los errores lleguen al `errorHandler` central.

Los módulos se van agregando fase a fase:

| Módulo | Fase | Contenido |
|---|---|---|
| `auth` | 2 | login, refresh, /me |
| `users` | 2 | ABM de usuarios |
| `roles` | 2 | roles y permisos |
| `categories` | 3 | ABM de categorías |
| `brands` | 3 | ABM de marcas |
| `suppliers` | 3 | ABM de proveedores |
| `products` | 3 | ABM de productos, import/export |
| `inventory` | 4 | movimientos de stock, alertas |
| `purchases` | 5 | compras y su impacto en stock |
| `sales` | 6 | ventas, carrito, impacto en stock y caja |
| `customers` | 7 | ABM de clientes, historial |
| `cashregister` | 7 | apertura/cierre de caja |
| `reports` | 8 | reportes y export CSV/PDF |
| `audit` | 9 | consulta de logs de auditoría |
