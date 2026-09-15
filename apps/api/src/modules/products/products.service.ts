import { Prisma, ProductStatus } from '@prisma/client';
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';
import { parseCsv, toCsv } from '../../common/utils/csv.js';

const include = { category: true, brand: true, supplier: true } satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof include }>;

/**
 * Prisma serializa `Decimal` como string en JSON (`JSON.stringify` usa el
 * `toJSON` de decimal.js) — sin esto, el frontend recibiría "1400.00" en vez
 * de 1400 y rompería cualquier `.toFixed()` o cálculo sobre el precio.
 */
export function serializeProduct(product: ProductWithRelations) {
  return {
    ...product,
    purchasePrice: Number(product.purchasePrice),
    salePrice: Number(product.salePrice),
  };
}

export async function list(query: ProductListQuery) {
  const where: Prisma.ProductWhereInput = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brandId ? { brandId: query.brandId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { sku: { contains: query.search, mode: 'insensitive' } },
            { barcode: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include,
      orderBy: { [query.sortBy]: query.sortDir } as Prisma.ProductOrderByWithRelationInput,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(serializeProduct),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getById(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include });
  if (!product) throw new NotFoundError('Producto');
  return serializeProduct(product);
}

async function assertRelationsExist(input: { categoryId?: string | null; brandId?: string | null; supplierId?: string | null }) {
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new NotFoundError('Categoría');
  }
  if (input.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw new NotFoundError('Marca');
  }
  if (input.supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
    if (!supplier) throw new NotFoundError('Proveedor');
  }
}

export async function create(input: CreateProductInput, actorId: string) {
  await assertRelationsExist(input);
  const product = await prisma.product.create({ data: input, include });
  await logAudit({ userId: actorId, action: 'PRODUCT_CREATED', entity: 'Product', entityId: product.id, metadata: { sku: product.sku } });
  return serializeProduct(product);
}

export async function update(id: string, input: UpdateProductInput, actorId: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Producto');
  await assertRelationsExist(input);

  const product = await prisma.product.update({ where: { id }, data: input, include });
  await logAudit({ userId: actorId, action: 'PRODUCT_UPDATED', entity: 'Product', entityId: id, metadata: input });
  return serializeProduct(product);
}

const EXPORT_HEADER = [
  'sku',
  'barcode',
  'name',
  'description',
  'category',
  'brand',
  'supplier',
  'purchasePrice',
  'salePrice',
  'currentStock',
  'minStock',
  'maxStock',
  'unit',
  'status',
];

export async function exportCsv(): Promise<string> {
  const products = await prisma.product.findMany({ include, orderBy: { name: 'asc' } });
  const rows = products.map((p) => [
    p.sku,
    p.barcode ?? '',
    p.name,
    p.description ?? '',
    p.category?.name ?? '',
    p.brand?.name ?? '',
    p.supplier?.businessName ?? '',
    p.purchasePrice.toString(),
    p.salePrice.toString(),
    p.currentStock,
    p.minStock,
    p.maxStock ?? '',
    p.unit,
    p.status,
  ]);
  return toCsv([EXPORT_HEADER, ...rows]);
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

async function findOrCreateCategoryId(name: string) {
  const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  return category.id;
}

async function findOrCreateBrandId(name: string) {
  const brand = await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
  return brand.id;
}

async function findSupplierIdByName(name: string) {
  const supplier = await prisma.supplier.findFirst({ where: { businessName: { equals: name, mode: 'insensitive' } } });
  return supplier?.id ?? null;
}

/**
 * Importa productos desde un CSV con las mismas columnas que `exportCsv`.
 * Actualiza por SKU si ya existe, crea si no. Categoría/Marca se crean
 * automáticamente si no existen (por nombre); Proveedor debe existir ya
 * (evita crear proveedores duplicados a partir de un nombre mal tipeado).
 */
export async function importCsv(csvText: string, actorId: string): Promise<ImportResult> {
  const rows = parseCsv(csvText);
  const result: ImportResult = { created: 0, updated: 0, errors: [] };
  if (rows.length < 2) return result;

  const header = rows[0]!.map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const dataRows = rows.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]!;
    const rowNumber = i + 2; // +1 por header, +1 porque las filas se numeran desde 1
    try {
      const sku = row[col('sku')]?.trim();
      const name = row[col('name')]?.trim();
      if (!sku) throw new Error('Falta el SKU');
      if (!name) throw new Error('Falta el nombre');

      const categoryName = row[col('category')]?.trim();
      const brandName = row[col('brand')]?.trim();
      const supplierName = row[col('supplier')]?.trim();

      const categoryId = categoryName ? await findOrCreateCategoryId(categoryName) : null;
      const brandId = brandName ? await findOrCreateBrandId(brandName) : null;
      const supplierId = supplierName ? await findSupplierIdByName(supplierName) : null;

      const purchasePriceRaw = row[col('purchasePrice')]?.trim();
      const salePriceRaw = row[col('salePrice')]?.trim();
      const statusRaw = row[col('status')]?.trim().toUpperCase();

      const data = {
        sku,
        name,
        barcode: row[col('barcode')]?.trim() || null,
        description: row[col('description')]?.trim() || null,
        categoryId,
        brandId,
        supplierId,
        purchasePrice: purchasePriceRaw ? Number(purchasePriceRaw) : 0,
        salePrice: salePriceRaw ? Number(salePriceRaw) : 0,
        minStock: Number(row[col('minStock')]?.trim() || 0),
        maxStock: row[col('maxStock')]?.trim() ? Number(row[col('maxStock')]!.trim()) : null,
        unit: row[col('unit')]?.trim() || 'unidad',
        status: (Object.values(ProductStatus) as string[]).includes(statusRaw ?? '')
          ? (statusRaw as ProductStatus)
          : ProductStatus.ACTIVO,
      };

      if (Number.isNaN(data.purchasePrice) || Number.isNaN(data.salePrice)) {
        throw new Error('Precio de compra/venta inválido');
      }

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        result.updated++;
      } else {
        await prisma.product.create({ data });
        result.created++;
      }
    } catch (err) {
      result.errors.push({ row: rowNumber, message: err instanceof Error ? err.message : 'Error desconocido' });
    }
  }

  await logAudit({
    userId: actorId,
    action: 'PRODUCTS_IMPORTED',
    entity: 'Product',
    metadata: { created: result.created, updated: result.updated, errorCount: result.errors.length },
  });

  return result;
}
