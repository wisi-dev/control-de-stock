import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // Los servicios comparten `prisma` (singleton) y algunas suites truncan
    // tablas en `beforeEach` — corriendo en paralelo se pisarían entre sí.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
