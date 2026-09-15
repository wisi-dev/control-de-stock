import { type ClassValue, clsx } from 'clsx';

/** Combina clases condicionales de Tailwind de forma legible. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
