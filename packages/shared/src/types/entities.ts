import type {
  CashMovementType,
  CashRegisterStatus,
  MovementType,
  PaymentMethod,
  ProductStatus,
  PurchaseStatus,
  ReferenceType,
  RoleName,
  SaleStatus,
} from '../enums.js';

/**
 * Tipos de dominio compartidos entre API y frontend.
 * Reflejan el modelo de datos de Prisma pero con los `Decimal` de Postgres
 * representados como `number` (tal como llegan serializados por la API en JSON).
 */

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role extends BaseEntity {
  name: RoleName;
  description: string | null;
  /** Presente cuando el endpoint lo incluye explícitamente (ej: GET /api/roles). */
  permissions?: string[];
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  roleId: string;
  role?: Role;
  active: boolean;
  lastLoginAt: string | null;
}

export interface UserWithRole extends User {
  role: Role;
}

/** Forma del usuario autenticado, tal como la devuelven /auth/login y /auth/me. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: RoleName;
  permissions: string[];
}

export interface Category extends BaseEntity {
  name: string;
  description: string | null;
  active: boolean;
}

export interface Brand extends BaseEntity {
  name: string;
  active: boolean;
}

export interface Supplier extends BaseEntity {
  businessName: string;
  cuit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactName: string | null;
  notes: string | null;
  active: boolean;
}

export interface Customer extends BaseEntity {
  firstName: string;
  lastName: string;
  docNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
}

export interface Product extends BaseEntity {
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  category?: Category | null;
  brandId: string | null;
  brand?: Brand | null;
  supplierId: string | null;
  supplier?: Supplier | null;
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  unit: string;
  status: ProductStatus;
}

export interface InventoryMovement extends BaseEntity {
  productId: string;
  product?: Product;
  type: MovementType;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  reason: string | null;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  userId: string;
  user?: User;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Purchase extends BaseEntity {
  supplierId: string;
  supplier?: Supplier;
  userId: string;
  user?: User;
  status: PurchaseStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: PurchaseItem[];
}

export interface SaleItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale extends BaseEntity {
  customerId: string | null;
  customer?: Customer | null;
  userId: string;
  user?: User;
  cashRegisterId: string | null;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: SaleItem[];
}

export interface CashMovement extends BaseEntity {
  cashRegisterId: string;
  type: CashMovementType;
  amount: number;
  description: string | null;
  userId: string;
  user?: User;
}

export interface CashRegister extends BaseEntity {
  userId: string;
  user?: User;
  status: CashRegisterStatus;
  openingAmount: number;
  expectedAmount: number | null;
  closingAmount: number | null;
  difference: number | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  cashMovements?: CashMovement[];
}

export interface BusinessConfig {
  id: string;
  businessName: string;
  currency: string;
  allowNegativeStock: boolean;
  defaultTaxRate: number;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
}
