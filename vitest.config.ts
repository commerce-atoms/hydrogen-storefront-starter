/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Vite 8 supports tsconfig paths natively, so the
  // `vite-tsconfig-paths` plugin is no longer required.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Node environment for fast test execution without DOM overhead
    environment: 'node',
    globals: true,
    include: [
      'app/tests/**/*.test.ts', // Smoke tests (architecture)
      'app/platform/**/*.test.ts', // Platform unit tests
      'app/components/**/*.test.ts', // Component unit tests (if added)
    ],
  },
});
