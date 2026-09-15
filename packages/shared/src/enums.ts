/**
 * Enums de dominio, compartidos entre backend y frontend.
 * Deben mantenerse sincronizados con los enums definidos en `apps/api/prisma/schema.prisma`.
 */

export const RoleName = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  ENCARGADO: 'ENCARGADO',
  VENDEDOR: 'VENDEDOR',
} as const;
export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const ProductStatus = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  DESCONTINUADO: 'DESCONTINUADO',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const MovementType = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
  AJUSTE_POSITIVO: 'AJUSTE_POSITIVO',
  AJUSTE_NEGATIVO: 'AJUSTE_NEGATIVO',
  VENTA: 'VENTA',
  COMPRA: 'COMPRA',
  DEVOLUCION: 'DEVOLUCION',
  CORRECCION: 'CORRECCION',
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

/** Movimientos que suman stock. El resto restan. */
export const POSITIVE_MOVEMENTS: MovementType[] = [
  MovementType.ENTRADA,
  MovementType.AJUSTE_POSITIVO,
  MovementType.COMPRA,
  MovementType.DEVOLUCION,
];

export const ReferenceType = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  MANUAL: 'MANUAL',
} as const;
export type ReferenceType = (typeof ReferenceType)[keyof typeof ReferenceType];

export const PurchaseStatus = {
  PENDIENTE: 'PENDIENTE',
  RECIBIDA: 'RECIBIDA',
  CANCELADA: 'CANCELADA',
} as const;
export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

export const SaleStatus = {
  COMPLETADA: 'COMPLETADA',
  ANULADA: 'ANULADA',
} as const;
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export const PaymentMethod = {
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  TARJETA: 'TARJETA',
  OTRO: 'OTRO',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const CashRegisterStatus = {
  ABIERTA: 'ABIERTA',
  CERRADA: 'CERRADA',
} as const;
export type CashRegisterStatus = (typeof CashRegisterStatus)[keyof typeof CashRegisterStatus];

export const CashMovementType = {
  INGRESO: 'INGRESO',
  EGRESO: 'EGRESO',
  VENTA: 'VENTA',
} as const;
export type CashMovementType = (typeof CashMovementType)[keyof typeof CashMovementType];

/**
 * Mapa de permisos por rol (fase 2 los persiste también en la tabla `permissions`
 * para poder configurarlos desde la UI; esto es el default de fábrica).
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMINISTRADOR: ['*'],
  ENCARGADO: [
    'products:*',
    'categories:*',
    'brands:*',
    'suppliers:*',
    'inventory:*',
    'purchases:*',
    'sales:*',
    'customers:*',
    'reports:read',
  ],
  VENDEDOR: ['sales:*', 'customers:*', 'products:read', 'cashregister:*'],
};
