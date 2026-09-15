import { config } from 'dotenv';

// dotenv no pisa variables ya definidas en process.env, así que si alguien
// corre los tests con DATABASE_URL ya exportada (ej: en CI) se respeta esa.
config({ path: '.env.test' });

if (!process.env.DATABASE_URL?.includes('_test')) {
  throw new Error(
    'DATABASE_URL no apunta a una base de test (debe incluir "_test" en el nombre). ' +
      'Los tests truncan tablas — copiá apps/api/.env.test.example a .env.test antes de correr `npm test`.',
  );
}
