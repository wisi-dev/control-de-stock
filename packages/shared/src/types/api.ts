/** Formas de respuesta consistentes para toda la API REST. */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginated<T> {
  success: true;
  data: PaginatedData<T>;
}

export interface ApiErrorBody {
  success: false;
  error: {
    message: string;
    code: string;
    /** Errores de validación por campo, cuando aplica (400). */
    fields?: Record<string, string>;
  };
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
