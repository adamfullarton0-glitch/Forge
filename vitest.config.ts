import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      // Pure logic must be ≥90% per the Definition of Done. Browser-only I/O
      // wrappers (canvas/FileReader) can't run under jsdom, so their pure parts
      // are tested directly (e.g. scaleToFit) but the file is excluded from the
      // pure-logic gate rather than inflating it.
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.{test,spec}.ts', 'src/**/index.ts', 'src/lib/image.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
