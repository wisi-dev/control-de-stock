import { CashMovementType, CashRegisterStatus, Prisma } from '@prisma/client';
import type { CloseCashRegisterInput, CreateCashMovementInput, OpenCashRegisterInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { BusinessRuleError, NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

const include = {
  user: { select: { id: true, name: true } },
  cashMovements: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.CashRegisterInclude;

type CashRegisterWithRelations = Prisma.CashRegisterGetPayload<{ include: typeof include }>;

/** Prisma serializa `Decimal` como string en JSON; convertimos todo a number. */
function serialize(register: CashRegisterWithRelations) {
  return {
    ...register,
    openingAmount: Number(register.openingAmount),
    expectedAmount: register.expectedAmount === null ? null : Number(register.expectedAmount),
    closingAmount: register.closingAmount === null ? null : Number(register.closingAmount),
    difference: register.difference === null ? null : Number(register.difference),
    cashMovements: register.cashMovements.map((m) => ({ ...m, amount: Number(m.amount) })),
  };
}

export async function getCurrent() {
  const register = await prisma.cashRegister.findFirst({
    where: { status: CashRegisterStatus.ABIERTA },
    include,
    orderBy: { openedAt: 'desc' },
  });
  return register ? serialize(register) : null;
}

export async function history(page: number, pageSize: number) {
  const where: Prisma.CashRegisterWhereInput = { status: CashRegisterStatus.CERRADA };
  const [items, total] = await Promise.all([
    prisma.cashRegister.findMany({
      where,
      include,
      orderBy: { closedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cashRegister.count({ where }),
  ]);
  return {
    items: items.map(serialize),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function open(input: OpenCashRegisterInput, actorId: string) {
  const existing = await prisma.cashRegister.findFirst({ where: { status: CashRegisterStatus.ABIERTA } });
  if (existing) throw new BusinessRuleError('Ya hay una caja abierta');

  const register = await prisma.cashRegister.create({
    data: {
      userId: actorId,
      status: CashRegisterStatus.ABIERTA,
      openingAmount: input.openingAmount,
      notes: input.notes,
    },
    include,
  });

  await logAudit({ userId: actorId, action: 'CASH_REGISTER_OPENED', entity: 'CashRegister', entityId: register.id });
  return serialize(register);
}

function sumByType(movements: { type: CashMovementType; amount: Prisma.Decimal }[], type: CashMovementType) {
  return movements.filter((m) => m.type === type).reduce((sum, m) => sum + Number(m.amount), 0);
}

export async function close(id: string, input: CloseCashRegisterInput, actorId: string) {
  const register = await prisma.cashRegister.findUnique({ where: { id }, include: { cashMovements: true } });
  if (!register) throw new NotFoundError('Caja');
  if (register.status !== CashRegisterStatus.ABIERTA) {
    throw new BusinessRuleError('Solo se puede cerrar una caja abierta');
  }

  const ingresos = sumByType(register.cashMovements, CashMovementType.INGRESO);
  const egresos = sumByType(register.cashMovements, CashMovementType.EGRESO);
  const ventas = sumByType(register.cashMovements, CashMovementType.VENTA);
  const expectedAmount = Number(register.openingAmount) + ingresos + ventas - egresos;
  const difference = input.closingAmount - expectedAmount;

  const updated = await prisma.cashRegister.update({
    where: { id },
    data: {
      status: CashRegisterStatus.CERRADA,
      closingAmount: input.closingAmount,
      expectedAmount,
      difference,
      closedAt: new Date(),
      notes: input.notes ?? register.notes,
    },
    include,
  });

  await logAudit({
    userId: actorId,
    action: 'CASH_REGISTER_CLOSED',
    entity: 'CashRegister',
    entityId: id,
    metadata: { expectedAmount, closingAmount: input.closingAmount, difference },
  });

  return serialize(updated);
}

export async function addMovement(registerId: string, input: CreateCashMovementInput, actorId: string) {
  const register = await prisma.cashRegister.findUnique({ where: { id: registerId } });
  if (!register) throw new NotFoundError('Caja');
  if (register.status !== CashRegisterStatus.ABIERTA) {
    throw new BusinessRuleError('La caja no está abierta');
  }

  const movement = await prisma.cashMovement.create({
    data: {
      cashRegisterId: registerId,
      type: input.type as CashMovementType,
      amount: input.amount,
      description: input.description,
      userId: actorId,
    },
  });

  await logAudit({
    userId: actorId,
    action: 'CASH_MOVEMENT_CREATED',
    entity: 'CashMovement',
    entityId: movement.id,
    metadata: { type: input.type, amount: input.amount },
  });

  return getCurrent();
}
