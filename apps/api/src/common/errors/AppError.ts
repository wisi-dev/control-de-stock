/**
 * Error de aplicación con código HTTP y código de error legible por máquina.
 * Todo lo que el negocio puede rechazar (validación, permisos, conflictos de
 * stock, etc.) debe lanzar una subclase de AppError, nunca un Error genérico,
 * para que el errorHandler pueda responder de forma consistente y segura.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', fields?: Record<string, string>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR', fields);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tenés permisos para esta acción') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/** Ej: intentar vender más stock del disponible sin permitir stock negativo. */
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION');
  }
}
