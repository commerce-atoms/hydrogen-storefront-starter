import {reactRouter} from '@react-router/dev/vite';
import {defineConfig} from 'vite';

import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';

export default defineConfig({
  plugins: [hydrogen(), oxygen(), reactRouter()],
  // Vite 8 supports tsconfig paths natively, so the
  // `vite-tsconfig-paths` plugin is no longer required.
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
  },
  server: {
    allowedHosts: ['.tryhydrogen.dev'],
  },
});
