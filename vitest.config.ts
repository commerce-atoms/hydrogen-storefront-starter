/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
